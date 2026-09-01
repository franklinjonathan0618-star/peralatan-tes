-- Update status from 'dibatalkan' to 'menunggu_sparepart' in perbaikan table
-- This aligns the database status with the UI status "Menunggu Sparepart"

UPDATE perbaikan
SET status = 'menunggu_sparepart'
WHERE status = 'dibatalkan';

-- Verify the update
SELECT id, no_perbaikan, no_lambung, status
FROM perbaikan
WHERE status IN ('menunggu_sparepart', 'dibatalkan');
