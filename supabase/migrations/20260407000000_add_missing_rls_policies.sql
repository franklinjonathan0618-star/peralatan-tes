-- Add missing RLS policies for tables that are missing INSERT/UPDATE/DELETE access
-- This fixes issues where data can be read but not written

-- ============== SEWA_ALAT ==============
-- Check if policies exist, if not create them
DROP POLICY IF EXISTS "Allow public insert to sewa_alat" ON public.sewa_alat;
DROP POLICY IF EXISTS "Allow public update to sewa_alat" ON public.sewa_alat;
DROP POLICY IF EXISTS "Allow public delete to sewa_alat" ON public.sewa_alat;

CREATE POLICY "Allow public insert to sewa_alat" 
ON public.sewa_alat 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to sewa_alat" 
ON public.sewa_alat 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to sewa_alat" 
ON public.sewa_alat 
FOR DELETE 
USING (true);

-- ============== RPA ==============
DROP POLICY IF EXISTS "Allow public insert to rpa" ON public.rpa;
DROP POLICY IF EXISTS "Allow public update to rpa" ON public.rpa;
DROP POLICY IF EXISTS "Allow public delete to rpa" ON public.rpa;

CREATE POLICY "Allow public insert to rpa" 
ON public.rpa 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to rpa" 
ON public.rpa 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to rpa" 
ON public.rpa 
FOR DELETE 
USING (true);

-- ============== RPA_DETAILS ==============
DROP POLICY IF EXISTS "Allow public insert to rpa_details" ON public.rpa_details;
DROP POLICY IF EXISTS "Allow public update to rpa_details" ON public.rpa_details;
DROP POLICY IF EXISTS "Allow public delete to rpa_details" ON public.rpa_details;

CREATE POLICY "Allow public insert to rpa_details" 
ON public.rpa_details 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to rpa_details" 
ON public.rpa_details 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to rpa_details" 
ON public.rpa_details 
FOR DELETE 
USING (true);

-- ============== PPA ==============
DROP POLICY IF EXISTS "Allow public insert to ppa" ON public.ppa;
DROP POLICY IF EXISTS "Allow public update to ppa" ON public.ppa;
DROP POLICY IF EXISTS "Allow public delete to ppa" ON public.ppa;

CREATE POLICY "Allow public insert to ppa" 
ON public.ppa 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to ppa" 
ON public.ppa 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to ppa" 
ON public.ppa 
FOR DELETE 
USING (true);

-- ============== SPAREPART ==============
DROP POLICY IF EXISTS "Allow public insert to sparepart" ON public.sparepart;
DROP POLICY IF EXISTS "Allow public update to sparepart" ON public.sparepart;
DROP POLICY IF EXISTS "Allow public delete to sparepart" ON public.sparepart;

CREATE POLICY "Allow public insert to sparepart" 
ON public.sparepart 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to sparepart" 
ON public.sparepart 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to sparepart" 
ON public.sparepart 
FOR DELETE 
USING (true);

-- ============== KEGIATAN_MEKANIK (Verify) ==============
DROP POLICY IF EXISTS "Allow public insert to kegiatan_mekanik" ON public.kegiatan_mekanik;
DROP POLICY IF EXISTS "Allow public update to kegiatan_mekanik" ON public.kegiatan_mekanik;
DROP POLICY IF EXISTS "Allow public delete to kegiatan_mekanik" ON public.kegiatan_mekanik;

CREATE POLICY "Allow public insert to kegiatan_mekanik" 
ON public.kegiatan_mekanik 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to kegiatan_mekanik" 
ON public.kegiatan_mekanik 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to kegiatan_mekanik" 
ON public.kegiatan_mekanik 
FOR DELETE 
USING (true);
