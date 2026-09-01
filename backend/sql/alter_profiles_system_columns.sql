-- ============================================================
-- MIGRATION: Tambah kolom baru ke tabel profiles
-- Jalankan di phpMyAdmin > SQL Editor
-- Database: peralatan.bekasi2017@gmail.comsproject 2
-- ============================================================

-- 1. Tambah kolom password (SHA-256 hash)
ALTER TABLE `profiles`
  ADD COLUMN IF NOT EXISTS `password` VARCHAR(64) NULL AFTER `email`;

-- 2. Tambah kolom is_active (1 = aktif, 0 = nonaktif)
ALTER TABLE `profiles`
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `password`;

-- 3. Tambah kolom last_login
ALTER TABLE `profiles`
  ADD COLUMN IF NOT EXISTS `last_login` DATETIME NULL AFTER `is_active`;

-- 4. Tambah kolom last_activity
ALTER TABLE `profiles`
  ADD COLUMN IF NOT EXISTS `last_activity` DATETIME NULL AFTER `last_login`;

-- ============================================================
-- Verifikasi: cek struktur tabel profiles setelah migrasi
-- ============================================================
DESCRIBE `profiles`;
