-- Create a function to check if username or email already exists
CREATE OR REPLACE FUNCTION public.check_existing_user(
  p_username TEXT,
  p_email TEXT
)
RETURNS TABLE(username_exists BOOLEAN, email_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.profiles WHERE username = p_username) AS username_exists,
    EXISTS(SELECT 1 FROM public.profiles WHERE email = p_email) AS email_exists;
END;
$$;

-- Create a function to manually create a user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_username TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role)
  VALUES (p_user_id, p_username, p_full_name, p_email, p_role)
  ON CONFLICT (id) 
  DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();
END;
$$;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to service role" ON public.profiles;

-- Create RLS policies for profiles table
CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to update own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Allow all access to service role"
    ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Update the handle_new_user function to work with the current schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')::TEXT,
    NEW.email
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_existing_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
