-- SECURITY FIX: Equipment Repair Records Exposed to Public
-- Issue: 'perbaikan' table with 2,418 repair records is publicly readable
-- Fix: Remove public read access and require authentication

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perbaikan;

-- Create secure policy requiring authentication for reading repair records
CREATE POLICY "Authenticated users can view perbaikan" 
ON public.perbaikan 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Verify other policies are properly secured (they should already require auth)
-- The existing policies for INSERT, UPDATE, DELETE already check auth.uid() IS NOT NULL
-- which is correct - keeping those as they are secure