-- Enable Row Level Security
alter table profiles enable row level security;

-- Create or update admin user
DO $$
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      -- Password: admin123
      '$2a$10$N2zD5eX5X5X5X5X5X5X5Xe5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X',
      now(),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"email":"admin@example.com","email_verified":false,"phone_verified":false,"sub":"admin"}',
      false,
      '',
      '',
      '',
      ''
    );
    
    -- Get the user ID
    WITH admin_user AS (
      SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1
    )
    -- Create profile for admin user
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      email,
      role,
      created_at,
      updated_at
    ) SELECT 
        id,
        'admin',
        'Administrator',
        'admin@example.com',
        'admin',
        now(),
        now()
      FROM admin_user;
  END IF;
END $$;

-- Create policies for profiles table
CREATE POLICY "Enable read access for all users" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable update for users based on user_id" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
