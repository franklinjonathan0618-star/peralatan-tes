import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
import type { Pemutihan } from '@/types';
import { useSubscription, type SupabaseClientType } from './useSubscription';
import { withTimeout } from '@/utils/withTimeout';
import { DEMO_MODE } from '@/contexts/AuthContext';
import { useActiveProject } from './useActiveProject';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface UsePemutihanReturn {
  data: Pemutihan[] | [];
  isLoading: boolean;
  error: Error | null;
}

// Mock data for testing without Supabase
const MOCK_PEMUTIHAN: Pemutihan[] = [];

export const usePemutihan = (): UsePemutihanReturn => {
  const queryClient = useQueryClient();
  const { getProjectId } = useActiveProject();

  const fetchPemutihan = async (): Promise<Pemutihan[]> => {
    if (DEMO_MODE) {
      return MOCK_PEMUTIHAN;
    }

    console.log('Fetching pemutihan data...');

    try {
      const projectId = getProjectId();
      console.log('Active project ID for pemutihan:', projectId);

      let query = supabase.from('pemutihan').select('*');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await withTimeout(
        Promise.resolve(
          query.order('created_at', { ascending: false }).then((r: any) => r)
        ),
        10000,
        'Pemutihan Fetch'
      ) as any;

      if (error) {
        console.error('Error fetching pemutihan:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      if (!data || data.length === 0) {
        console.warn('No data returned from pemutihan table');
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        no_lambung: item.no_lambung || '',
        nama_alat: item.nama_alat || '',
        merk: item.merk || undefined,
        tipe: item.tipe || undefined,
        part_terlepas: item.part_terlepas || undefined,
        status: item.status || 'terjual',
        status_pemutihan: item.status_pemutihan || 'pending',
        keterangan: item.keterangan || undefined,
        tanggal: item.tanggal || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    } catch (error) {
      console.error('Error in fetchPemutihan:', error);
      return MOCK_PEMUTIHAN;
    }
  };

  const handleChange = useCallback((payload: any) => {
    const eventType = payload.event;
    if (!payload.new && eventType !== 'DELETE') return;
    console.log('Change detected in pemutihan:', payload);

    if (eventType === 'INSERT') {
      if (payload.new) {
        queryClient.setQueryData<Pemutihan[]>(['pemutihan'], (oldData = []) => {
          const newItem = mapToPemutihan(payload.new!);
          return [newItem, ...oldData];
        });
      }
    } else if (eventType === 'UPDATE') {
      if (payload.new) {
        queryClient.setQueryData<Pemutihan[]>(['pemutihan'], (oldData: Pemutihan[] = []) => {
          return oldData.map((item: Pemutihan) =>
            item.id === payload.new!.id ? mapToPemutihan(payload.new!) : item
          );
        });
      }
    } else if (eventType === 'DELETE') {
      if (payload.old) {
        queryClient.setQueryData<Pemutihan[]>(['pemutihan'], (oldData: Pemutihan[] = []) => {
          return oldData.filter((item: Pemutihan) => item.id !== payload.old!.id);
        });
      }
    } else {
      queryClient.invalidateQueries({
        queryKey: ['pemutihan'],
        refetchType: 'active'
      });
    }
  }, [queryClient]);

  const mapToPemutihan = (row: any): Pemutihan => {
    return {
      id: row.id,
      no_lambung: row.no_lambung || '',
      nama_alat: row.nama_alat || '',
      merk: row.merk || undefined,
      tipe: row.tipe || undefined,
      part_terlepas: row.part_terlepas || undefined,
      status: row.status || 'terjual',
      status_pemutihan: row.status_pemutihan || 'pending',
      keterangan: row.keterangan || undefined,
      tanggal: row.tanggal || undefined,
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined,
    };
  };

  useSubscription<any>({
    supabase: supabase as unknown as SupabaseClientType,
    table: 'pemutihan',
    event: '*',
    callback: handleChange,
    filter: '*',
    options: {
      enabled: !DEMO_MODE,
      onError: (error: Error) => {
        console.error('Error in pemutihan subscription:', error);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['pemutihan'] });
        }, 1000);
      }
    }
  });

  const { data, isLoading, error } = useQuery<Pemutihan[]>({
    queryKey: ['pemutihan'],
    queryFn: fetchPemutihan,
    refetchOnWindowFocus: !DEMO_MODE,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 500
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
  };
};

export const useAddPemutihan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getProjectId } = useActiveProject();

  return useMutation({
    mutationFn: async (data: Omit<Pemutihan, 'id'>) => {
      try {
        console.log('Adding new pemutihan:', data);

        if (!data.no_lambung || !data.nama_alat) {
          throw new Error('Nomor Lambung dan Nama Alat harus diisi');
        }

        const projectId = getProjectId();
        console.log('Project ID for insert pemutihan:', projectId);

        const pemutihanData = {
          no_lambung: data.no_lambung.trim(),
          nama_alat: data.nama_alat.trim(),
          merk: data.merk?.trim() || null,
          tipe: data.tipe?.trim() || null,
          part_terlepas: data.part_terlepas?.trim() || null,
          status: data.status || 'terjual',
          status_pemutihan: data.status_pemutihan || 'pending',
          keterangan: data.keterangan?.trim() || null,
          tanggal: data.tanggal || null,
          project_id: projectId,
        };

        console.log('Inserting pemutihan with data:', pemutihanData);

        const { data: result, error } = await (supabase as any)
          .from('pemutihan')
          .insert(pemutihanData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting pemutihan:', error);
          if (error.code === '23505') {
            throw new Error('Data dengan nomor lambung ini sudah ada');
          } else if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk menambahkan data');
          } else {
            throw new Error(error.message || 'Gagal menambahkan data pemutihan');
          }
        }

        if (!result) {
          throw new Error('Tidak ada data yang dikembalikan setelah penyisipan');
        }

        console.log('Pemutihan added successfully:', result);
        return result;

      } catch (error) {
        console.error('Error in useAddPemutihan:', error);
        throw error;
      }
    },
    onSuccess: (insertedData) => {
      queryClient.invalidateQueries({ queryKey: ['pemutihan'] });
      toast({
        title: 'Sukses',
        description: 'Data pemutihan berhasil ditambahkan',
      });
      if (insertedData) {
        let cleanApiUrl = API_URL;
        if (cleanApiUrl.endsWith('/')) {
          cleanApiUrl = cleanApiUrl.slice(0, -1);
        }
        fetch(`${cleanApiUrl}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'PEMUTIHAN',
            data: insertedData,
          }),
        }).catch((err) =>
          console.error('Failed to send Pemutihan email:', err)
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan data pemutihan',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePemutihan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Pemutihan) => {
      try {
        console.log('Updating pemutihan:', id, data);

        if (!data.no_lambung || !data.nama_alat) {
          throw new Error('Nomor Lambung dan Nama Alat harus diisi');
        }

        const updateData = {
          no_lambung: data.no_lambung.trim(),
          nama_alat: data.nama_alat.trim(),
          merk: data.merk?.trim() || null,
          tipe: data.tipe?.trim() || null,
          part_terlepas: data.part_terlepas?.trim() || null,
          status: data.status || 'terjual',
          status_pemutihan: data.status_pemutihan || 'pending',
          keterangan: data.keterangan?.trim() || null,
          tanggal: data.tanggal || null,
        };

        console.log('Updating pemutihan with data:', updateData);

        const { data: result, error } = await supabase
          .from('pemutihan')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating pemutihan:', error);
          if (error.code === '23505') {
            throw new Error('Data dengan nomor lambung ini sudah ada');
          } else if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk memperbarui data');
          } else {
            throw new Error(error.message || 'Gagal memperbarui data pemutihan');
          }
        }

        if (!result) {
          throw new Error('Tidak ada data yang dikembalikan setelah pembaruan');
        }

        console.log('Pemutihan updated successfully:', result);
        return result;

      } catch (error) {
        console.error('Error in useUpdatePemutihan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemutihan'] });
      // Also invalidate equipment queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['alatBerat'] });
      queryClient.invalidateQueries({ queryKey: ['alatPendukung'] });
      toast({
        title: 'Sukses',
        description: 'Data pemutihan berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui data pemutihan',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePemutihan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log('Deleting pemutihan with ID:', id);

        if (!id) {
          throw new Error('ID pemutihan tidak valid');
        }

        const { error } = await supabase
          .from('pemutihan')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting pemutihan:', error);
          if (error.code === '42501') {
            throw new Error('Anda tidak memiliki izin untuk menghapus data');
          } else if (error.code === '23503') {
            throw new Error('Tidak dapat menghapus data karena terdapat data terkait');
          } else {
            throw new Error(error.message || 'Gagal menghapus data pemutihan');
          }
        }

        console.log('Pemutihan deleted successfully');
        return { success: true };

      } catch (error) {
        console.error('Error in useDeletePemutihan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemutihan'] });
      toast({
        title: 'Sukses',
        description: 'Data pemutihan berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data pemutihan',
        variant: 'destructive',
      });
    },
  });
};

export default usePemutihan;
