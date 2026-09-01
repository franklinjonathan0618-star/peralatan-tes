-- Enable RLS on perbaikan table if not already enabled
ALTER TABLE public.perbaikan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for perbaikan table
CREATE POLICY "Enable read access for all users" 
    ON public.perbaikan 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.perbaikan 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
    ON public.perbaikan 
    FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable delete for authenticated users" 
    ON public.perbaikan 
    FOR DELETE 
    TO authenticated 
    USING (true);
