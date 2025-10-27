-- Migration: Fix Profiles Table and Auto-Creation Trigger
-- Created: 2025-10-27
-- Description:
--   1. Create profiles table if not exists
--   2. Create trigger to auto-create profile when auth user signs up
--   3. Migrate existing users from custom 'users' table to profiles
--   4. Update get_user_with_subscription function to use profiles

-- ============================================================================
-- 1. CREATE PROFILES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User info
  email TEXT,
  name TEXT,
  avatar_url TEXT,

  -- Subscription info
  is_pro BOOLEAN DEFAULT FALSE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles(is_pro);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Service role can manage all profiles'
  ) THEN
    CREATE POLICY "Service role can manage all profiles" ON public.profiles
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles with subscription information';
COMMENT ON COLUMN public.profiles.email IS 'User email (copied from auth.users)';
COMMENT ON COLUMN public.profiles.is_pro IS 'Whether user has active premium/pro plan';
COMMENT ON COLUMN public.profiles.plan_type IS 'Current plan: free, premium, or pro';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Subscription status: active, inactive, past_due, or cancelled';

-- ============================================================================
-- 2. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically create profile when new user signs up';

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTO PROFILE CREATION
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create profile on user signup';

-- ============================================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. MIGRATE EXISTING USERS FROM CUSTOM 'USERS' TABLE TO PROFILES
-- ============================================================================

-- Check if old 'users' table exists and migrate data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Migrate users that exist in auth.users but not in profiles
    INSERT INTO public.profiles (id, email, name, created_at, updated_at)
    SELECT
      u.id,
      u.email,
      u.name,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      updated_at = EXCLUDED.updated_at;

    RAISE NOTICE 'Migrated users from custom users table to profiles';
  END IF;
END $$;

-- ============================================================================
-- 6. ENSURE ALL AUTH.USERS HAVE PROFILES
-- ============================================================================

-- Create profiles for any auth.users that don't have one yet
INSERT INTO public.profiles (id, email, name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', ''),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. UPDATE GET_USER_WITH_SUBSCRIPTION FUNCTION TO USE PROFILES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_with_subscription(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'name', p.name,
        'is_pro', p.is_pro,
        'plan_type', p.plan_type,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'subscription', CASE
            WHEN s.id IS NOT NULL THEN json_build_object(
                'id', s.id,
                'user_id', s.user_id,
                'status', s.status,
                'plan', COALESCE(p.plan_type, 'free'),
                'start_date', s.start_date,
                'next_payment_date', s.next_payment_date,
                'created_at', s.created_at,
                'updated_at', s.updated_at
            )
            ELSE json_build_object(
                'id', 'free',
                'user_id', p.id,
                'status', 'active',
                'plan', 'free',
                'created_at', p.created_at,
                'updated_at', p.updated_at
            )
        END
    ) INTO result
    FROM public.profiles p
    LEFT JOIN public.subscriptions s ON p.id = s.user_id
        AND s.status IN ('authorized', 'active')
        AND (s.next_payment_date IS NULL OR s.next_payment_date > NOW())
    WHERE p.id = user_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_with_subscription IS 'Get user profile with active subscription (uses profiles table)';

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
  profile_count INTEGER;
  auth_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Profiles created: %', profile_count;
  RAISE NOTICE '  - Auth users: %', auth_user_count;

  IF profile_count < auth_user_count THEN
    RAISE WARNING 'Some auth.users do not have profiles! Check data integrity.';
  END IF;
END $$;
