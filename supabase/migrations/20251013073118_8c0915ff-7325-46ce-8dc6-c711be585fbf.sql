-- Update function to not insert profile manually (trigger will handle it)
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@system.local';
  admin_username text := 'admin';
  admin_password text := 'admin123';
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE username = admin_username
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Admin user already exists',
      'user_id', admin_user_id
    );
  END IF;
  
  -- Generate new UUID for admin user
  admin_user_id := gen_random_uuid();
  
  -- Create admin user in auth.users (trigger will create profile automatically)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', admin_username, 'full_name', 'Administrator', 'role', 'admin'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Wait a moment and verify profile was created by trigger
  PERFORM pg_sleep(0.5);
  
  -- Update email in profile if needed
  UPDATE public.profiles
  SET full_name = 'Administrator',
      role = 'admin'
  WHERE id = admin_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user created successfully. Login dengan username: admin, password: admin123',
    'user_id', admin_user_id,
    'email', admin_email,
    'username', admin_username
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Execute the function to create admin user
SELECT public.create_admin_user();