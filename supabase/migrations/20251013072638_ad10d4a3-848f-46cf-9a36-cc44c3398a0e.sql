-- Fix Security Issue: Restrict kegiatan_mekanik table to authenticated users only
-- Drop the overly permissive "Enable all operations" policy
DROP POLICY IF EXISTS "Enable all operations for kegiatan_mekanik" ON public.kegiatan_mekanik;

-- Create restricted SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view kegiatan_mekanik"
ON public.kegiatan_mekanik
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);