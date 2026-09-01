
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import type { AlatPendukung } from '@/types';
import { useActiveProject } from './useActiveProject';

export const useAlatPendukung = () => {
  const { getProjectId } = useActiveProject();

  return useQuery({
    queryKey: ['alat-pendukung'],
    queryFn: async () => {
      const projectId = getProjectId();
      console.log('Active project ID for alat pendukung:', projectId);

      let query = supabase.from('alat_pendukung').select('*');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map((item: any) => ({
        id: item.id,
        noLambung: item.no_lambung || null,
        namaAlat: item.nama_alat,
        jenisAlat: item.jenis_alat,
        tahunPerolehan: item.tahun_perolehan || null,
        nilaiPerolehan: item.nilai_perolehan || null,
        lokasi: item.lokasi || null,
        lokasiSebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || null,
        lokasi_sebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || null,
        status: item.status || null,
        keterangan: item.keterangan || null,
        merk: item.merk || null,
        tipe: item.tipe || null,
        kondisi: item.kondisi || null,
        gambar: item.gambar || null,
        foto: item.foto || null,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as AlatPendukung[] || [];
    },
  });
};

export const useAddAlatPendukung = () => {
  const queryClient = useQueryClient();
  const { getProjectId } = useActiveProject();

  return useMutation({
    mutationFn: async (data: Omit<AlatPendukung, 'id'>) => {
      try {
        if (!data.namaAlat) {
          throw new Error('Nama Alat tidak boleh kosong');
        }

        const projectId = getProjectId();
        console.log('Project ID for insert alat pendukung:', projectId);

        const { error } = await supabase
          .from('alat_pendukung')
          .insert({
            no_lambung: data.noLambung || null,
            nama_alat: data.namaAlat,
            jenis_alat: data.jenisAlat || null,
            tahun_perolehan: data.tahunPerolehan || null,
            nilai_perolehan: data.nilaiPerolehan || null,
            lokasi: data.lokasi || null,
            lokasi_sebelumnya: data.lokasiSebelumnya || (data as any).lokasi_sebelumnya || null,
            status: data.status || 'standby',
            keterangan: data.keterangan || null,
            merk: data.merk || null,
            tipe: data.tipe || null,
            kondisi: data.kondisi || 'Baik',
            gambar: data.gambar || null,
            foto: data.foto || null,
            project_id: projectId,
          });

        if (error) {
          console.error('Supabase insert error:', error.code, error.message, error.details);
          // Terjemahkan kode error Supabase ke pesan yang mudah dipahami
          if (error.code === '23505') {
            throw new Error(`Duplikat data: no lambung sudah ada (${error.details || error.message})`);
          } else if (error.code === '23502') {
            throw new Error(`Kolom wajib kosong: ${error.details || error.message}`);
          } else if (error.code === '42501') {
            throw new Error('Tidak memiliki izin untuk menambahkan data');
          } else {
            throw new Error(`DB Error [${error.code}]: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.error('Error in useAddAlatPendukung:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
    },
  });
};

export const useUpdateAlatPendukung = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: AlatPendukung) => {
      const { error } = await supabase
        .from('alat_pendukung')
        .update({
          no_lambung: data.noLambung || null,
          nama_alat: data.namaAlat,
          jenis_alat: data.jenisAlat || null,
          tahun_perolehan: data.tahunPerolehan || null,
          nilai_perolehan: data.nilaiPerolehan || null,
          lokasi: data.lokasi || null,
          lokasi_sebelumnya: data.lokasiSebelumnya || (data as any).lokasi_sebelumnya || null,
          status: data.status || 'standby',
          keterangan: data.keterangan || null,
          merk: data.merk || null,
          tipe: data.tipe || null,
          kondisi: data.kondisi || 'Baik',
          gambar: data.gambar || null,
          foto: data.foto || null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
    },
  });
};

export const useDeleteAlatPendukung = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alat_pendukung')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
    },
  });
};

