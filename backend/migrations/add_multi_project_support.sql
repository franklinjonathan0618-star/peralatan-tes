-- Migration untuk mendukung multi-project
-- Jalankan script ini di database MySQL Anda

-- 1. Buat tabel projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(255) PRIMARY KEY,
  `nama_project` VARCHAR(255) NOT NULL,
  `cabang` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tambahkan kolom project_id ke semua tabel utama
-- Alat Berat
ALTER TABLE `alat_berat` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `alat_berat` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Alat Pendukung
ALTER TABLE `alat_pendukung` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `alat_pendukung` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- RPA dan RPA Details
ALTER TABLE `rpa` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `rpa` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

ALTER TABLE `rpa_details` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `rpa_details` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Perbaikan
ALTER TABLE `perbaikan` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `perbaikan` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- PPA
ALTER TABLE `ppa` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `ppa` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Kegiatan Mekanik
ALTER TABLE `kegiatan_mekanik` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `kegiatan_mekanik` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Stock BBM
ALTER TABLE `bbm_stocks` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `bbm_stocks` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

ALTER TABLE `bbm_transactions` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `bbm_transactions` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Stock Oli
ALTER TABLE `oli_stocks` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `oli_stocks` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

ALTER TABLE `oli_transactions` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `oli_transactions` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Stock Sparepart
ALTER TABLE `sparepart` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `sparepart` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

ALTER TABLE `sparepart_transactions` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `sparepart_transactions` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Time Sheet
ALTER TABLE `timesheet` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `timesheet` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Pemutihan
ALTER TABLE `pemutihan` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `pemutihan` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Sewa Alat
ALTER TABLE `sewa_alat` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `sewa_alat` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

ALTER TABLE `sewa_alat_eksternal` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `sewa_alat_eksternal` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- User Permissions (untuk isolasi permission per project)
ALTER TABLE `user_permissions` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `user_permissions` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Audit Logs
ALTER TABLE `audit_logs` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `audit_logs` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- Login Histories
ALTER TABLE `login_histories` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `login_histories` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- SILO Dokumen
ALTER TABLE `silo_dokumen` ADD COLUMN IF NOT EXISTS `project_id` VARCHAR(255) NULL AFTER `id`;
ALTER TABLE `silo_dokumen` ADD INDEX IF NOT EXISTS `idx_project_id` (`project_id`);

-- 3. Buat project default untuk data yang sudah ada
INSERT INTO `projects` (`id`, `nama_project`, `cabang`) 
VALUES ('default-project', 'Project Default', 'Papua')
ON DUPLICATE KEY UPDATE `nama_project` = 'Project Default';

-- 4. Update semua data yang sudah ada dengan project_id default
UPDATE `alat_berat` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `alat_pendukung` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `rpa` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `rpa_details` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `perbaikan` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `ppa` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `kegiatan_mekanik` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `bbm_stocks` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `bbm_transactions` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `oli_stocks` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `oli_transactions` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `sparepart` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `sparepart_transactions` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `timesheet` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `pemutihan` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `sewa_alat` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `sewa_alat_eksternal` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `user_permissions` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `audit_logs` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `login_histories` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;
UPDATE `silo_dokumen` SET `project_id` = 'default-project' WHERE `project_id` IS NULL;

-- 5. Tambahkan foreign key constraint untuk project_id (opsional, jika ingin strict referential integrity)
-- Uncomment baris berikut jika ingin menambahkan constraint
-- ALTER TABLE `alat_berat` ADD CONSTRAINT `fk_alat_berat_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- Lakukan hal yang sama untuk tabel lain...
