
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Force refresh for IDE type resolution
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

export interface Sparepart {
  id: string;           // uuid
  namaSparepart: string; // nama_sparepart
  deskripsi: string;    // deskripsi
  satuan: string;       // satuan
  harga: number;        // harga
  jumlah: number;       // jumlah
  sisaStock: number;    // sisa_stock
  keterangan: string;   // keterangan
  tanggal?: string;
  jenis?: string;
}

const fetchSparepart = async () => {
  const projectId = getProjectId();
  console.log('Active project ID for sparepart:', projectId);

  let query = supabase.from('sparepart').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map((item: any) => ({
    id: item.id,
    namaSparepart: item.nama_sparepart || '',
    deskripsi: item.deskripsi || '',
    satuan: item.satuan || '',
    harga: Number(item.harga) || 0,
    jumlah: Number(item.jumlah) || 0,
    sisaStock: Number(item.sisa_stock) || 0,
    keterangan: item.keterangan || '',
    tanggal: item.tanggal || '',
    jenis: item.jenis || '',
  })) || [];
};

export const useSparepart = () => {
  const queryClient = useQueryClient();

  // Setup real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('sparepart_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sparepart' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['sparepart'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery<Sparepart[]>({
    queryKey: ['sparepart'],
    queryFn: fetchSparepart,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};

export const useAddSparepart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Sparepart, 'id'>) => {
      if (!data.namaSparepart) {
        throw new Error('Nama Sparepart harus diisi');
      }

      const { error } = await supabase
        .from('sparepart')
        .insert({
          nama_sparepart: data.namaSparepart,
          deskripsi: data.deskripsi || null,
          satuan: data.satuan || null,
          harga: data.harga || 0,
          jumlah: data.jumlah || 0,
          sisa_stock: data.sisaStock || 0,
          keterangan: data.keterangan || null,
          tanggal: data.tanggal || null,
          jenis: data.jenis || null,
        });
      
      if (error) {
        console.error('Sparepart Insert Error:', error);
        const msg = [
          error.message,
          error.details && `Detail: ${error.details}`,
          error.hint && `Petunjuk: ${error.hint}`,
          error.code && `Kode: ${error.code}`,
        ].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal menyimpan data sparepart ke database');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
    },
  });
};

export const useUpdateSparepart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Sparepart) => {
      if (!id) throw new Error('ID is required for update');
      if (!data.namaSparepart) {
        throw new Error('Nama Sparepart harus diisi');
      }

      const { error } = await supabase
        .from('sparepart')
        .update({
          nama_sparepart: data.namaSparepart,
          deskripsi: data.deskripsi || null,
          satuan: data.satuan || null,
          harga: data.harga || 0,
          jumlah: data.jumlah || 0,
          sisa_stock: data.sisaStock || 0,
          keterangan: data.keterangan || null,
          tanggal: data.tanggal || null,
          jenis: data.jenis || null,
        })
        .eq('id', id);
      
      if (error) {
        console.error('Sparepart Update Error:', error);
        const msg = [
          error.message,
          error.details && `Detail: ${error.details}`,
          error.hint && `Petunjuk: ${error.hint}`,
          error.code && `Kode: ${error.code}`,
        ].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal mengupdate data sparepart ke database');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
    },
  });
};

export const useDeleteSparepart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sparepart')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
    },
  });
};

