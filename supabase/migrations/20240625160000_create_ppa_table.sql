-- Create PPA (Permohonan Perbaikan Alat) table
CREATE TABLE IF NOT EXISTS public.ppa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tanggal DATE NOT NULL,
  no_ppa VARCHAR(50) NOT NULL,
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

-- Enable RLS (Row Level Security) for Supabase
ALTER TABLE public.ppa ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON public.ppa
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.ppa
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.ppa
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ppa_updated_at
BEFORE UPDATE ON public.ppa
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
