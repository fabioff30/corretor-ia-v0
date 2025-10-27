-- Migration: Fix Profiles Table and Auto-Creation Trigger (v4 - SYNTAX FIXED)
-- Created: 2025-10-27
-- Description:
--   1. Create trigger to auto-create profile when auth user signs up
--   2. Update get_user_with_subscription function to use profiles
--   3. Ensure all existing auth.users have profiles
--   REMOVED: Migration from old 'users' table (permission issues)

-- ============================================================================
-- 1. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

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

    RAISE NOTICE 'Added subscription_status column';
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

    RAISE NOTICE 'Added subscription_expires_at column';
  END IF;

  RAISE NOTICE 'Columns verified/added';
END $$;

-- Create indexes (if not exist)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
  CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);
  CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

  RAISE NOTICE 'Indexes created/verified';
END $$;

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
-- 5. ENSURE ALL AUTH.USERS HAVE PROFILES
-- ============================================================================

-- Create profiles for any auth.users that don't have one yet
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  WITH inserted_profiles AS (
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', ''),
      au.created_at,
      NOW()
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted_profiles;

  IF inserted_count > 0 THEN
    RAISE NOTICE 'Created % missing profile(s)', inserted_count;
  ELSE
    RAISE NOTICE 'All auth.users already have profiles';
  END IF;
END $$;

-- ============================================================================
-- 6. UPDATE GET_USER_WITH_SUBSCRIPTION FUNCTION TO USE PROFILES
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
-- 7. GRANT PERMISSIONS
-- ============================================================================

DO $$
BEGIN
  -- Grant access to authenticated users
  GRANT SELECT, UPDATE ON public.profiles TO authenticated;
  GRANT ALL ON public.profiles TO service_role;

  RAISE NOTICE 'Permissions granted';
END $$;

-- ============================================================================
-- 8. VERIFICATION
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
  RAISE NOTICE '✅ Migration v4 complete!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Auth users: %', auth_user_count;

  IF missing_profiles > 0 THEN
    RAISE WARNING '  - Missing profiles: % (will be created on next login)', missing_profiles;
  ELSE
    RAISE NOTICE '  - ✅ All auth.users have profiles!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test PIX payment flow';
  RAISE NOTICE '  2. Verify profile creation on signup';
  RAISE NOTICE '  3. Check console logs for [Auth] and [Link Payments]';
  RAISE NOTICE '===============================================';
END $$;
