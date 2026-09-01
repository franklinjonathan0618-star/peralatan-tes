
-- Create PPA (Permohonan Perbaikan Alat) table
CREATE TABLE IF NOT EXISTS public.ppa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tanggal DATE NOT NULL,
  no_ppa VARCHAR(50) NOT NULL UNIQUE,
  nama_alat VARCHAR(255) NOT NULL,
  no_lambung VARCHAR(50) NOT NULL,
  kerusakan TEXT NOT NULL,
  keterangan TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Add comments
COMMENT ON TABLE public.ppa IS 'Tabel untuk menyimpan data Permohonan Perbaikan Alat (PPA)';
COMMENT ON COLUMN public.ppa.tanggal IS 'Tanggal pembuatan PPA';
COMMENT ON COLUMN public.ppa.no_ppa IS 'Nomor PPA (format: PPA/YYMM/XXXX)';
COMMENT ON COLUMN public.ppa.nama_alat IS 'Nama alat yang akan diperbaiki';
COMMENT ON COLUMN public.ppa.no_lambung IS 'Nomor lambung alat';
COMMENT ON COLUMN public.ppa.kerusakan IS 'Deskripsi kerusakan';
COMMENT ON COLUMN public.ppa.keterangan IS 'Keterangan tambahan';
COMMENT ON COLUMN public.ppa.status IS 'Status PPA: pending, approved, atau rejected';
COMMENT ON COLUMN public.ppa.approved_by IS 'Nama user yang menyetujui/menolak';
COMMENT ON COLUMN public.ppa.approved_at IS 'Waktu persetujuan/penolakan';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ppa_no_ppa ON public.ppa(no_ppa);
CREATE INDEX IF NOT EXISTS idx_ppa_no_lambung ON public.ppa(no_lambung);
CREATE INDEX IF NOT EXISTS idx_ppa_status ON public.ppa(status);
CREATE INDEX IF NOT EXISTS idx_ppa_tanggal ON public.ppa(tanggal);

-- Enable RLS (Row Level Security)
ALTER TABLE public.ppa ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON public.ppa
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.ppa
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.ppa
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.ppa
  FOR DELETE USING (true);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_ppa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ppa_updated_at
BEFORE UPDATE ON public.ppa
FOR EACH ROW
EXECUTE FUNCTION update_ppa_updated_at();
