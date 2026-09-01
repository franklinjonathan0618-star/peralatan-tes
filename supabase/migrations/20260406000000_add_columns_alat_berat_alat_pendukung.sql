-- Add missing columns to alat_berat table
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS merk VARCHAR(255);
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS tipe VARCHAR(255);
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS no_seri VARCHAR(100);
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS kondisi VARCHAR(50);
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS service_terakhir DATE;
ALTER TABLE public.alat_berat ADD COLUMN IF NOT EXISTS service_berikutnya DATE;

-- Add missing columns to alat_pendukung table
ALTER TABLE public.alat_pendukung ADD COLUMN IF NOT EXISTS merk VARCHAR(255);
ALTER TABLE public.alat_pendukung ADD COLUMN IF NOT EXISTS tipe VARCHAR(255);
-- no_lambung already exists in alat_pendukung table
