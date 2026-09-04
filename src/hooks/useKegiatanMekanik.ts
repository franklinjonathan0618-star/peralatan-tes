import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/api/client';

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


export interface KegiatanMekanik {
  id?: string;
  tanggal: string;
  no_ppa: string | null;
  no_lambung: string;
  nama_alat: string | null;
  nama_mekanik: string;
  lokasi_pekerjaan: string;
  lokasi_sebelumnya?: string | null;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
}

const fetchKegiatanMekanik = async (date?: Date) => {
  const projectId = getProjectId();
  console.log('Active project ID for kegiatan mekanik:', projectId);

  let query = supabase
    .from('kegiatan_mekanik')
    .select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  query = query.order('tanggal', { ascending: false });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte('tanggal', startOfDay.toISOString())
      .lte('tanggal', endOfDay.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const useKegiatanMekanik = (date?: Date) => {
  const queryClient = useQueryClient();

  // Setup real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('kegiatan_mekanik_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kegiatan_mekanik'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kegiatan_mekanik', date?.toISOString()] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [date, queryClient]);

  return useQuery({
    queryKey: ['kegiatan_mekanik', date?.toISOString()],
    queryFn: () => fetchKegiatanMekanik(date),
  });
};

export const useAddKegiatanMekanik = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<KegiatanMekanik, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!data.tanggal || !data.nama_mekanik || !data.lokasi_pekerjaan) {
          throw new Error('Tanggal, Nama Mekanik, dan Lokasi Pekerjaan harus diisi');
        }

        // no_ppa dan nama_alat adalah kolom NOT NULL di database, tapi boleh
        // "kosong secara makna" (tidak ada PPA dipilih). Normalisasi null/undefined
        // ke string kosong agar tidak melanggar constraint DB.
        const payload = {
          ...data,
          no_ppa: data.no_ppa || '',
          nama_alat: data.nama_alat || '',
        };

        const { data: result, error } = await supabase
          .from('kegiatan_mekanik')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Kegiatan Mekanik Insert Error:', error.code, error.message, error.details);
          throw new Error(error.message || 'Gagal menyimpan kegiatan mekanik');
        }
        return result;
      } catch (error: any) {
        console.error('Error in useAddKegiatanMekanik:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan_mekanik'] });
    },
  });
};

export const useUpdateKegiatanMekanik = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: KegiatanMekanik) => {
      try {
        if (!data.id) throw new Error('ID is required for update');
        if (!data.tanggal || !data.nama_mekanik || !data.lokasi_pekerjaan) {
          throw new Error('Tanggal, Nama Mekanik, dan Lokasi Pekerjaan harus diisi');
        }

        const { data: result, error } = await supabase
          .from('kegiatan_mekanik')
          .update({
            ...data,
            no_ppa: data.no_ppa || '',
            nama_alat: data.nama_alat || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single();

        if (error) {
          console.error('Kegiatan Mekanik Update Error:', error.code, error.message);
          throw new Error(error.message || 'Gagal mengupdate kegiatan mekanik');
        }
        return result;
      } catch (error: any) {
        console.error('Error in useUpdateKegiatanMekanik:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan_mekanik'] });
    },
  });
};

export const useDeleteKegiatanMekanik = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kegiatan_mekanik')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan_mekanik'] });
    },
  });
};
