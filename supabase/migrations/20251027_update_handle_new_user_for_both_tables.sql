-- Migration: Update handle_new_user to create in both profiles AND users tables
-- Created: 2025-10-27
-- Description: Ensures Google OAuth and email signups create entries in both tables

-- ============================================================================
-- 1. CREATE USERS TABLE IF NOT EXISTS (for backwards compatibility)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. UPDATE handle_new_user FUNCTION to create in BOTH tables
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile in profiles table
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

  -- Also create entry in users table for backwards compatibility
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to auto-create profile in BOTH profiles and users tables';

-- ============================================================================
-- 3. SYNC EXISTING auth.users to users table
-- ============================================================================

DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  WITH synced_users AS (
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', ''),
      au.created_at,
      NOW()
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO synced_count FROM synced_users;

  RAISE NOTICE 'Synced % user(s) to users table', synced_count;
END $$;

-- ============================================================================
-- 4. CREATE INDEX ON USERS TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
  auth_users_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM public.users;
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO auth_users_count FROM auth.users;

  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  - Auth users: %', auth_users_count;
  RAISE NOTICE '  - Profiles: %', profiles_count;
  RAISE NOTICE '  - Users: %', users_count;

  IF users_count = auth_users_count AND profiles_count = auth_users_count THEN
    RAISE NOTICE '  - ✅ All tables in sync!';
  ELSE
    RAISE NOTICE '  - ⚠️ Tables not in sync';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger updated: handle_new_user() now creates in BOTH tables';
  RAISE NOTICE '===============================================';
END $$;
