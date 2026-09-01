import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { DEMO_MODE } from '@/contexts/AuthContext';

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

export interface OliStock {
  id: string;
  jenis_oli: string;
  jumlah_stock: number;
  satuan?: string;
  harga_satuan?: number;
  keterangan?: string;
  created_at?: string;
  updated_at?: string;
}

const MOCK_OLI_STOCKS: OliStock[] = [
  { id: '1', jenis_oli: 'Oli SAE 10', jumlah_stock: 450, satuan: 'Liter' },
  { id: '2', jenis_oli: 'Oli SAE 40', jumlah_stock: 820, satuan: 'Liter' },
  { id: '3', jenis_oli: 'Oli SAE 90', jumlah_stock: 300, satuan: 'Liter' },
];

export const useOliStocks = () => {
  return useQuery({
    queryKey: ['oli-stocks'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return MOCK_OLI_STOCKS;
      }

      const projectId = getProjectId();
      console.log('Active project ID for oli stocks:', projectId);

      let query = supabase.from('oli_stocks').select('*');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('jenis_oli', { ascending: true });

      if (error) throw error;

      return data?.map((item: { [key: string]: unknown; jumlah_stock: unknown; harga_satuan?: unknown }) => ({
        ...item,
        jumlah_stock: Number(item.jumlah_stock) || 0,
        harga_satuan: item.harga_satuan ? Number(item.harga_satuan) : undefined
      })) as OliStock[] || [];
    },
  });
};

export const useOliStock = (jenisOli: string) => {
  return useQuery({
    queryKey: ['oli-stock', jenisOli],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oli_stocks')
        .select('*')
        .eq('jenis_oli', jenisOli)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return null;
      return {
        ...data,
        jumlah_stock: Number(data.jumlah_stock) || 0,
        harga_satuan: data.harga_satuan ? Number(data.harga_satuan) : undefined
      } as OliStock;
    },
  });
};

export const useUpdateOliStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ jenisOli, jumlahStock }: { jenisOli: string; jumlahStock: number }) => {
      // Check if stock exists
      const { data: existingStock } = await supabase
        .from('oli_stocks')
        .select('id')
        .eq('jenis_oli', jenisOli)
        .single();
      
      if (existingStock) {
        // Update existing stock
        const { error } = await supabase
          .from('oli_stocks')
          .update({ jumlah_stock: jumlahStock })
          .eq('id', existingStock.id);
        
        if (error) throw error;
      } else {
        // Insert new stock
        const { error } = await supabase
          .from('oli_stocks')
          .insert({
            jenis_oli: jenisOli,
            jumlah_stock: jumlahStock,
            satuan: 'Liter'
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oli-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stock'] });
    },
  });
};

