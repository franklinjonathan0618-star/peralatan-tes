import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';

export interface BBMStockItem {
  id: string;
  jenisBBM: string;    // jenis_bbm
  jumlahStock: number; // jumlah_stock
  satuan: string;      // satuan
  hargaSatuan: number; // harga_satuan
  keterangan: string;  // keterangan
}

const supabaseAny = supabase as any;

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

const fetchBBMStocks = async (): Promise<BBMStockItem[]> => {
  const projectId = getProjectId();
  console.log('Active project ID for BBM stocks:', projectId);

  let query = supabaseAny.from('bbm_stocks').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('BBM Stocks Fetch Error:', error);
    throw new Error(error.message || 'Gagal memuat data stock BBM');
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    jenisBBM: item.jenis_bbm || '',
    jumlahStock: Number(item.jumlah_stock) || 0,
    satuan: item.satuan || '',
    hargaSatuan: Number(item.harga_satuan) || 0,
    keterangan: item.keterangan || '',
  }));
};

export const useBBMStocks = () => {
  return useQuery<BBMStockItem[]>({
    queryKey: ['bbm-stocks'],
    queryFn: fetchBBMStocks,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export const useAddBBMStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<BBMStockItem, 'id'>) => {
      if (!data.jenisBBM) throw new Error('Jenis BBM harus diisi');

      const { error } = await supabaseAny
        .from('bbm_stocks')
        .insert({
          jenis_bbm: data.jenisBBM,
          jumlah_stock: data.jumlahStock || 0,
          satuan: data.satuan || null,
          harga_satuan: data.hargaSatuan || null,
          keterangan: data.keterangan || null,
        });

      if (error) {
        const msg = [error.message, error.details && `Detail: ${error.details}`, error.hint && `Petunjuk: ${error.hint}`].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal menyimpan data BBM');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

export const useUpdateBBMStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: BBMStockItem) => {
      if (!id) throw new Error('ID diperlukan untuk update');
      if (!data.jenisBBM) throw new Error('Jenis BBM harus diisi');

      const { error } = await supabaseAny
        .from('bbm_stocks')
        .update({
          jenis_bbm: data.jenisBBM,
          jumlah_stock: data.jumlahStock || 0,
          satuan: data.satuan || null,
          harga_satuan: data.hargaSatuan || null,
          keterangan: data.keterangan || null,
        })
        .eq('id', id);

      if (error) {
        const msg = [error.message, error.details && `Detail: ${error.details}`, error.hint && `Petunjuk: ${error.hint}`].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal mengupdate data BBM');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

export const useDeleteBBMStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAny
        .from('bbm_stocks')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Gagal menghapus data BBM');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

