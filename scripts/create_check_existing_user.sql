-- Drop function if it exists
DROP FUNCTION IF EXISTS public.check_existing_user(TEXT, TEXT);

-- Create the function
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_existing_user(TEXT, TEXT) TO anon, authenticated;
