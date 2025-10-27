-- Migration: Fix Profiles - FINAL VERSION (Auth trigger ensured)
-- Created: 2025-10-27
-- Description: Updates get_user_with_subscription and creates profiles for existing users
-- NOTE: Profile auto-creation will be handled by Supabase Auth hooks in dashboard

-- ============================================================================
-- 1. CREATE/UPDATE FUNCTION FOR PROFILE CREATION (for manual use)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_profile_for_user(user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', ''),
    COALESCE(au.raw_user_meta_data->>'avatar_url', ''),
    au.created_at,
    NOW()
  FROM auth.users au
  WHERE au.id = user_id
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.create_profile_for_user(UUID) SET search_path = public;

COMMENT ON FUNCTION public.create_profile_for_user IS 'Creates or updates profile for a specific user';

-- ============================================================================
-- 2. ENSURE ALL AUTH.USERS HAVE PROFILES
-- ============================================================================

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

  RAISE NOTICE 'Created % missing profile(s)', inserted_count;
END $$;

-- ============================================================================
-- 3. UPDATE GET_USER_WITH_SUBSCRIPTION FUNCTION
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

COMMENT ON FUNCTION public.get_user_with_subscription IS 'Get user profile with active subscription';

-- ============================================================================
-- 4. CREATE TRIGGER FUNCTION (will be used by Supabase Auth Hook)
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

ALTER FUNCTION public.handle_new_user() SET search_path = public;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to auto-create profile (use with Supabase Auth Hook)';

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create profile on user signup';

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  profile_count INTEGER;
  auth_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;

  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Auth users: %', auth_user_count;

  IF profile_count = auth_user_count THEN
    RAISE NOTICE '  - ✅ All auth.users have profiles!';
  ELSE
    RAISE NOTICE '  - ⚠️ Mismatch: % users without profiles', auth_user_count - profile_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT: Configure Supabase Auth Hook';
  RAISE NOTICE 'Go to: Authentication > Hooks';
  RAISE NOTICE 'Add hook: Run on "Insert" in auth.users';
  RAISE NOTICE 'Function: public.handle_new_user()';
  RAISE NOTICE '===============================================';
END $$;
