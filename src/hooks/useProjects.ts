import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  nama_project: string;
  cabang: string;
  created_at?: string;
  updated_at?: string;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  const fetchProjects = async (): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      return [];
    }
  };

  const { data, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
  };
};

export const useAddProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const projectData = {
          id: uuidv4(),
          nama_project: data.nama_project,
          cabang: data.cabang,
        };

        const { data: result, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting project:', error);
          throw error;
        }

        return result;
      } catch (error) {
        console.error('Error in useAddProject:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Sukses',
        description: 'Project berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan project',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting project:', error);
          throw error;
        }

        return { success: true };
      } catch (error) {
        console.error('Error in useDeleteProject:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Sukses',
        description: 'Project berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus project',
        variant: 'destructive',
      });
    },
  });
};

export default useProjects;
