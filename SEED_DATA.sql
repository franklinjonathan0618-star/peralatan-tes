-- ========================================
-- SEED DATA SCRIPT (FINAL - CORRECT SCHEMA)
-- ========================================

-- ========================================
-- STEP 1: TEMPORARILY ALTER kegiatan_mekanik.user_id TO NULLABLE
-- ========================================
ALTER TABLE public.kegiatan_mekanik
DROP CONSTRAINT IF EXISTS kegiatan_mekanik_user_id_fkey;

ALTER TABLE public.kegiatan_mekanik
ALTER COLUMN user_id DROP NOT NULL;

-- ========================================
-- 1. PPA TABLE
-- ========================================
DELETE FROM public.ppa WHERE id::text LIKE 'a0000000%';

INSERT INTO public.ppa (id, tanggal, no_ppa, nama_alat, no_lambung, kerusakan, keterangan, status, approved_by, approved_at, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '2026-03-15', 'PPA-2026-001', 'Excavator CAT 320', 'LB-001', 'Hydraulic pump rusak', 'Segera diperbaiki', 'approved', 'Admin User', NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', '2026-03-20', 'PPA-2026-002', 'Dozer Komatsu D65', 'LB-002', 'Track tertarik', 'Ganti track baru', 'approved', 'Admin User', NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000003', '2026-03-25', 'PPA-2026-003', 'Wheel Loader Volvo', 'LB-003', 'Engine overheating', 'Service pendingin', 'pending', NULL, NULL, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000004', '2026-03-28', 'PPA-2026-004', 'Motor Grader CAT', 'LB-004', 'Blade wear', 'Ganti blade', 'approved', 'Admin User', NOW(), NOW(), NOW());

-- ========================================
-- 2. ALAT_BERAT TABLE
-- ========================================
DELETE FROM public.alat_berat WHERE id::text LIKE 'b0000000%';

INSERT INTO public.alat_berat (id, nama_alat, no_lambung, jenis_alat, tahun_perolehan, nilai_perolehan, lokasi, status, keterangan, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Excavator CAT 320', 'LB-001', 'Excavator', 2020, 500000000, 'Lapangan B', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'Dozer Komatsu D65', 'LB-002', 'Dozer', 2019, 450000000, 'Lapangan A', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'Wheel Loader Volvo', 'LB-003', 'Wheel Loader', 2021, 400000000, 'Workshop', 'maintenance', 'Sedang perbaikan', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'Motor Grader CAT', 'LB-004', 'Motor Grader', 2018, 350000000, 'Lapangan C', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'Excavator Komatsu PC200', 'LB-005', 'Excavator', 2019, 420000000, 'Lapangan D', 'aktif', 'Kondisi baik', NOW(), NOW());

-- ========================================
-- 3. ALAT_PENDUKUNG TABLE
-- ========================================
DELETE FROM public.alat_pendukung WHERE id::text LIKE 'c0000000%';

INSERT INTO public.alat_pendukung (id, nama_alat, jenis_alat, tahun_perolehan, nilai_perolehan, lokasi, status, keterangan, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Kompresor Udara', 'Compressor', 2022, 50000000, 'Gudang A', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000002', 'Genset', 'Generator', 2021, 75000000, 'Gudang B', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'Pompa Air', 'Pump', 2020, 25000000, 'Gudang C', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000004', 'Welding Machine', 'Welder', 2019, 30000000, 'Workshop', 'aktif', 'Kondisi baik', NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000005', 'Forklift', 'Forklift', 2020, 120000000, 'Gudang D', 'aktif', 'Kondisi baik', NOW(), NOW());

-- ========================================
-- 4. TIMESHEET TABLE
-- ========================================
DELETE FROM public.timesheet WHERE id::text LIKE 'd0000000%';

INSERT INTO public.timesheet (id, tanggal, no_lambung, nama_operator, nama_alat, sesi1_jam_mulai, sesi1_jam_selesai, sesi2_jam_mulai, sesi2_jam_selesai, sesi3_jam_mulai, sesi3_jam_selesai, total_jam, aktivitas, lokasi, keterangan, bbm, oli_40, oli_10, oli_90, created_by, updated_by, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '2026-03-20', 'LB-001', 'Bambang Sutrisno', 'Excavator CAT 320', '06:00', '10:00', '10:30', '14:30', '15:00', '17:00', 8, 'Penggalian', 'Lapangan B', 'Kondisi baik', 45.5, 2.5, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000002', '2026-03-21', 'LB-002', 'Siti Nurhaliza', 'Dozer Komatsu D65', '06:00', '11:00', '12:00', '16:00', NULL, NULL, 9, 'Pengrataan tanah', 'Lapangan A', 'Lancar', 50.0, NULL, 1.5, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000003', '2026-03-22', 'LB-004', 'Bambang Sutrisno', 'Motor Grader CAT', '07:00', '12:00', '13:00', '17:00', NULL, NULL, 9, 'Pengurukan jalan', 'Lapangan C', 'Selesai', 55.0, 2.0, NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000004', '2026-03-23', 'LB-005', 'Siti Nurhaliza', 'Excavator Komatsu PC200', '06:00', '10:00', '10:30', '15:00', NULL, NULL, 8.5, 'Penggalian fondasi', 'Lapangan D', 'Lancar', 48.0, 2.0, NULL, NULL, NULL, NULL, NOW(), NOW());

-- ========================================
-- 5. KEGIATAN_MEKANIK TABLE
-- ========================================
DELETE FROM public.kegiatan_mekanik WHERE no_lambung LIKE 'LB-%' AND tanggal >= '2026-03-20';

INSERT INTO public.kegiatan_mekanik (tanggal, no_ppa, no_lambung, nama_alat, nama_mekanik, lokasi_pekerjaan, keterangan, user_id, created_at, updated_at)
VALUES
  ('2026-03-20', 'PPA-2026-001', 'LB-001', 'Excavator CAT 320', 'Rudi Hartono', 'Workshop', 'Routine Maintenance', NULL, NOW(), NOW()),
  ('2026-03-21', 'PPA-2026-002', 'LB-002', 'Dozer Komatsu D65', 'Rudi Hartono', 'Workshop', 'Perbaikan track', NULL, NOW(), NOW()),
  ('2026-03-22', 'PPA-2026-003', 'LB-003', 'Wheel Loader Volvo', 'Eka Putra', 'Workshop', 'General Service', NULL, NOW(), NOW()),
  ('2026-03-23', 'PPA-2026-004', 'LB-004', 'Motor Grader CAT', 'Rudi Hartono', 'Workshop', 'Pengecekan sistem', NULL, NOW(), NOW());

-- ========================================
-- 6. RPA TABLE
-- ========================================
DELETE FROM public.rpa WHERE rpa_id LIKE 'RPA-%';

INSERT INTO public.rpa (rpa_id, tanggal, item_pekerjaan, lokasi_proyek, created_at, updated_at)
VALUES
  ('RPA-2026-001', '2026-04-01', 'Major Service Excavator CAT 320', 'Workshop', NOW(), NOW()),
  ('RPA-2026-002', '2026-04-05', 'Minor Service Dozer Komatsu D65', 'Workshop', NOW(), NOW()),
  ('RPA-2026-003', '2026-04-10', 'Overhaul Motor Grader CAT', 'Workshop', NOW(), NOW()),
  ('RPA-2026-004', '2026-04-15', 'Minor Service Wheel Loader Volvo', 'Workshop', NOW(), NOW());

-- ========================================
-- 7. RPA_DETAILS TABLE
-- ========================================
INSERT INTO public.rpa_details (rpa_id, nama_alat, uraian_pekerjaan, mulai_tanggal, selesai_tanggal, keterangan, created_at, updated_at)
SELECT rpa.id, 'Excavator CAT 320', 'Ganti oli mesin dan filter', '2026-04-01', '2026-04-02', 'Oil SAE 15W-40', NOW(), NOW()
FROM public.rpa WHERE rpa_id = 'RPA-2026-001' LIMIT 1;

INSERT INTO public.rpa_details (rpa_id, nama_alat, uraian_pekerjaan, mulai_tanggal, selesai_tanggal, keterangan, created_at, updated_at)
SELECT rpa.id, 'Dozer Komatsu D65', 'Ganti bearing', '2026-04-05', '2026-04-06', 'Ball bearing SKF', NOW(), NOW()
FROM public.rpa WHERE rpa_id = 'RPA-2026-002' LIMIT 1;

-- ========================================
-- 8. PERBAIKAN TABLE
-- ========================================
DELETE FROM public.perbaikan WHERE no_perbaikan LIKE 'PRB-%';

INSERT INTO public.perbaikan (id, tanggal, no_perbaikan, nama_alat, no_lambung, kerusakan, keterangan, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2026-03-10', 'PRB-2026-001', 'Excavator CAT 320', 'LB-001', 'Ganti oli mesin dan filter', 'Oil SAE 15W-40', 'completed', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-15', 'PRB-2026-002', 'Dozer Komatsu D65', 'LB-002', 'Perbaikan track yang tertarik', 'Ganti track baru', 'in_progress', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-18', 'PRB-2026-003', 'Motor Grader CAT', 'LB-004', 'Servis hydraulic', 'Pembersihan sistem hydraulic', 'completed', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-22', 'PRB-2026-004', 'Excavator Komatsu PC200', 'LB-005', 'Penggantian belt', 'Ganti v-belt yang sudah tipis', 'completed', NOW(), NOW());

-- ========================================
-- 9. BBM_STOCKS TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.bbm_stocks WHERE jenis_bbm IN ('Solar', 'Bensin', 'Premium Diesel');

INSERT INTO public.bbm_stocks (id, jenis_bbm, jumlah_stock, satuan, harga_satuan, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Solar', 5500, 'Liter', 5500, 'Stok Solar', NOW(), NOW()),
  (gen_random_uuid(), 'Bensin', 2200, 'Liter', 7000, 'Stok Bensin', NOW(), NOW()),
  (gen_random_uuid(), 'Premium Diesel', 3300, 'Liter', 6500, 'Stok Premium Diesel', NOW(), NOW());

-- ========================================
-- 10. BBM_TRANSACTIONS TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.bbm_transactions WHERE tanggal >= '2026-03-20';

INSERT INTO public.bbm_transactions (id, tanggal, jenis_bbm, jumlah, satuan, no_lambung, nama_alat, cost, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2026-03-20', 'Solar', 45.5, 'Liter', 'LB-001', 'Excavator CAT 320', 250250, 'Isi bahan bakar', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-20', 'Solar', 50.0, 'Liter', 'LB-002', 'Dozer Komatsu D65', 275000, 'Isi bahan bakar', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-22', 'Solar', 55.0, 'Liter', 'LB-004', 'Motor Grader CAT', 302500, 'Isi bahan bakar', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-23', 'Solar', 48.0, 'Liter', 'LB-005', 'Excavator Komatsu PC200', 264000, 'Isi bahan bakar', NOW(), NOW());

-- ========================================
-- 11. OLI_STOCKS TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.oli_stocks WHERE jenis_oli IN ('Oli SAE 40', 'Oli SAE 10', 'Oli Hydraulic 46', 'Oli SAE 90');

INSERT INTO public.oli_stocks (id, jenis_oli, jumlah_stock, satuan, harga_satuan, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Oli SAE 40', 550, 'Liter', 80000, 'Stok Oli 40', NOW(), NOW()),
  (gen_random_uuid(), 'Oli SAE 10', 320, 'Liter', 85000, 'Stok Oli 10', NOW(), NOW()),
  (gen_random_uuid(), 'Oli Hydraulic 46', 430, 'Liter', 75000, 'Stok Oli Hydraulic', NOW(), NOW()),
  (gen_random_uuid(), 'Oli SAE 90', 275, 'Liter', 85000, 'Stok Oli 90', NOW(), NOW());

-- ========================================
-- 12. OLI_TRANSACTIONS TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.oli_transactions WHERE tanggal >= '2026-03-19';

INSERT INTO public.oli_transactions (id, tanggal, jenis_oli, jumlah, satuan, no_lambung, nama_alat, cost, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2026-03-20', 'Oli SAE 40', 2.5, 'Liter', 'LB-001', 'Excavator CAT 320', 200000, 'Isi oli mesin', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-21', 'Oli SAE 40', 1.5, 'Liter', 'LB-002', 'Dozer Komatsu D65', 120000, 'Servis oli', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-22', 'Oli SAE 90', 2.0, 'Liter', 'LB-004', 'Motor Grader CAT', 170000, 'Ganti oli gear', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-23', 'Oli SAE 40', 2.0, 'Liter', 'LB-005', 'Excavator Komatsu PC200', 160000, 'Isi oli mesin', NOW(), NOW());

-- ========================================
-- 13. SPAREPART TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.sparepart WHERE nama_sparepart IN ('Filter Oli', 'V-Belt', 'Ball Bearing SKF', 'Hydraulic Hose', 'Engine Gasket Set');

INSERT INTO public.sparepart (id, nama_sparepart, deskripsi, satuan, harga, jumlah_stock, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Filter Oli', 'Head Filter Caterpillar', 'pcs', 180000, 15, 'Filter Oli Baik', NOW(), NOW()),
  (gen_random_uuid(), 'V-Belt', 'Standard Gates Belt', 'pcs', 250000, 20, 'V-Belt Baik', NOW(), NOW()),
  (gen_random_uuid(), 'Ball Bearing SKF', '6204 ZZ SKF Bearing', 'pcs', 450000, 8, 'Ball Bearing Baik', NOW(), NOW()),
  (gen_random_uuid(), 'Hydraulic Hose', 'SAE 100R2A Parker Hose', 'meter', 75000, 50, 'Hose Baik', NOW(), NOW()),
  (gen_random_uuid(), 'Engine Gasket Set', '3S 4000 Gasket', 'pcs', 1200000, 5, 'Gasket Set Baik', NOW(), NOW());

-- ========================================
-- 14. SEWA_ALAT TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.sewa_alat WHERE tanggal_sewa >= '2026-03-01';

INSERT INTO public.sewa_alat (id, tanggal_sewa, tanggal_kembali, nama_alat, no_lambung, penyewa, biaya_sewa, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2026-03-01', '2026-03-15', 'Excavator CAT 320', 'LB-001', 'PT Konstruksi Buana', 15000000, 'Sewa 2 minggu selesai', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-20', '2026-04-03', 'Dozer Komatsu D65', 'LB-002', 'CV Pembangunan Jalan', 12000000, 'Sedang disewa', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-05', '2026-03-20', 'Motor Grader CAT', 'LB-004', 'PT Jaya Konstruksi', 8000000, 'Sewa 2 minggu selesai', NOW(), NOW());

-- ========================================
-- 15. SEWA_ALAT_EKSTERNAL TABLE (CORRECTED SCHEMA)
-- ========================================
DELETE FROM public.sewa_alat_eksternal WHERE tanggal_sewa >= '2026-03-08';

INSERT INTO public.sewa_alat_eksternal (id, tanggal_sewa, tanggal_kembali, nama_alat, vendor, biaya_sewa, keterangan, created_at, updated_at)
VALUES
  (gen_random_uuid(), '2026-03-10', '2026-03-25', 'Kompresor Udara', 'PT Konstruksi Bersama', 3000000, 'Selesai disewa', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-15', '2026-04-01', 'Genset', 'CV Mitra Listrik', 5000000, 'Sedang disewa', NOW(), NOW()),
  (gen_random_uuid(), '2026-03-08', '2026-03-22', 'Pompa Air', 'PT Air Bersih', 2000000, 'Selesai disewa', NOW(), NOW());

-- ========================================
-- STEP 2: RECREATE FK CONSTRAINT ON kegiatan_mekanik.user_id
-- ========================================
ALTER TABLE public.kegiatan_mekanik
ADD CONSTRAINT kegiatan_mekanik_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
SELECT 'alat_berat' as table_name, COUNT(*) as row_count FROM public.alat_berat
UNION ALL
SELECT 'alat_pendukung', COUNT(*) FROM public.alat_pendukung
UNION ALL
SELECT 'bbm_stocks', COUNT(*) FROM public.bbm_stocks
UNION ALL
SELECT 'bbm_transactions', COUNT(*) FROM public.bbm_transactions
UNION ALL
SELECT 'kegiatan_mekanik', COUNT(*) FROM public.kegiatan_mekanik
UNION ALL
SELECT 'oli_stocks', COUNT(*) FROM public.oli_stocks
UNION ALL
SELECT 'oli_transactions', COUNT(*) FROM public.oli_transactions
UNION ALL
SELECT 'perbaikan', COUNT(*) FROM public.perbaikan
UNION ALL
SELECT 'ppa', COUNT(*) FROM public.ppa
UNION ALL
SELECT 'rpa', COUNT(*) FROM public.rpa
UNION ALL
SELECT 'rpa_details', COUNT(*) FROM public.rpa_details
UNION ALL
SELECT 'sewa_alat', COUNT(*) FROM public.sewa_alat
UNION ALL
SELECT 'sewa_alat_eksternal', COUNT(*) FROM public.sewa_alat_eksternal
UNION ALL
SELECT 'sparepart', COUNT(*) FROM public.sparepart
UNION ALL
SELECT 'timesheet', COUNT(*) FROM public.timesheet
ORDER BY table_name;
