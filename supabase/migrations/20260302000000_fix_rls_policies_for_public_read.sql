-- Fix RLS policies to allow public READ access
-- This allows authenticated app users to read data even without Supabase auth

-- ============== ALAT_BERAT ==============
DROP POLICY IF EXISTS "Authenticated users can view alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Allow public read access to alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Authenticated users can insert alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Authenticated users can update alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Authenticated users can delete alat_berat" ON public.alat_berat;

CREATE POLICY "Allow public read access to alat_berat" 
ON public.alat_berat 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to alat_berat" 
ON public.alat_berat 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to alat_berat" 
ON public.alat_berat 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to alat_berat" 
ON public.alat_berat 
FOR DELETE 
USING (true);

-- ============== ALAT_PENDUKUNG ==============
DROP POLICY IF EXISTS "Authenticated users can view alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Allow public read access to alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Authenticated users can insert alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Authenticated users can update alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Authenticated users can delete alat_pendukung" ON public.alat_pendukung;

CREATE POLICY "Allow public read access to alat_pendukung" 
ON public.alat_pendukung 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to alat_pendukung" 
ON public.alat_pendukung 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to alat_pendukung" 
ON public.alat_pendukung 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to alat_pendukung" 
ON public.alat_pendukung 
FOR DELETE 
USING (true);

-- ============== TIMESHEET ==============
-- Note: timesheet already allows public read (USING true), but make sure it's consistent
DROP POLICY IF EXISTS "Users can view all timesheets" ON public.timesheet;

CREATE POLICY "Allow public read access to timesheet" 
ON public.timesheet 
FOR SELECT 
USING (true);

-- ============== PERBAIKAN ==============
-- Note: perbaikan already allows public read, keeping consistent
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perbaikan;

CREATE POLICY "Allow public read access to perbaikan" 
ON public.perbaikan 
FOR SELECT 
USING (true);

-- ============== BBM_TRANSACTIONS ==============
DROP POLICY IF EXISTS "Authenticated users can view bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Allow public read access to bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Authenticated users can update bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete bbm_transactions" ON public.bbm_transactions;

CREATE POLICY "Allow public read access to bbm_transactions" 
ON public.bbm_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to bbm_transactions" 
ON public.bbm_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to bbm_transactions" 
DROP POLICY IF EXISTS "Allow public read access to oli_stocks" ON public.oli_stocks;
DROP POLICY IF EXISTS "Authenticated users can insert oli_stocks" ON public.oli_stocks;
DROP POLICY IF EXISTS "Authenticated users can update oli_stocks" ON public.oli_stocks;
DROP POLICY IF EXISTS "Authenticated users can delete oli_stocks" ON public.oli_stocks;

CREATE POLICY "Allow public read access to oli_stocks" 
ON public.oli_stocks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to oli_stocks" 
ON public.oli_stocks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to oli_stocks" 
ON public.oli_stocks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to oli_stocks" 
ON public.oli_stocks 
FOR DELETE 
USING (true);

-- ============== BBM_STOCKS ==============
DROP POLICY IF EXISTS "Authenticated users can view bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Allow public read access to bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Authenticated users can insert bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Authenticated users can update bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Authenticated users can delete bbm_stocks" ON public.bbm_stocks;

CREATE POLICY "Allow public read access to bbm_stocks" 
ON public.bbm_stocks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to bbm_stocks" 
ON public.bbm_stocks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to bbm_stocks" 
ON public.bbm_stocks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to bbm_stocks" 
ON public.bbm_stocks 
FOR DELETEY IF EXISTS "Allow public read access to oli_transactions" ON public.oli_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert oli_transactions" ON public.oli_transactions;
DROP POLICY IF EXISTS "Authenticated users can update oli_transactions" ON public.oli_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete oli_transactions" ON public.oli_transactions;

CREATE POLICY "Allow public read access to oli_transactions" 
ON public.oli_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to oli_transactions" 
ON public.oli_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to oli_transactions" 
ON public.oli_transactions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to oli_transactions" 
ON public.oli_transactions 
FOR DELETE 
USING (true);

-- ============== OLI_STOCKS ==============
DROP POLICY IF EXISTS "Authenticated users can view oli_stocks" ON public.oli_stocks;

CREATE POLICY "Allow public read access to oli_stocks" 
ON public.oli_stocks 
FOR SELECT 
USING (true);

-- ============== BBM_STOCKS ==============
DROP POLICY IF EXISTS "Authenticated users can view bbm_stocks" ON public.bbm_stocks;

CREATE POLICY "Allow public read access to bbm_stocks" 
ON public.bbm_stocks 
FOR SELECT 
USING (true);
