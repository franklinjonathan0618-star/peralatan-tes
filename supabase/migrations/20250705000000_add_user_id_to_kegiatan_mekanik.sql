-- Tambah kolom user_id ke tabel kegiatan_mekanik
ALTER TABLE public.kegiatan_mekanik 
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Pastikan RLS aktif
ALTER TABLE public.kegiatan_mekanik ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Enable read access for all users" ON public.kegiatan_mekanik;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kegiatan_mekanik;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kegiatan_mekanik;

-- Buat policy untuk admin bisa melihat semua data
CREATE POLICY "Enable all access for admin" 
    ON public.kegiatan_mekanik 
    USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = id 
        AND raw_user_meta_data->>'role' = 'admin'
    ));

-- Policy untuk membaca data
CREATE POLICY "Enable read access for authenticated users" 
    ON public.kegiatan_mekanik 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Policy untuk insert data
CREATE POLICY "Enable insert for authenticated users" 
    ON public.kegiatan_mekanik 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Policy untuk update data
CREATE POLICY "Enable update for authenticated users" 
    ON public.kegiatan_mekanik 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
