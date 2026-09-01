-- CRITICAL SECURITY FIXES - Phase 1: RLS Policy Updates

-- 1. Fix profiles table - remove dangerous public INSERT policy and secure it
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- Create secure INSERT policy for profiles (only during authenticated signup)
CREATE POLICY "Users can insert their own profile during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Fix overly permissive policies on business-critical tables
-- These currently have "true" policies that expose all data

-- Update alat_berat (heavy equipment) - require authentication
DROP POLICY IF EXISTS "Enable all operations for alat_berat" ON public.alat_berat;

CREATE POLICY "Authenticated users can view alat_berat" 
ON public.alat_berat 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert alat_berat" 
ON public.alat_berat 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alat_berat" 
ON public.alat_berat 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete alat_berat" 
ON public.alat_berat 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update alat_pendukung (supporting equipment) - require authentication  
DROP POLICY IF EXISTS "Enable all operations for alat_pendukung" ON public.alat_pendukung;

CREATE POLICY "Authenticated users can view alat_pendukung" 
ON public.alat_pendukung 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert alat_pendukung" 
ON public.alat_pendukung 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alat_pendukung" 
ON public.alat_pendukung 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete alat_pendukung" 
ON public.alat_pendukung 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update BBM transactions (fuel transactions) - require authentication
DROP POLICY IF EXISTS "Enable all operations for bbm_transactions" ON public.bbm_transactions;

CREATE POLICY "Authenticated users can view bbm_transactions" 
ON public.bbm_transactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert bbm_transactions" 
ON public.bbm_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update bbm_transactions" 
ON public.bbm_transactions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete bbm_transactions" 
ON public.bbm_transactions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update oil transactions - require authentication
DROP POLICY IF EXISTS "Enable all operations for oli_transactions" ON public.oli_transactions;

CREATE POLICY "Authenticated users can view oli_transactions" 
ON public.oli_transactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert oli_transactions" 
ON public.oli_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update oli_transactions" 
ON public.oli_transactions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete oli_transactions" 
ON public.oli_transactions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update sparepart (spare parts) - require authentication
DROP POLICY IF EXISTS "Enable all operations for sparepart" ON public.sparepart;

CREATE POLICY "Authenticated users can view sparepart" 
ON public.sparepart 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sparepart" 
ON public.sparepart 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sparepart" 
ON public.sparepart 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sparepart" 
ON public.sparepart 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update RPA (project approval) - require authentication
DROP POLICY IF EXISTS "Enable all operations for rpa" ON public.rpa;

CREATE POLICY "Authenticated users can view rpa" 
ON public.rpa 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert rpa" 
ON public.rpa 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update rpa" 
ON public.rpa 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete rpa" 
ON public.rpa 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update RPA details - require authentication
DROP POLICY IF EXISTS "Enable all operations for rpa_details" ON public.rpa_details;

CREATE POLICY "Authenticated users can view rpa_details" 
ON public.rpa_details 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert rpa_details" 
ON public.rpa_details 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update rpa_details" 
ON public.rpa_details 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete rpa_details" 
ON public.rpa_details 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Clean up conflicting policies on sewa_alat_eksternal
DROP POLICY IF EXISTS "Enable all operations for sewa_alat_eksternal" ON public.sewa_alat_eksternal;
-- Keep the more specific policies that already exist