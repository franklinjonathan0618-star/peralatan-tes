
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import { DEMO_MODE, useAuth } from '@/contexts/AuthContext';
import { withTimeout } from '@/utils/withTimeout';
import type { Database } from '@/integrations/supabase/types';

// Helper function to get active project ID
const getProjectId = () => {
  const savedProject = localStorage.getItem('activeProject');
  if (savedProject) {
    try {
      const project = JSON.parse(savedProject);
      return project.id;
    } catch {
      return null;
    }
  }
  return null;
};

type DBTimesheet = Database['public']['Tables']['timesheet']['Row'];

export interface TimeSheet {
  id?: string;
  tanggal: string;
  noLambung?: string;
  namaOperator: string;
  namaAlat: string;
  sesi1JamMulai?: string;
  sesi1JamSelesai?: string;
  sesi2JamMulai?: string;
  sesi2JamSelesai?: string;
  sesi3JamMulai?: string;
  sesi3JamSelesai?: string;
  totalJam: number;
  aktivitas: string;
  lokasi: string;
  keterangan?: string;
  bbm?: number;
  oli40?: number;
  oli10?: number;
  oli90?: number;
  created_at?: string;
  updated_at?: string | null;
}

// Helper function to map database fields to frontend format
const mapTimesheetFromDB = (item: DBTimesheet): TimeSheet => ({
  id: item.id,
  tanggal: item.tanggal,
  noLambung: item.no_lambung || undefined,
  namaOperator: item.nama_operator,
  namaAlat: item.nama_alat,
  sesi1JamMulai: item.sesi1_jam_mulai || undefined,
  sesi1JamSelesai: item.sesi1_jam_selesai || undefined,
  sesi2JamMulai: item.sesi2_jam_mulai || undefined,
  sesi2JamSelesai: item.sesi2_jam_selesai || undefined,
  sesi3JamMulai: item.sesi3_jam_mulai || undefined,
  sesi3JamSelesai: item.sesi3_jam_selesai || undefined,
  totalJam: Number(item.total_jam) || 0,
  aktivitas: item.aktivitas || '',
  lokasi: item.lokasi || '',
  keterangan: item.keterangan || undefined,
  bbm: item.bbm ? Number(item.bbm) : undefined,
  oli40: item.oli_40 ? Number(item.oli_40) : undefined,
  oli10: item.oli_10 ? Number(item.oli_10) : undefined,
  oli90: item.oli_90 ? Number(item.oli_90) : undefined,
  created_at: item.created_at,
  updated_at: item.updated_at
});

// Helper function to map frontend fields to database format
const mapTimesheetToDB = (item: TimeSheet): Partial<DBTimesheet> => ({
  tanggal: item.tanggal,
  no_lambung: item.noLambung || null,
  nama_operator: item.namaOperator,
  nama_alat: item.namaAlat,
  sesi1_jam_mulai: item.sesi1JamMulai || null,
  sesi1_jam_selesai: item.sesi1JamSelesai || null,
  sesi2_jam_mulai: item.sesi2JamMulai || null,
  sesi2_jam_selesai: item.sesi2JamSelesai || null,
  sesi3_jam_mulai: item.sesi3JamMulai || null,
  sesi3_jam_selesai: item.sesi3JamSelesai || null,
  total_jam: item.totalJam,
  aktivitas: item.aktivitas,
  lokasi: item.lokasi,
  keterangan: item.keterangan || null,
  bbm: item.bbm || null,
  oli_40: item.oli40 || null,
  oli_10: item.oli10 || null,
  oli_90: item.oli90 || null,
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Mock data for testing without Supabase
const MOCK_TIMESHEET: TimeSheet[] = [
  {
    id: '1',
    tanggal: '2026-02-01',
    noLambung: 'LB-001',
    namaOperator: 'Budi Santoso',
    namaAlat: 'Excavator CAT 320',
    sesi1JamMulai: '06:00',
    sesi1JamSelesai: '10:00',
    sesi2JamMulai: '10:30',
    sesi2JamSelesai: '14:30',
    totalJam: 8,
    aktivitas: 'Penggalian tanah',
    lokasi: 'Lokasi A',
    bbm: 50,
    oli40: 2,
  },
  {
    id: '2',
    tanggal: '2026-02-02',
    noLambung: 'LB-002',
    namaOperator: 'Hendra Wijaya',
    namaAlat: 'Dozer Komatsu',
    sesi1JamMulai: '07:00',
    sesi1JamSelesai: '11:00',
    sesi2JamMulai: '12:00',
    sesi2JamSelesai: '16:00',
    totalJam: 8,
    aktivitas: 'Pembulatan tanah',
    lokasi: 'Lokasi B',
    bbm: 45,
    oli40: 2,
  }
];

export const useTimeSheet = () => {
  return useQuery<TimeSheet[], Error>({
    queryKey: ['timesheet'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return MOCK_TIMESHEET;
      }

      console.log('Fetching timesheet data...');
      try {
        const projectId = getProjectId();
        console.log('Active project ID for timesheet:', projectId);

        let query = supabase.from('timesheet').select('*');

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        // Wrap dengan 15 detik timeout untuk handle network delay
        const { data, error } = await withTimeout(
          Promise.resolve(
            query.order('created_at', { ascending: false }).then((r: any) => r)
          ),
          15000,
          'TimeSheet Fetch'
        ) as any;

        if (error) {
          console.error('Error fetching timesheet:', error);
          throw new Error(`Gagal memuat data timesheet: ${error.message}`);
        }

        console.log('Timesheet data fetched successfully:', data?.length || 0, 'records');
        return data ? data.map(mapTimesheetFromDB) : [];
      } catch (err) {
        console.error('Detailed error in timesheet query:', err);
        console.warn('Supabase connection failed, using mock data for demo');
        // Return mock data as fallback
        return MOCK_TIMESHEET;
      }
    },
    refetchOnWindowFocus: !DEMO_MODE,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Fast-fail untuk mock data
    retryDelay: 500
  });
};

export const useAddTimeSheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<TimeSheet, Error, TimeSheet>({
    mutationFn: async (data: TimeSheet) => {
      console.log('Adding timesheet data:', data);
      
      try {
        // Ensure user is authenticated
        if (!user) {
          throw new Error('Anda belum login. Silakan login terlebih dahulu.');
        }

        // Ensure required fields are present
        if (!data.tanggal || !data.namaOperator || !data.namaAlat) {
          throw new Error('Tanggal, Nama Operator, dan Nama Alat harus diisi');
        }
        
        // Prepare the data for insertion with all required fields
        const dbData = mapTimesheetToDB(data);
        const insertData = {
          // Required fields
          tanggal: data.tanggal,
          no_lambung: data.noLambung || null,
          nama_operator: data.namaOperator,
          nama_alat: data.namaAlat,
          aktivitas: data.aktivitas || '',
          lokasi: data.lokasi || '',
          total_jam: data.totalJam || 0,
          
          // Optional fields from the mapping
          ...dbData,
          
          // System fields
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Ensure these are not null for the database
          keterangan: data.keterangan || null,
          bbm: data.bbm || null,
          oli_40: data.oli40 || null,
          oli_10: data.oli10 || null,
          oli_90: data.oli90 || null
        };
        
        console.log('Insert data prepared:', insertData);
        
        const { data: result, error } = await (supabase
          .from('timesheet')
          .insert(insertData)
          .select()
          .single() as any);
        
        if (error) {
          console.error('Supabase error details:', error);
          // Handle specific Supabase errors
          if (error.code === '23505') {
            throw new Error('Data sudah ada di database');
          } else if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk menambahkan data');
          } else {
            throw new Error(error.message || 'Gagal menyimpan data ke database');
          }
        }
        
        if (!result) {
          throw new Error('Tidak ada data yang dikembalikan setelah penyimpanan');
        }
        
        const newTimesheet = mapTimesheetFromDB(result);
        console.log('Timesheet inserted successfully:', newTimesheet);
        return newTimesheet;
        
      } catch (error: any) {
        console.error('Error in useAddTimeSheet:', error);
        throw new Error(error.message || 'Terjadi kesalahan saat menyimpan data');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      toast.success('Data timesheet berhasil ditambahkan');
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Gagal menambahkan data timesheet');
    }
  });
};

export const useUpdateTimeSheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<TimeSheet, Error, TimeSheet>({
    mutationFn: async (data: TimeSheet) => {
      console.log('Updating timesheet with data:', data);
      
      if (!data.id) {
        throw new Error('ID timesheet tidak valid');
      }
      
      if (!user) {
        throw new Error('Anda belum login. Silakan login terlebih dahulu.');
      }
      
      // Prepare the data for update with all required fields
      const dbData = mapTimesheetToDB(data);
      const updateData = {
        // Required fields
        tanggal: data.tanggal,
        no_lambung: data.noLambung || null,
        nama_operator: data.namaOperator,
        nama_alat: data.namaAlat,
        aktivitas: data.aktivitas || '',
        lokasi: data.lokasi || '',
        total_jam: data.totalJam || 0,
        
        // Updated fields from the mapping
        ...dbData,
        
        // System fields
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        
        // Ensure these are not null for the database
        keterangan: data.keterangan || null,
        bbm: data.bbm || null,
        oli_40: data.oli40 || null,
        oli_10: data.oli10 || null,
        oli_90: data.oli90 || null
      };
      
      console.log('Update data prepared:', updateData);
      
      const { data: result, error } = await (supabase
        .from('timesheet')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single() as any);
      
      if (error) {
        console.error('Error updating timesheet:', error);
        throw new Error(error.message || 'Gagal memperbarui data timesheet');
      }
      
      if (!result) {
        throw new Error('Tidak ada data yang dikembalikan setelah pembaruan');
      }
      
      const updatedTimesheet = mapTimesheetFromDB(result);
      console.log('Timesheet updated successfully:', updatedTimesheet);
      return updatedTimesheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      toast.success('Data timesheet berhasil diperbarui');
    },
    onError: (error: Error) => {
      console.error('Update mutation error:', error);
      toast.error(error.message || 'Gagal memperbarui data timesheet');
    }
  });
};

export const useDeleteTimeSheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<string, Error, string>({
    mutationFn: async (id: string) => {
      console.log('Deleting timesheet with id:', id);
      
      if (!user) {
        throw new Error('Anda belum login. Silakan login terlebih dahulu.');
      }
      
      const { error } = await supabase
        .from('timesheet')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting timesheet:', error);
        throw new Error(error.message || 'Gagal menghapus data timesheet');
      }
      
      console.log('Timesheet deleted successfully');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      toast.success('Data timesheet berhasil dihapus');
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast.error(error.message || 'Gagal menghapus data timesheet');
    }
  });
};

