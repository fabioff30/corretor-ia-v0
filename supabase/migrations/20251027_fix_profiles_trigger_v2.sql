-- Migration: Fix Profiles Table and Auto-Creation Trigger (CORRECTED VERSION)
-- Created: 2025-10-27
-- Description:
--   1. Create trigger to auto-create profile when auth user signs up
--   2. Migrate existing users from custom 'users' table to profiles
--   3. Update get_user_with_subscription function to use profiles
--   4. Works with existing profiles table structure

-- ============================================================================
-- 1. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- The profiles table already exists with this structure:
-- - id (UUID, PK)
-- - email (TEXT)
-- - full_name (TEXT)
-- - avatar_url (TEXT)
-- - plan_type (TEXT: 'free' | 'pro' | 'admin')
-- - subscription_status (TEXT: 'active' | 'inactive' | 'past_due' | 'cancelled')
-- - subscription_expires_at (TIMESTAMPTZ)
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)

-- Add columns if they don't exist (safe to run multiple times)
DO $$
BEGIN
  -- Ensure subscription_status exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled'));
  END IF;

  -- Ensure subscription_expires_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- ============================================================================
-- 2. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
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
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
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
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
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
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = EXCLUDED.updated_at;

    RAISE NOTICE 'Migrated users from custom users table to profiles';
  END IF;
END $$;

-- ============================================================================
-- 6. ENSURE ALL AUTH.USERS HAVE PROFILES
-- ============================================================================

-- Create profiles for any auth.users that don't have one yet
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
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
        'name', p.full_name,
        'plan_type', p.plan_type,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'subscription', CASE
            WHEN s.id IS NOT NULL THEN json_build_object(
                'id', s.id,
                'user_id', s.user_id,
                'status', s.status,
                'plan', p.plan_type,
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
  missing_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;

  missing_profiles := auth_user_count - profile_count;

  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Auth users: %', auth_user_count;

  IF missing_profiles > 0 THEN
    RAISE WARNING '  - Missing profiles: % (will be created on next login)', missing_profiles;
  ELSE
    RAISE NOTICE '  - All auth.users have profiles!';
  END IF;

  RAISE NOTICE '===============================================';
END $$;
