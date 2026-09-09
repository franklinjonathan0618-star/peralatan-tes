-- ========================================================================================
-- Migration: Tambah Kolom jumlah_masuk dan jumlah_keluar ke Tabel oli_transactions
-- ========================================================================================

-- JALANKAN QUERY BERIKUT DI DATABASE MySQL ANDA:
ALTER TABLE `oli_transactions`
  ADD COLUMN `jumlah_masuk` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `jumlah`,
  ADD COLUMN `jumlah_keluar` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `jumlah_masuk`;

-- (Sangat disarankan) Sinkronkan data historis yang sudah ada agar jumlah_masuk dan jumlah_keluar terisi:
UPDATE `oli_transactions`
SET
  `jumlah_masuk` = CASE WHEN `jenis` IN ('pembelian', 'sisa_stock') THEN `jumlah` ELSE 0 END,
  `jumlah_keluar` = CASE WHEN `jenis` = 'pemakaian' THEN `jumlah` ELSE 0 END
WHERE `jumlah_masuk` = 0 AND `jumlah_keluar` = 0 AND `jumlah` > 0;

-- ----------------------------------------------------------------------------------------
-- CATATAN TAMBAHAN (Jika menggunakan PostgreSQL / Supabase):
-- ----------------------------------------------------------------------------------------
-- ALTER TABLE public.oli_transactions
--   ADD COLUMN IF NOT EXISTS jumlah_masuk NUMERIC DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS jumlah_keluar NUMERIC DEFAULT 0;
--
-- UPDATE public.oli_transactions
-- SET
--   jumlah_masuk = CASE WHEN jenis IN ('pembelian', 'sisa_stock') THEN jumlah ELSE 0 END,
--   jumlah_keluar = CASE WHEN jenis = 'pemakaian' THEN jumlah ELSE 0 END
-- WHERE (jumlah_masuk = 0 OR jumlah_masuk IS NULL) AND (jumlah_keluar = 0 OR jumlah_keluar IS NULL) AND jumlah > 0;
