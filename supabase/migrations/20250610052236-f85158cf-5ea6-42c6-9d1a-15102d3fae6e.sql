
-- Create timesheet table with all required columns
CREATE TABLE IF NOT EXISTS public.timesheet (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tanggal DATE NOT NULL,
    no_lambung TEXT,
    nama_operator TEXT NOT NULL,
    nama_alat TEXT NOT NULL,
    sesi1_jam_mulai TIME,
    sesi1_jam_selesai TIME,
    sesi2_jam_mulai TIME,
    sesi2_jam_selesai TIME,
    sesi3_jam_mulai TIME,
    sesi3_jam_selesai TIME,
    total_jam NUMERIC NOT NULL DEFAULT 0,
    aktivitas TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    keterangan TEXT,
    bbm NUMERIC,
    oli_40 NUMERIC,
    oli_10 NUMERIC,
    oli_90 NUMERIC,
    created_by UUID REFERENCES auth.users,
    updated_by UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on timesheet table
ALTER TABLE public.timesheet ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for timesheet table
CREATE POLICY "Users can view all timesheets" 
    ON public.timesheet FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert timesheets" 
    ON public.timesheet FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update timesheets" 
    ON public.timesheet FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete timesheets" 
    ON public.timesheet FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_timesheet_updated_at
    BEFORE UPDATE ON public.timesheet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
