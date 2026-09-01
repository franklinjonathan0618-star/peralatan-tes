
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';

interface SewaAlat {
  id?: string;
  nomorSewa: string;
  namaAlat: string;
  penyewa: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  biayaSewa: number;
  totalBiaya?: number;
  status: 'Aktif' | 'Selesai' | 'Terlambat' | 'Dibatalkan';
  lokasi: string;
  lokasi_sebelumnya?: string | null;
  lokasiSebelumnya?: string | null;
  operator: string;
  jamPemakaianPerHari?: number;
}

export const useSewaAlat = () => {
  return useQuery({
    queryKey: ['sewa-alat'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sewa_alat')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching sewa alat:', error);
          throw error;
        }

        return data?.map((item: any) => {
          const tanggalMulai = item.tanggal_mulai || item.tanggal_sewa || '';
          const tanggalSelesai = item.tanggal_selesai || item.tanggal_kembali || '';
          const biayaSewa = Number(item.biaya_sewa ?? item.biaya_per_hari ?? 0);
          const jamPemakaianPerHari = Number(item.jam_pemakaian_per_hari ?? 8);
          let totalBiayaDb = Number(item.total_biaya ?? 0);

          const tglMulaiRaw = tanggalMulai.split('T')[0].split('-');
          const tglSelesaiRaw = tanggalSelesai.split('T')[0].split('-');

          let diffDays = 1;
          let calculatedStatus = item.status || 'Aktif';

          if (tglMulaiRaw.length === 3 && tglSelesaiRaw.length === 3) {
            const mulai = new Date(Number(tglMulaiRaw[0]), Number(tglMulaiRaw[1]) - 1, Number(tglMulaiRaw[2]));
            const selesai = new Date(Number(tglSelesaiRaw[0]), Number(tglSelesaiRaw[1]) - 1, Number(tglSelesaiRaw[2]));
            
            const diffMs = selesai.getTime() - mulai.getTime();
            diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (calculatedStatus === 'Aktif' && today > selesai) {
              calculatedStatus = 'Selesai';
            }
          }

          if (totalBiayaDb <= 0 || totalBiayaDb === biayaSewa) {
             totalBiayaDb = biayaSewa * jamPemakaianPerHari * diffDays;
          }

          return {
            id: item.id,
            nomorSewa: item.nomor_sewa || item.nomor_sewa_alat || '-',
            namaAlat: item.nama_alat || '',
            penyewa: item.penyewa || item.vendor || '-',
            tanggalMulai,
            tanggalSelesai,
            biayaSewa,
            totalBiaya: totalBiayaDb,
            status: calculatedStatus as 'Aktif' | 'Selesai' | 'Terlambat' | 'Dibatalkan',
            lokasi: item.lokasi || item.lokasi_proyek || '-',
            lokasi_sebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || '-',
            lokasiSebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || '-',
            operator: item.operator || '-',
            jamPemakaianPerHari,
          };
        }) || [];
      } catch (error) {
        console.error('Error in useSewaAlat:', error);
        return [];
      }
    },
  });
};

export const useAddSewaAlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<SewaAlat, 'id'>) => {
      try {
        const { error } = await supabase
          .from('sewa_alat')
          .insert({
            nomor_sewa: data.nomorSewa,
            nama_alat: data.namaAlat,
            penyewa: data.penyewa,
            tanggal_mulai: data.tanggalMulai,
            tanggal_selesai: data.tanggalSelesai,
            biaya_sewa: data.biayaSewa,
            status: data.status,
            lokasi: data.lokasi,
            lokasi_sebelumnya: data.lokasi_sebelumnya || data.lokasiSebelumnya || null,
            operator: data.operator,
            jam_pemakaian_per_hari: data.jamPemakaianPerHari || null
          });

        if (error) {
          console.error('Error adding sewa alat:', error.message, error.details);
          throw new Error(error.message);
        }
      } catch (error: any) {
        console.error('Error in useAddSewaAlat:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sewa-alat'] });
    },
  });
};

export const useUpdateSewaAlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SewaAlat) => {
      try {
        if (!data.id) throw new Error('ID is required for update');

        const { error } = await supabase
          .from('sewa_alat')
          .update({
            nomor_sewa: data.nomorSewa,
            nama_alat: data.namaAlat,
            penyewa: data.penyewa,
            tanggal_mulai: data.tanggalMulai,
            tanggal_selesai: data.tanggalSelesai,
            biaya_sewa: data.biayaSewa,
            status: data.status,
            lokasi: data.lokasi,
            lokasi_sebelumnya: data.lokasi_sebelumnya || data.lokasiSebelumnya || null,
            operator: data.operator,
            jam_pemakaian_per_hari: data.jamPemakaianPerHari || null
          })
          .eq('id', data.id);

        if (error) {
          console.error('Error updating sewa alat:', error.message);
          throw new Error(error.message);
        }
      } catch (error: any) {
        console.error('Error in useUpdateSewaAlat:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sewa-alat'] });
    },
  });
};

export const useDeleteSewaAlat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('sewa_alat')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting sewa alat:', error.message);
          throw new Error(error.message);
        }
      } catch (error: any) {
        console.error('Error in useDeleteSewaAlat:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sewa-alat'] });
    },
  });
};

