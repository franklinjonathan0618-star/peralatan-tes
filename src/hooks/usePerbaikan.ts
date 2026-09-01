import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import { useSubscription } from './useSubscription';
import { withTimeout } from '@/utils/withTimeout';
import { DEMO_MODE } from '@/contexts/AuthContext';

// Interface definitions
export interface PerbaikanItem {
  id: number;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  perbaikan_id: number;
  created_at: string;
  updated_at: string;
  // Backward compatibility
  nama: string;
  jumlah: number;
  harga: number;
  satuan: string;
  unit: string;
  [key: string]: any; // Allow additional properties
}

export interface Perbaikan {
  id?: string;
  tanggal: string;
  noPerbaikan: string;
  noLambung: string;
  namaAlat: string;
  jenisKerusakan: string;
  penyebabKerusakan?: string | null;
  tindakanPerbaikan?: string | null;
  lokasiPerbaikan: string;
  lokasi_perbaikan?: string;
  lokasi_sebelumnya?: string | null;
  lokasiSebelumnya?: string | null;
  items: PerbaikanItem[];
  totalBiaya: number;
  teknisi: string;
  status: 'pending' | 'dalam_perbaikan' | 'selesai' | 'dibatalkan' | 'menunggu_sparepart';
  foto_sebelum?: string | null;
  foto_setelah?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Mock data for testing without Supabase
const MOCK_PERBAIKAN: Perbaikan[] = [
  {
    id: '1',
    tanggal: '2026-02-01',
    noPerbaikan: 'PRB-001',
    noLambung: 'LB-001',
    namaAlat: 'Excavator CAT 320',
    jenisKerusakan: 'Engine tidak menyala',
    penyebabKerusakan: 'Busi rusak',
    tindakanPerbaikan: 'Ganti busi dan service engine',
    lokasiPerbaikan: 'Workshop A',
    items: [
      { id: 1, itemName: 'Busi', quantity: 4, price: 50000, total: 200000, perbaikan_id: 1, name: 'Busi', created_at: '', updated_at: '' } as any,
      { id: 2, itemName: 'Oli Mesin', quantity: 10, price: 25000, total: 250000, perbaikan_id: 1, name: 'Oli Mesin', created_at: '', updated_at: '' } as any,
    ],
    totalBiaya: 450000,
    teknisi: 'Ahmad Hidayat',
    status: 'selesai',
  },
  {
    id: '2',
    tanggal: '2026-02-03',
    noPerbaikan: 'PRB-002',
    noLambung: 'LB-002',
    namaAlat: 'Dozer Komatsu',
    jenisKerusakan: 'Caterpillar putus',
    penyebabKerusakan: 'Penggunaan intensif',
    tindakanPerbaikan: 'Pasang caterpillar baru',
    lokasiPerbaikan: 'Workshop B',
    items: [
      { id: 3, itemName: 'Caterpillar', quantity: 1, price: 5000000, total: 5000000, perbaikan_id: 2, name: 'Caterpillar', created_at: '', updated_at: '' } as any,
    ],
    totalBiaya: 5000000,
    teknisi: 'Rudi Gunawan',
    status: 'dalam_perbaikan',
  },
];

// Helper: calculate dynamic stock for a sparepart name
const calculateDynamicStock = async (namaSparepart: string): Promise<number> => {
  const { data, error } = await (supabase
    .from('sparepart') as any)
    .select('jumlah, jenis')
    .ilike('nama_sparepart', namaSparepart);

  if (error || !data) return 0;

  let stock = 0;
  for (const row of data) {
    if (row.jenis === 'Pemakaian') {
      stock -= (Number(row.jumlah) || 0);
    } else {
      stock += (Number(row.jumlah) || 0);
    }
  }
  return stock;
};

// Helper: delete pemakaian rows linked to a perbaikan
const deletePemakaianForPerbaikan = async (perbaikanId: string) => {
  const { error } = await (supabase
    .from('sparepart') as any)
    .delete()
    .eq('deskripsi', `perbaikan:${perbaikanId}`)
    .eq('jenis', 'Pemakaian');

  if (error) {
    console.error('Error deleting pemakaian rows:', error);
  }
};

// Helper: insert pemakaian rows for a perbaikan
const insertPemakaianRows = async (
  perbaikanId: string,
  items: any[],
  tanggal: string,
  noPerbaikan: string,
  namaAlat: string
) => {
  for (const item of items) {
    const availableStock = await calculateDynamicStock(item.nama);
    if (availableStock < item.jumlah) {
      throw new Error(
        `Stock "${item.nama}" tidak mencukupi. Tersedia: ${availableStock}, Dibutuhkan: ${item.jumlah}`
      );
    }

    const { error: insertError } = await (supabase
      .from('sparepart') as any)
      .insert({
        nama_sparepart: item.nama,
        jumlah: item.jumlah,
        jenis: 'Pemakaian',
        tanggal: tanggal,
        harga: item.harga || 0,
        satuan: item.satuan || 'pcs',
        deskripsi: `perbaikan:${perbaikanId}`,
        keterangan: `Perbaikan ${noPerbaikan} - ${namaAlat}`,
      });

    if (insertError) {
      console.error('Error inserting pemakaian:', insertError);
      throw new Error(`Gagal menyimpan pemakaian sparepart: ${insertError.message}`);
    }
  }
};

const fetchPerbaikan = async () => {
  if (DEMO_MODE) {
    return MOCK_PERBAIKAN;
  }

  try {
    console.log('Fetching perbaikan data...');

    // Get active project ID from localStorage (simplified approach for this function)
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

    const projectId = getProjectId();
    console.log('Active project ID for perbaikan:', projectId);

    let query = supabase.from('perbaikan').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Wrap dengan 15 detik timeout untuk handle network delay
    const { data, error } = await withTimeout(
      Promise.resolve(
        query.order('created_at', { ascending: false })
      ),
      15000,
      'Perbaikan Fetch'
    ) as any;

    if (error) {
      console.error('Error fetching perbaikan:', error);
      throw new Error(`Gagal memuat data perbaikan: ${error.message}`);
    }

    console.log('Perbaikan data fetched successfully:', data?.length || 0, 'records');

    return data?.map((item: any) => ({
      id: item.id,
      tanggal: item.tanggal,
      noPerbaikan: item.no_perbaikan || '',
      noLambung: item.no_lambung || (item as any).noLambung,
      namaAlat: item.nama_alat,
      jenisKerusakan: item.jenis_kerusakan,
      penyebabKerusakan: item.penyebab_kerusakan,
      tindakanPerbaikan: item.tindakan_perbaikan,
      lokasiPerbaikan: item.lokasi_perbaikan || 'Belum ditentukan',
      lokasi_perbaikan: item.lokasi_perbaikan || 'Belum ditentukan',
      lokasi_sebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || null,
      lokasiSebelumnya: item.lokasi_sebelumnya || item.lokasiSebelumnya || null,
      items: typeof item.items === 'string' ? JSON.parse(item.items || '[]') : (item.items || []),
      totalBiaya: Number(item.total_biaya),
      teknisi: item.teknisi,
      status: item.status,
      foto_sebelum: item.foto_sebelum,
      foto_setelah: item.foto_setelah
    })) as Perbaikan[] || [];
  } catch (err) {
    console.error('Detailed error in perbaikan query:', err);
    console.warn('Supabase connection failed, using mock data for demo');
    // Return mock data as fallback
    return MOCK_PERBAIKAN;
  }
};

export const usePerbaikan = () => {
  const queryClient = useQueryClient();

  // Handle realtime updates with error handling
  const handlePerbaikanChange = useCallback(() => {
    console.log('Perbaikan data changed, invalidating query');
    queryClient.invalidateQueries({ 
      queryKey: ['perbaikan'],
      refetchType: 'active' 
    }).catch(error => {
      console.error('Error invalidating perbaikan query:', error);
    });
  }, [queryClient]);

  // Fetch initial data first
  const { data: initialData, ...queryResult } = useQuery<Perbaikan[]>({
    queryKey: ['perbaikan'],
    queryFn: fetchPerbaikan,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduced from 3 untuk fast-fail
    retryDelay: 500 // Reduced dari exponential
  });

  // Only enable subscription after initial data load
  

  // Use subscription with error handling
  useSubscription({
    supabase,
    table: 'perbaikan',
    event: '*',
    callback: handlePerbaikanChange,
    options: {
      enabled: !DEMO_MODE,
    }
  });

  return {
    ...queryResult,
    data: initialData || []
  };
};

export const useAddPerbaikan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Perbaikan, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        // Validate required fields
        if (!data.tanggal || !data.noPerbaikan || !data.noLambung || !data.namaAlat || !data.jenisKerusakan || !data.lokasiPerbaikan || !data.teknisi) {
          throw new Error('Tanggal, No. Perbaikan, No. Lambung, Nama Alat, Jenis Kerusakan, Lokasi Perbaikan, dan Teknisi harus diisi');
        }

        const perbaikanData = {
          tanggal: data.tanggal,
          no_perbaikan: data.noPerbaikan,
          no_lambung: data.noLambung,
          nama_alat: data.namaAlat,
          jenis_kerusakan: data.jenisKerusakan,
          penyebab_kerusakan: data.penyebabKerusakan || '',
          tindakan_perbaikan: data.tindakanPerbaikan || '',
          lokasi_perbaikan: data.lokasiPerbaikan,
          lokasi_sebelumnya: data.lokasi_sebelumnya || (data as any).lokasiSebelumnya || null,
          items: JSON.stringify(data.items),
          total_biaya: data.totalBiaya,
          teknisi: data.teknisi,
          status: data.status,
          foto_sebelum: data.foto_sebelum || null,
          foto_setelah: data.foto_setelah || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newData, error } = await supabase
          .from('perbaikan')
          .insert(perbaikanData)
          .select()
          .single();

        if (error) {
          console.error('Perbaikan Insert Error:', error.code, error.message, error.details);
          throw new Error(error.message || 'Gagal menyimpan data perbaikan');
        }

        // Insert pemakaian rows in sparepart table (validates stock too)
        try {
          await insertPemakaianRows(
            newData.id,
            data.items,
            data.tanggal,
            data.noPerbaikan,
            data.namaAlat
          );
        } catch (stockError: any) {
          // Rollback: delete the perbaikan we just inserted
          await supabase.from('perbaikan').delete().eq('id', newData.id);
          throw stockError;
        }

        return newData;
      } catch (error: any) {
        console.error('Error in useAddPerbaikan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perbaikan'] });
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
      toast.success('Data perbaikan berhasil disimpan');
    },
    onError: (error: any) => {
      console.error('Error saving perbaikan:', error);
      toast.error(error.message || 'Gagal menyimpan data perbaikan');
    }
  });
};

export const useUpdatePerbaikan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Perbaikan) => {
      try {
        if (!data.id) throw new Error('ID is required for update');
        if (!data.tanggal || !data.noPerbaikan || !data.noLambung || !data.namaAlat || !data.jenisKerusakan || !data.lokasiPerbaikan || !data.teknisi) {
          throw new Error('Tanggal, No. Perbaikan, No. Lambung, Nama Alat, Jenis Kerusakan, Lokasi Perbaikan, dan Teknisi harus diisi');
        }

        // 1. Delete old pemakaian rows (returns stock)
        await deletePemakaianForPerbaikan(String(data.id));

        // 2. Validate new stock and insert new pemakaian rows
        try {
          await insertPemakaianRows(
            String(data.id),
            data.items,
            data.tanggal,
            data.noPerbaikan,
            data.namaAlat
          );
        } catch (stockError: any) {
          // Stock insufficient — don't update perbaikan
          throw stockError;
        }

        // 3. Update the perbaikan record
        const lokasiPerbaikan = data.lokasiPerbaikan || 'Belum ditentukan';
        
        const { error } = await supabase
          .from('perbaikan' as any)
          .update({
            tanggal: data.tanggal,
            no_perbaikan: data.noPerbaikan,
            no_lambung: data.noLambung,
            nama_alat: data.namaAlat,
            jenis_kerusakan: data.jenisKerusakan,
            penyebab_kerusakan: data.penyebabKerusakan,
            tindakan_perbaikan: data.tindakanPerbaikan,
            lokasi_perbaikan: lokasiPerbaikan,
            lokasi_sebelumnya: data.lokasi_sebelumnya || (data as any).lokasiSebelumnya || null,
            items: JSON.stringify(data.items),
            total_biaya: data.totalBiaya,
            teknisi: data.teknisi,
            status: data.status,
            foto_sebelum: data.foto_sebelum,
            foto_setelah: data.foto_setelah
          })
          .eq('id', String(data.id));
        
        if (error) {
          console.error('Perbaikan Update Error:', error.code, error.message);
          throw new Error(error.message || 'Gagal mengupdate data perbaikan');
        }
      } catch (error: any) {
        console.error('Error in useUpdatePerbaikan:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perbaikan'] });
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
      toast.success('Data perbaikan berhasil diperbarui');
    },
    onError: () => {
      toast.error('Gagal memperbarui data perbaikan');
    }
  });
};

export const useDeletePerbaikan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Delete pemakaian rows first (returns stock)
      await deletePemakaianForPerbaikan(id);

      // 2. Delete the perbaikan record
      const { error } = await supabase
        .from('perbaikan' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perbaikan'] });
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
      toast.success('Data perbaikan berhasil dihapus (stock sparepart dikembalikan)');
    },
    onError: () => {
      toast.error('Gagal menghapus data perbaikan');
    }
  });
};

