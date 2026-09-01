-- Create sparepart_transactions table for tracking spare part usage
CREATE TABLE IF NOT EXISTS sparepart_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sparepart_id UUID NOT NULL REFERENCES sparepart(id) ON DELETE CASCADE,
  tanggal TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  jumlah NUMERIC NOT NULL,
  satuan VARCHAR(50),
  no_lambung VARCHAR(50),
  nama_alat VARCHAR(255),
  no_perbaikan VARCHAR(100),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sparepart_transactions_sparepart_id ON sparepart_transactions(sparepart_id);
CREATE INDEX IF NOT EXISTS idx_sparepart_transactions_tanggal ON sparepart_transactions(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_sparepart_transactions_jenis ON sparepart_transactions(jenis);

-- Enable RLS
ALTER TABLE sparepart_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Sparepart transactions are viewable by authenticated users"
ON sparepart_transactions FOR SELECT
TO authenticated
USING (true);

-- Create policy for insert access
CREATE POLICY "Authenticated users can insert sparepart transactions"
ON sparepart_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for update access
CREATE POLICY "Authenticated users can update sparepart transactions"
ON sparepart_transactions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for delete access
CREATE POLICY "Authenticated users can delete sparepart transactions"
ON sparepart_transactions FOR DELETE
TO authenticated
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sparepart_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_sparepart_transactions_updated_at
BEFORE UPDATE ON sparepart_transactions
FOR EACH ROW
EXECUTE FUNCTION update_sparepart_transactions_updated_at();
