-- Add jenis column to oli_transactions table
ALTER TABLE public.oli_transactions 
ADD COLUMN IF NOT EXISTS jenis character varying(20) NOT NULL DEFAULT 'pemakaian';

-- Add trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_oli_transactions_updated_at 
BEFORE UPDATE ON oli_transactions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
