-- Migration: Tambah kolom jumlah_masuk dan jumlah_keluar ke tabel oli_transactions
ALTER TABLE `oli_transactions`
  ADD COLUMN `jumlah_masuk` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `jumlah`,
  ADD COLUMN `jumlah_keluar` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `jumlah_masuk`;

-- Update data yang sudah ada agar terisi otomatis
UPDATE `oli_transactions`
SET
  `jumlah_masuk` = CASE WHEN `jenis` IN ('pembelian', 'sisa_stock') THEN `jumlah` ELSE 0 END,
  `jumlah_keluar` = CASE WHEN `jenis` = 'pemakaian' THEN `jumlah` ELSE 0 END
WHERE `jumlah_masuk` = 0 AND `jumlah_keluar` = 0 AND `jumlah` > 0;
