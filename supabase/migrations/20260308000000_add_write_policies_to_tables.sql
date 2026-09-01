-- Add INSERT, UPDATE, DELETE policies to all tables that were missing them
-- This fixes the issue where data could be read but not written to the database

-- ============== ALAT_BERAT ==============
DROP POLICY IF EXISTS "Allow public insert to alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Allow public update to alat_berat" ON public.alat_berat;
DROP POLICY IF EXISTS "Allow public delete to alat_berat" ON public.alat_berat;

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
DROP POLICY IF EXISTS "Allow public insert to alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Allow public update to alat_pendukung" ON public.alat_pendukung;
DROP POLICY IF EXISTS "Allow public delete to alat_pendukung" ON public.alat_pendukung;

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
DROP POLICY IF EXISTS "Allow public insert to timesheet" ON public.timesheet;
DROP POLICY IF EXISTS "Allow public update to timesheet" ON public.timesheet;
DROP POLICY IF EXISTS "Allow public delete to timesheet" ON public.timesheet;

CREATE POLICY "Allow public insert to timesheet" 
ON public.timesheet 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to timesheet" 
ON public.timesheet 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to timesheet" 
ON public.timesheet 
FOR DELETE 
USING (true);

-- ============== PERBAIKAN ==============
DROP POLICY IF EXISTS "Allow public insert to perbaikan" ON public.perbaikan;
DROP POLICY IF EXISTS "Allow public update to perbaikan" ON public.perbaikan;
DROP POLICY IF EXISTS "Allow public delete to perbaikan" ON public.perbaikan;

CREATE POLICY "Allow public insert to perbaikan" 
ON public.perbaikan 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to perbaikan" 
ON public.perbaikan 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to perbaikan" 
ON public.perbaikan 
FOR DELETE 
USING (true);

-- ============== BBM_TRANSACTIONS ==============
DROP POLICY IF EXISTS "Allow public insert to bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Allow public update to bbm_transactions" ON public.bbm_transactions;
DROP POLICY IF EXISTS "Allow public delete to bbm_transactions" ON public.bbm_transactions;

CREATE POLICY "Allow public insert to bbm_transactions" 
ON public.bbm_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to bbm_transactions" 
ON public.bbm_transactions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete to bbm_transactions" 
ON public.bbm_transactions 
FOR DELETE 
USING (true);

-- ============== OLI_TRANSACTIONS ==============
DROP POLICY IF EXISTS "Allow public insert to oli_transactions" ON public.oli_transactions;
DROP POLICY IF EXISTS "Allow public update to oli_transactions" ON public.oli_transactions;
DROP POLICY IF EXISTS "Allow public delete to oli_transactions" ON public.oli_transactions;

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
DROP POLICY IF EXISTS "Allow public insert to oli_stocks" ON public.oli_stocks;
DROP POLICY IF EXISTS "Allow public update to oli_stocks" ON public.oli_stocks;
DROP POLICY IF EXISTS "Allow public delete to oli_stocks" ON public.oli_stocks;

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
DROP POLICY IF EXISTS "Allow public insert to bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Allow public update to bbm_stocks" ON public.bbm_stocks;
DROP POLICY IF EXISTS "Allow public delete to bbm_stocks" ON public.bbm_stocks;

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
FOR DELETE 
USING (true);
