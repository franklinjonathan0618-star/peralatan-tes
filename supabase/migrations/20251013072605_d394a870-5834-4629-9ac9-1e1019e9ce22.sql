-- Fix Security Issue: Restrict profiles table to authenticated users only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix Security Issue: Restrict timesheet table to authenticated users only
DROP POLICY IF EXISTS "Users can view all timesheets" ON public.timesheet;

CREATE POLICY "Authenticated users can view timesheets"
ON public.timesheet
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);