-- Migration: Secure RPC function for creating user profiles at signup
-- Run this in Supabase Dashboard → SQL Editor

-- A SECURITY DEFINER function bypasses RLS, so it can insert into profiles
-- even when the caller has no session (email not yet confirmed).
-- The user_id is validated against auth.users to prevent abuse.
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id  UUID,
  username TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the user actually exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.profiles (id, username, role)
  VALUES (user_id, lower(username), 'user')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Allow anonymous (unauthenticated) callers to invoke this function
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT) TO anon;

-- Also fix the handle_new_user trigger to lowercase the username for consistency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    lower(COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    )),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
