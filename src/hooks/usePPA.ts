
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
import { withTimeout } from '@/utils/withTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export interface PPAItem {
  id: string;
  created_at: string;
  updated_at: string;
  tanggal: string;
  no_ppa: string;
  nama_alat: string;
  no_lambung: string;
  kerusakan: string;
  keterangan: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
}

export const usePPA = () => {
  return useQuery({
    queryKey: ['ppa'],
    queryFn: async () => {
      try {
        const projectId = getProjectId();
        console.log('Active project ID for PPA:', projectId);

        let query = supabase.from('ppa').select('*');

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        // Wrap dengan 10 detik timeout untuk menghindari timeout di network slow
        const { data, error } = await withTimeout(
          Promise.resolve(
            query.order('created_at', { ascending: false }).then((r: any) => r)
          ),
          10000,
          'PPA Fetch'
        ) as any;

        if (error) throw error;
        return data as PPAItem[];
      } catch (err) {
        console.warn('Supabase PPA unavailable, using empty array', err);
        return [];
      }
    },
    retry: 1, // Fast-fail
    retryDelay: 500,
  });
};

export const useAddPPA = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<PPAItem, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!data.tanggal || !data.no_ppa || !data.nama_alat || !data.kerusakan) {
          throw new Error('Tanggal, No. PPA, Nama Alat, dan Kerusakan harus diisi');
        }

        const projectId = getProjectId();
        console.log('Project ID for insert PPA:', projectId);

        const insertData = {
          ...data,
          project_id: projectId,
        };

        const { data: result, error } = await supabase
          .from('ppa')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('PPA Insert Error:', error.code, error.message, error.details);
          throw new Error(error.message || 'Gagal menyimpan PPA');
        }
        return result;
      } catch (error: any) {
        console.error('Error in useAddPPA:', error);
        throw error;
      }
    },
    onSuccess: (insertedData) => {
      queryClient.invalidateQueries({ queryKey: ['ppa'] });
      toast({
        title: 'Berhasil',
        description: 'PPA berhasil ditambahkan',
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
            type: 'PPA',
            data: insertedData
          })
        }).catch(err => console.error('Failed to send PPA email:', err));
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan PPA',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePPA = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PPAItem>) => {
      try {
        if (!id) throw new Error('ID is required for update');

        const { data: result, error } = await supabase
          .from('ppa')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('PPA Update Error:', error.code, error.message);
          throw new Error(error.message || 'Gagal mengupdate PPA');
        }
        return result;
      } catch (error: any) {
        console.error('Error in useUpdatePPA:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppa'] });
      toast({
        title: 'Berhasil',
        description: 'PPA berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui PPA',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePPA = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ppa')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppa'] });
      toast({
        title: 'Berhasil',
        description: 'PPA berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus PPA',
        variant: 'destructive',
      });
    },
  });
};

