import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import { withTimeout } from '@/utils/withTimeout';

export interface SewaAlatInternal {
  id?: string;
  alat_berat_id?: string | null;
  no_lambung?: string | null;
  nama_alat: string;
  vendor: string;
  lokasi_proyek: string;
  lokasi_sebelumnya?: string | null;
  tanggal_sewa: string;
  tanggal_kembali: string;
  biaya_sewa: number;
  biaya_mobilisasi: number;
  biaya_demobilisasi: number;
  biaya_uang_makan_operator: number;
  total_biaya: number;
  keterangan: string;
  status: string;
}

// Mock data untuk offline mode
const MOCK_SEWA_ALAT: SewaAlatInternal[] = [];

// Definisikan query key yang konsisten
const SEWA_ALAT_INTERNAL_QUERY_KEY = 'sewa_alat_internal';

export const useSewaAlatInternal = (options = {}) => {
  return useQuery({
    queryKey: [SEWA_ALAT_INTERNAL_QUERY_KEY],
    queryFn: async () => {
      console.log('Fetching sewa alat internal data');
      try {
        const { data, error } = await withTimeout(
          Promise.resolve(supabase
            .from('sewa_alat_internal')
            .select('*')
            .order('created_at', { ascending: false })
            .then((r: any) => r)
          ),
          15000,
          'Sewa Alat Internal Fetch'
        ) as any;
        
        if (error) {
          console.error('Error fetching sewa alat internal:', error);
          throw error;
        }
        
        return data?.map((item: any) => {
          // Parse YYYY-MM-DD from DB directly to avoid UTC shift
          const tglSewaRaw = (item.tanggal_sewa || '').split('T')[0].split('-');
          const tglKembRaw = (item.tanggal_kembali || '').split('T')[0].split('-');
          
          let calculatedStatus = item.status || 'Aktif';

          if (tglSewaRaw.length === 3 && tglKembRaw.length === 3) {
            const kembaliLocal = new Date(Number(tglKembRaw[0]), Number(tglKembRaw[1]) - 1, Number(tglKembRaw[2]));

            // Dynamic status based on current date vs kembali date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (calculatedStatus === 'Aktif' && today > kembaliLocal) {
              calculatedStatus = 'Selesai';
            }
          }

          const biaya_sewa = Number(item.biaya_sewa) || 0;
          const biaya_mobilisasi = Number(item.biaya_mobilisasi) || 0;
          const biaya_demobilisasi = Number(item.biaya_demobilisasi) || 0;
          const biaya_uang_makan_operator = Number(item.biaya_uang_makan_operator) || 0;
          let total_biaya = Number(item.total_biaya) || 0;

          // If total_biaya is 0, recalculate
          if (total_biaya <= 0 || total_biaya === biaya_sewa) {
            total_biaya = biaya_sewa + biaya_mobilisasi + biaya_demobilisasi + biaya_uang_makan_operator;
          }

          return {
            id: item.id,
            alat_berat_id: item.alat_berat_id || null,
            no_lambung: item.no_lambung || '',
            nama_alat: item.nama_alat,
            vendor: item.vendor,
            lokasi_proyek: item.lokasi_proyek || '',
            lokasi_sebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || '',
            tanggal_sewa: item.tanggal_sewa,
            tanggal_kembali: item.tanggal_kembali,
            biaya_sewa,
            biaya_mobilisasi,
            biaya_demobilisasi,
            biaya_uang_makan_operator,
            total_biaya,
            keterangan: item.keterangan || '',
            status: calculatedStatus
          };
        }) || [];
      } catch (err) {
        console.warn('Supabase sewa alat internal unavailable, using mock data', err);
        return MOCK_SEWA_ALAT;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 500,
    ...options
  });
};

export interface SewaAlatInternalInput {
  id?: string;
  nama_alat: string;
  vendor: string;
  lokasi_proyek: string;
  lokasi_sebelumnya?: string;
  tanggal_sewa: string;
  tanggal_kembali: string;
  biaya_sewa: number | string;
  biaya_mobilisasi: number | string;
  biaya_demobilisasi: number | string;
  biaya_uang_makan_operator: number | string;
  total_biaya: number | string;
  keterangan: string;
  status?: string;
}

export const useAddSewaAlatInternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SewaAlatInternal) => {
      // Validasi data sebelum disimpan
      if (!data.nama_alat || !data.vendor || !data.tanggal_sewa || !data.tanggal_kembali) {
        throw new Error('Semua field wajib diisi');
      }

      // Pastikan nilai numerik valid
      const biaya_sewa = Number(data.biaya_sewa) || 0;
      const biaya_mobilisasi = Number(data.biaya_mobilisasi) || 0;
      const biaya_demobilisasi = Number(data.biaya_demobilisasi) || 0;
      const biaya_uang_makan_operator = Number(data.biaya_uang_makan_operator) || 0;
      const total_biaya = Number(data.total_biaya) || 0;

      // Check existing equipment in alat_berat
      let existingAlat: any = null;
      let targetNoLambung = data.no_lambung?.trim();
      const targetNamaAlat = data.nama_alat.trim();

      if (targetNoLambung) {
        const { data: byLambung } = await supabase
          .from('alat_berat')
          .select('*')
          .eq('no_lambung', targetNoLambung);
        if (byLambung && byLambung.length > 0) {
          existingAlat = byLambung[0];
        }
      }

      if (!existingAlat && targetNamaAlat) {
        const { data: byNama } = await supabase
          .from('alat_berat')
          .select('*')
          .ilike('nama_alat', targetNamaAlat);
        if (byNama && byNama.length > 0) {
          existingAlat = byNama[0];
          if (!targetNoLambung) {
            targetNoLambung = existingAlat.no_lambung;
          }
        }
      }

      if (!targetNoLambung) {
        targetNoLambung = 'SL-' + (Math.floor(100 + Math.random() * 900)).toString();
      }

      // Siapkan data untuk disimpan dengan proper types
      const insertData = {
        alat_berat_id: existingAlat?.id || null,
        no_lambung: targetNoLambung,
        nama_alat: targetNamaAlat,
        vendor: data.vendor.trim(),
        lokasi_proyek: data.lokasi_proyek?.trim() || '',
        lokasi_sebelumnya: data.lokasi_sebelumnya?.trim() || (existingAlat?.lokasi || null),
        tanggal_sewa: data.tanggal_sewa,
        tanggal_kembali: data.tanggal_kembali,
        biaya_sewa: biaya_sewa,
        biaya_mobilisasi: biaya_mobilisasi,
        biaya_demobilisasi: biaya_demobilisasi,
        biaya_uang_makan_operator: biaya_uang_makan_operator,
        total_biaya: total_biaya,
        keterangan: data.keterangan?.trim() || '',
        status: data.status || 'Aktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting data sewa alat internal:', insertData);
      
      try {
        const { data: result, error } = await supabase
          .from('sewa_alat_internal')
          .insert(insertData)
          .select();
        
        if (error) throw error;
        
        const singleResult = Array.isArray(result) ? result[0] : result;
        console.log('Data sewa alat internal berhasil disimpan:', singleResult);

        // Sinkronisasi ke Data Alat Berat dengan status "sewa luar"
        if (existingAlat) {
          await supabase
            .from('alat_berat')
            .update({
              status: 'sewa luar',
              lokasi: data.lokasi_proyek?.trim() || existingAlat.lokasi,
              lokasi_sebelumnya: data.lokasi_sebelumnya?.trim() || existingAlat.lokasi || 'Pool BTG',
              keterangan: data.keterangan ? `${data.keterangan} (Sewa Internal dari ${data.vendor})` : `Sewa Internal dari ${data.vendor}`,
            })
            .eq('id', existingAlat.id);
        } else {
          await supabase
            .from('alat_berat')
            .insert({
              nama_alat: targetNamaAlat,
              no_lambung: targetNoLambung,
              lokasi: data.lokasi_proyek?.trim() || 'Site',
              lokasi_sebelumnya: data.lokasi_sebelumnya?.trim() || 'Pool BTG',
              status: 'sewa luar',
              merk: data.vendor?.trim() || 'Sewa Luar',
              tipe: 'Sewa Internal',
              kondisi: 'Baik',
              fisik_alat: 100,
              keterangan: `Alat sewa internal dari ${data.vendor}`,
            });
        }

        return singleResult;
      } catch (error: any) {
        console.error('Error saat menyimpan data sewa alat internal:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_INTERNAL_QUERY_KEY] 
      });
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      queryClient.invalidateQueries({ queryKey: ['alatBerat'] });
      
      toast.success('Data sewa alat internal berhasil disimpan', {
        description: 'Data telah berhasil ditambahkan dan terhubung dengan Data Alat Berat (Status: Sewa Luar).'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error('Gagal menyimpan data', {
        description: error.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.'
      });
    }
  });
};

export const useUpdateSewaAlatInternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SewaAlatInternal) => {
      if (!data.nama_alat || !data.vendor || !data.lokasi_proyek || !data.tanggal_sewa || !data.tanggal_kembali) {
        throw new Error('Semua field wajib diisi');
      }

      const biaya_sewa = Number(data.biaya_sewa) || 0;
      const biaya_mobilisasi = Number(data.biaya_mobilisasi) || 0;
      const biaya_demobilisasi = Number(data.biaya_demobilisasi) || 0;
      const biaya_uang_makan_operator = Number(data.biaya_uang_makan_operator) || 0;
      const total_biaya = Number(data.total_biaya) || 0;

      const updateData = {
        no_lambung: data.no_lambung?.trim() || undefined,
        nama_alat: data.nama_alat.trim(),
        vendor: data.vendor.trim(),
        lokasi_proyek: data.lokasi_proyek?.trim() || '',
        lokasi_sebelumnya: data.lokasi_sebelumnya?.trim() || null,
        tanggal_sewa: data.tanggal_sewa,
        tanggal_kembali: data.tanggal_kembali,
        biaya_sewa: biaya_sewa,
        biaya_mobilisasi: biaya_mobilisasi,
        biaya_demobilisasi: biaya_demobilisasi,
        biaya_uang_makan_operator: biaya_uang_makan_operator,
        total_biaya: total_biaya,
        keterangan: data.keterangan?.trim() || '',
        status: data.status || 'Aktif',
        updated_at: new Date().toISOString()
      };

      console.log('Updating data sewa alat internal:', updateData);
      
      try {
        const { data: result, error } = await supabase
          .from('sewa_alat_internal')
          .update(updateData)
          .eq('id', data.id!)
          .select();
        
        if (error) throw error;
        
        const singleResult = Array.isArray(result) ? result[0] : result;
        console.log('Data sewa alat internal berhasil diperbarui:', singleResult);

        // Sinkronisasi update ke alat_berat jika no_lambung ada
        if (data.no_lambung) {
          await supabase
            .from('alat_berat')
            .update({
              status: 'sewa luar',
              lokasi: data.lokasi_proyek?.trim() || '',
              lokasi_sebelumnya: data.lokasi_sebelumnya?.trim() || 'Pool BTG',
            })
            .eq('no_lambung', data.no_lambung);
        }

        return singleResult;
      } catch (error: any) {
        console.error('Error saat memperbarui data sewa alat internal:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_INTERNAL_QUERY_KEY] 
      });
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      queryClient.invalidateQueries({ queryKey: ['alatBerat'] });
      
      toast.success('Data sewa alat internal berhasil diperbarui', {
        description: 'Data telah berhasil diperbarui dan disinkronkan ke Data Alat Berat.'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error('Gagal memperbarui data', {
        description: error.message || 'Terjadi kesalahan saat memperbarui data. Silakan coba lagi.'
      });
    }
  });
};

export const useDeleteSewaAlatInternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Mencoba menghapus data sewa alat internal:', id);
      
      try {
        // Ambil data sewa sebelum dihapus untuk mengetahui no_lambung alat
        const { data: existingRows } = await supabase
          .from('sewa_alat_internal')
          .select('*')
          .eq('id', id);
        
        const existingItem = Array.isArray(existingRows) ? existingRows[0] : existingRows;

        const { data: result, error } = await supabase
          .from('sewa_alat_internal')
          .delete()
          .eq('id', id)
          .select();
        
        if (error) throw error;
        
        const singleResult = Array.isArray(result) ? result[0] : result;
        console.log('Data sewa alat internal berhasil dihapus:', singleResult);

        // Jika terhubung ke alat berat, kembalikan statusnya ke standby
        if (existingItem?.no_lambung) {
          await supabase
            .from('alat_berat')
            .update({
              status: 'standby',
              lokasi: existingItem.lokasi_sebelumnya || 'Pool BTG',
            })
            .eq('no_lambung', existingItem.no_lambung);
        }

        return singleResult;
      } catch (error: any) {
        console.error('Error saat menghapus data sewa alat internal:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_INTERNAL_QUERY_KEY] 
      });
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      queryClient.invalidateQueries({ queryKey: ['alatBerat'] });
      
      toast.success('Data sewa alat internal berhasil dihapus', {
        description: 'Data telah berhasil dihapus dan status alat berat dikembalikan ke Standby.'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error('Gagal menghapus data', {
        description: error.message || 'Terjadi kesalahan saat menghapus data. Silakan coba lagi.'
      });
    }
  });
};
