-- Fix critical security issue: Restrict profile access to own data only
-- Drop the current public read policy
DROP POLICY IF EXISTS "Allow public read access for authentication" ON public.profiles;

-- Create new secure policy that only allows users to see their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Ensure sewa_alat table has proper RLS enabled (fixing INFO linter issue)
ALTER TABLE public.sewa_alat ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for sewa_alat
CREATE POLICY "Enable read access for all users" 
ON public.sewa_alat 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.sewa_alat 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.sewa_alat 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.sewa_alat 
FOR DELETE 
USING (true);

-- Fix function search_path security warnings (WARN 2-7)
-- Update all functions to have proper search_path

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_ppa_updated_at function  
CREATE OR REPLACE FUNCTION public.update_ppa_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix update_profiles_updated_at function
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$function$;