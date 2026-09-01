-- =================================================================
-- SKRIP SQL: PENAMBAHAN KOLOM LOKASI SEBELUMNYA
-- Database: MySQL (peralatanmwt)
-- =================================================================

-- 1. Data Alat Berat
ALTER TABLE `alat_berat` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `lokasi`;

-- 2. Data Alat Pendukung
ALTER TABLE `alat_pendukung` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `lokasi`;

-- 3. Sewa Alat
ALTER TABLE `sewa_alat` ADD COLUMN IF NOT EXISTS `lokasi` VARCHAR(255) NULL;
ALTER TABLE `sewa_alat` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL;
ALTER TABLE `sewa_alat_eksternal` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `lokasi_proyek`;

-- 4. Kegiatan Mekanik
ALTER TABLE `kegiatan_mekanik` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `lokasi_pekerjaan`;

-- 5. Permohonan Perbaikan Alat (PPA)
ALTER TABLE `ppa` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `no_lambung`;

-- 6. Form Perbaikan
ALTER TABLE `perbaikan` ADD COLUMN IF NOT EXISTS `lokasi_sebelumnya` VARCHAR(255) NULL AFTER `lokasi_perbaikan`;
