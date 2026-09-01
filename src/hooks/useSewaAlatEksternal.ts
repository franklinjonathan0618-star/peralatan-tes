
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import { withTimeout } from '@/utils/withTimeout';

interface SewaAlatEksternal {
  id?: string;
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
const MOCK_SEWA_ALAT: SewaAlatEksternal[] = [
  {
    id: '1',
    nama_alat: 'Excavator Komatsu',
    vendor: 'PT Sewa Alat Jaya',
    lokasi_proyek: 'Proyek A',
    tanggal_sewa: '2026-02-01',
    tanggal_kembali: '2026-02-28',
    biaya_sewa: 5000000,
    biaya_mobilisasi: 1000000,
    biaya_demobilisasi: 1000000,
    biaya_uang_makan_operator: 50000,
    total_biaya: 15500000,
    keterangan: 'Sewa untuk proyek A',
    status: 'Aktif'
  }
];

// Definisikan query key yang konsisten
const SEWA_ALAT_EKSTERNAL_QUERY_KEY = 'sewa_alat_eksternal';

export const useSewaAlatEksternal = (options = {}) => {
  return useQuery({
    queryKey: [SEWA_ALAT_EKSTERNAL_QUERY_KEY],
    queryFn: async () => {
      console.log('Fetching sewa alat eksternal data');
      try {
        // Wrap dengan 3 detik timeout untuk fast-fail
        const { data, error } = await withTimeout(
          Promise.resolve(supabase
            .from('sewa_alat_eksternal')
            .select('*')
            .order('created_at', { ascending: false })
            .then((r: any) => r)
          ),
          15000,
          'Sewa Alat Eksternal Fetch'
        ) as any;
        
        if (error) {
          console.error('Error fetching sewa alat eksternal:', error);
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
        console.warn('Supabase sewa alat eksternal unavailable, using mock data', err);
        return MOCK_SEWA_ALAT;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Fast-fail untuk mock data
    retryDelay: 500,
    ...options
  });
};

export interface SewaAlatInput {
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

export const useAddSewaAlatEksternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SewaAlatEksternal) => {
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

      // Siapkan data untuk disimpan dengan proper types
      const insertData = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting data:', insertData);

      console.log('Mencoba menyimpan data:', insertData);
      
      try {
        // Coba insert data
        const { data: result, error } = await supabase
          .from('sewa_alat_eksternal')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        
        console.log('Data berhasil disimpan:', result);
        return result;
      } catch (error: any) {
        console.error('Error saat menyimpan data:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stack: error.stack
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries untuk memastikan data terbaru diambil
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_EKSTERNAL_QUERY_KEY] 
      });
      
      // Tampilkan notifikasi sukses
      toast.success('Data sewa alat eksternal berhasil disimpan', {
        description: 'Data telah berhasil ditambahkan ke database.'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      
      // Tampilkan notifikasi error yang lebih deskriptif
      toast.error('Gagal menyimpan data', {
        description: error.message || 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.'
      });
    }
  });
};

export const useUpdateSewaAlatEksternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SewaAlatEksternal) => {
      // Validasi data sebelum disimpan
      if (!data.nama_alat || !data.vendor || !data.lokasi_proyek || !data.tanggal_sewa || !data.tanggal_kembali) {
        throw new Error('Semua field wajib diisi');
      }

      // Pastikan nilai numerik valid
      const biaya_sewa = Number(data.biaya_sewa) || 0;
      const biaya_mobilisasi = Number(data.biaya_mobilisasi) || 0;
      const biaya_demobilisasi = Number(data.biaya_demobilisasi) || 0;
      const biaya_uang_makan_operator = Number(data.biaya_uang_makan_operator) || 0;
      const total_biaya = Number(data.total_biaya) || 0;

      // Siapkan data untuk disimpan dengan proper types
      const updateData = {
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

      console.log('Updating data:', updateData);

      console.log('Mencoba memperbarui data:', updateData);
      
      try {
        // Coba update data
        const { data: result, error } = await supabase
          .from('sewa_alat_eksternal')
          .update(updateData)
          .eq('id', data.id!)
          .select()
          .single();
        
        if (error) throw error;
        
        console.log('Data berhasil diperbarui:', result);
        return result;
      } catch (error: any) {
        console.error('Error saat memperbarui data:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stack: error.stack
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries untuk memastikan data terbaru diambil
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_EKSTERNAL_QUERY_KEY] 
      });
      
      // Tampilkan notifikasi sukses
      toast.success('Data sewa alat eksternal berhasil diperbarui', {
        description: 'Data telah berhasil diperbarui di database.'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      
      // Tampilkan notifikasi error yang lebih deskriptif
      toast.error('Gagal memperbarui data', {
        description: error.message || 'Terjadi kesalahan saat memperbarui data. Silakan coba lagi.'
      });
    }
  });
};

export const useDeleteSewaAlatEksternal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Mencoba menghapus data:', id);
      
      try {
        // Coba hapus data
        const { data: result, error } = await supabase
          .from('sewa_alat_eksternal')
          .delete()
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        console.log('Data berhasil dihapus:', result);
        return result;
      } catch (error: any) {
        console.error('Error saat menghapus data:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stack: error.stack
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries untuk memastikan data terbaru diambil
      queryClient.invalidateQueries({ 
        queryKey: [SEWA_ALAT_EKSTERNAL_QUERY_KEY] 
      });
      
      // Tampilkan notifikasi sukses
      toast.success('Data sewa alat eksternal berhasil dihapus', {
        description: 'Data telah berhasil dihapus dari database.'
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      
      // Tampilkan notifikasi error yang lebih deskriptif
      toast.error('Gagal menghapus data', {
        description: error.message || 'Terjadi kesalahan saat menghapus data. Silakan coba lagi.'
      });
    }
  });
};

