import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';
import type { AlatBerat } from '@/types';
import { useSubscription, type SupabaseClientType } from './useSubscription';
import { withTimeout } from '@/utils/withTimeout';
import { DEMO_MODE } from '@/contexts/AuthContext';
import { useActiveProject } from './useActiveProject';

interface UseAlatBeratReturn {
  data: AlatBerat[] | [];
  isLoading: boolean;
  error: Error | null;
}

// Mock data for testing without Supabase
const MOCK_ALAT_BERAT: AlatBerat[] = [
  {
    id: '1',
    no_lambung: 'LB-001',
    nama_alat: 'Excavator CAT 320',
    jenis_alat: 'Excavator',
    tahun_perolehan: 2020,
    lokasi: 'Site A',
    status: 'standby',
  },
  {
    id: '2',
    no_lambung: 'LB-002',
    nama_alat: 'Dozer Komatsu D65',
    jenis_alat: 'Bulldozer',
    tahun_perolehan: 2019,
    lokasi: 'Site B',
    status: 'standby',
  },
  {
    id: '3',
    no_lambung: 'LB-003',
    nama_alat: 'Wheel Loader Volvo',
    jenis_alat: 'Wheel Loader',
    tahun_perolehan: 2021,
    lokasi: 'Site C',
    status: 'maintenance',
  },
];

export const useAlatBerat = (): UseAlatBeratReturn => {
  const queryClient = useQueryClient();
  const { getProjectId } = useActiveProject();

  const fetchAlatBerat = async (): Promise<AlatBerat[]> => {
    if (DEMO_MODE) {
      return MOCK_ALAT_BERAT;
    }

    console.log('Fetching alat berat data...');

    try {
      const projectId = getProjectId();
      console.log('Active project ID:', projectId);

      // Build query with project_id filter - send as query parameter to backend
      let query = supabase.from('alat_berat').select('*');

      if (projectId) {
        // Send project_id as query parameter to backend
        query = query.eq('project_id', projectId);
      }

      // Wrap Supabase query dengan 10 detik timeout untuk menghindari timeout di network slow
      const { data, error } = await withTimeout(
        Promise.resolve(
          query.order('created_at', { ascending: false }).then((r: any) => r)
        ),
        10000,
        'Alat Berat Fetch'
      ) as any;

      if (error) {
        console.error('Error fetching alat berat:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      if (!data || data.length === 0) {
        console.warn('No data returned from alat_berat table');
        return [];
      }

      // Map the data to match our frontend types
      return data.map((item: any) => ({
        id: item.id,
        no_lambung: item.no_lambung || '',
        nama_alat: item.nama_alat || '',
        jenis_alat: item.jenis_alat || undefined,
        tahun_perolehan: item.tahun_perolehan || undefined,
        nilai_perolehan: item.nilai_perolehan || undefined,
        lokasi: item.lokasi || undefined,
        lokasi_sebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || undefined,
        lokasiSebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || undefined,
        status: item.status || 'standby',
        keterangan: item.keterangan || undefined,
        merk: item.merk || undefined,
        tipe: item.tipe || undefined,
        noSeri: item.no_seri || item.noSeri || undefined,
        kondisi: item.kondisi || undefined,
        fisik_alat: item.fisik_alat || undefined,
        serviceTerakhir: item.service_terakhir || item.serviceTerakhir || undefined,
        serviceBerikutnya: item.service_berikutnya || item.serviceBerikutnya || undefined,
        foto: item.foto || item.gambar || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    } catch (error) {
      console.error('Error in fetchAlatBerat:', error);
      console.warn('Supabase connection failed, using mock data for demo');
      // Return mock data as fallback
      return MOCK_ALAT_BERAT;
    }
  };

  // Setup real-time subscription with debounce
  const handleChange = useCallback((payload: {
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    new: Database['public']['Tables']['alat_berat']['Row'] | null;
    old: Database['public']['Tables']['alat_berat']['Row'] | null;
    schema: string;
    table: string;
    commit_timestamp: string;
    errors: Error[] | null;
  }) => {
    const eventType = payload.event;
    if (!payload.new && eventType !== 'DELETE') return;
    console.log('Change detected in alat_berat:', payload);

    // Optimistic updates for better UX
    if (eventType === 'INSERT') {
      // For new items, add to the beginning of the list
      if (payload.new) {
        queryClient.setQueryData<AlatBerat[]>(['alat-berat'], (oldData = []) => {
          const newItem = mapToAlatBerat(payload.new!);
          return [newItem, ...oldData];
        });
      }
    } else if (eventType === 'UPDATE') {
      // For updates, update the specific item
      if (payload.new) {
        queryClient.setQueryData<AlatBerat[]>(['alat-berat'], (oldData: AlatBerat[] = []) => {
          return oldData.map((item: AlatBerat) =>
            item.id === payload.new!.id ? mapToAlatBerat(payload.new!) : item
          );
        });
      }
    } else if (eventType === 'DELETE') {
      // For deletes, remove the item
      if (payload.old) {
        queryClient.setQueryData<AlatBerat[]>(['alat-berat'], (oldData: AlatBerat[] = []) => {
          return oldData.filter((item: AlatBerat) => item.id !== payload.old!.id);
        });
      }
    } else {
      // Fallback to invalidate if we can't handle it optimistically
      queryClient.invalidateQueries({
        queryKey: ['alat-berat'],
        refetchType: 'active'
      });
    }
  }, [queryClient]);

  // Map database row to AlatBerat type
  const mapToAlatBerat = (row: any): AlatBerat => {
    return {
      id: row.id,
      no_lambung: row.no_lambung || '',
      nama_alat: row.nama_alat || '',
      jenis_alat: row.jenis_alat || undefined,
      tahun_perolehan: row.tahun_perolehan || undefined,
      nilai_perolehan: row.nilai_perolehan || undefined,
      lokasi: row.lokasi || undefined,
      lokasi_sebelumnya: row.lokasi_sebelumnya || row.lokasiSebelumnya || undefined,
      lokasiSebelumnya: row.lokasi_sebelumnya || row.lokasiSebelumnya || undefined,
      status: row.status || 'standby',
      keterangan: row.keterangan || undefined,
      merk: row.merk || undefined,
      tipe: row.tipe || undefined,
      noSeri: row.no_seri || row.noSeri || undefined,
      kondisi: row.kondisi || undefined,
      serviceTerakhir: row.service_terakhir || row.serviceTerakhir || undefined,
      serviceBerikutnya: row.service_berikutnya || row.serviceBerikutnya || undefined,
      foto: row.foto || row.gambar || null,
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined,
    };
  };

  // Use the custom subscription hook with proper typing
  useSubscription<Database['public']['Tables']['alat_berat']['Row']>({
    supabase: supabase as unknown as SupabaseClientType,
    table: 'alat_berat',
    event: '*',
    callback: handleChange,
    filter: '*',
    options: {
      enabled: !DEMO_MODE,
      onError: (error: Error) => {
        console.error('Error in alat_berat subscription:', error);
        // Schedule a refetch on error to ensure data consistency
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
        }, 1000);
      }
    }
  });

  const { data, isLoading, error } = useQuery<AlatBerat[]>({
    queryKey: ['alat-berat'],
    queryFn: fetchAlatBerat,
    refetchOnWindowFocus: !DEMO_MODE,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 500
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
  };
};

export const useAddAlatBerat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<AlatBerat, 'id'>) => {
      try {
        console.log('Adding new alat berat:', data);

        // Validate required fields
        if (!data.no_lambung || !data.nama_alat) {
          throw new Error('Nomor Lambung dan Nama Alat harus diisi');
        }

        // Prepare the data for Supabase
        const alatBeratData = {
          no_lambung: data.no_lambung.trim(),
          nama_alat: data.nama_alat.trim(),
          jenis_alat: data.jenis_alat?.trim() || null,
          tahun_perolehan: data.tahun_perolehan || null,
          nilai_perolehan: data.nilai_perolehan || null,
          lokasi: data.lokasi?.trim() || null,
          lokasi_sebelumnya: (data.lokasi_sebelumnya || (data as any).lokasiSebelumnya)?.trim() || null,
          status: data.status || 'standby',
          keterangan: data.keterangan?.trim() || null,
          merk: data.merk?.trim() || null,
          tipe: data.tipe?.trim() || null,
          no_seri: data.noSeri?.trim() || null,
          kondisi: data.kondisi || null,
          fisik_alat: data.fisik_alat || null,
          service_terakhir: data.serviceTerakhir || null,
          service_berikutnya: data.serviceBerikutnya || null,
          foto: data.foto || null,
        };

        console.log('Inserting alat berat with data:', alatBeratData);

        const { data: result, error } = await (supabase as any)
          .from('alat_berat')
          .insert(alatBeratData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting alat berat:', error);

          // Handle specific Supabase errors
          if (error.code === '23505') {
            throw new Error('Data dengan nomor lambung ini sudah ada');
          } else if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk menambahkan data');
          } else {
            throw new Error(error.message || 'Gagal menambahkan data alat berat');
          }
        }

        if (!result) {
          throw new Error('Tidak ada data yang dikembalikan setelah penyisipan');
        }

        console.log('Alat berat added successfully:', result);
        return result;

      } catch (error) {
        console.error('Error in useAddAlatBerat:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      toast({
        title: 'Sukses',
        description: 'Data alat berat berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan data alat berat',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAlatBerat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: AlatBerat) => {
      try {
        console.log('Updating alat berat:', id, data);

        // Validate required fields
        if (!data.no_lambung || !data.nama_alat) {
          throw new Error('Nomor Lambung dan Nama Alat harus diisi');
        }

        // Prepare the update data
        const updateData = {
          no_lambung: data.no_lambung.trim(),
          nama_alat: data.nama_alat.trim(),
          jenis_alat: data.jenis_alat?.trim() || null,
          tahun_perolehan: data.tahun_perolehan || null,
          nilai_perolehan: data.nilai_perolehan || null,
          lokasi: data.lokasi?.trim() || null,
          lokasi_sebelumnya: (data.lokasi_sebelumnya || (data as any).lokasiSebelumnya)?.trim() || null,
          status: data.status || 'standby',
          keterangan: data.keterangan?.trim() || null,
          merk: data.merk?.trim() || null,
          tipe: data.tipe?.trim() || null,
          no_seri: data.noSeri?.trim() || null,
          kondisi: data.kondisi || null,
          fisik_alat: data.fisik_alat || null,
          service_terakhir: data.serviceTerakhir || null,
          service_berikutnya: data.serviceBerikutnya || null,
          foto: data.foto !== undefined ? data.foto : null,
        };

        console.log('Updating alat berat with data:', updateData);

        const { data: result, error } = await supabase
          .from('alat_berat')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating alat berat:', error);

          // Handle specific Supabase errors
          if (error.code === '23505') {
            throw new Error('Data dengan nomor lambung ini sudah ada');
          } else if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk memperbarui data');
          } else {
            throw new Error(error.message || 'Gagal memperbarui data alat berat');
          }
        }

        if (!result) {
          throw new Error('Tidak ada data yang dikembalikan setelah pembaruan');
        }

        console.log('Alat berat updated successfully:', result);
        return result;

      } catch (error) {
        console.error('Error in useUpdateAlatBerat:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      toast({
        title: 'Sukses',
        description: 'Data alat berat berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui data alat berat',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteAlatBerat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log('Deleting alat berat with ID:', id);

        if (!id) {
          throw new Error('ID alat berat tidak valid');
        }

        const { error } = await supabase
          .from('alat_berat')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting alat berat:', error);

          if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk menghapus data');
          } else if (error.code === '23503') {
            throw new Error('Tidak dapat menghapus data karena terdapat data terkait');
          } else {
            throw new Error(error.message || 'Gagal menghapus data alat berat');
          }
        }

        console.log('Alat berat deleted successfully');
        return { success: true };

      } catch (error) {
        console.error('Error in useDeleteAlatBerat:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      toast({
        title: 'Sukses',
        description: 'Data alat berat berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data alat berat',
        variant: 'destructive',
      });
    },
  });
};
export default useAlatBerat;

