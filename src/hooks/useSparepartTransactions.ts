import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/api/client';

export interface SparepartTransaction {
  id: string;
  sparepart_id: string;
  tanggal: string;
  jenis: 'masuk' | 'keluar';
  jumlah: number;
  satuan: string;
  no_lambung?: string;
  nama_alat?: string;
  no_perbaikan?: string;
  keterangan?: string;
  created_at: string;
  updated_at: string;
}

const fetchSparepartTransactions = async (sparepartId?: string) => {
  let query = supabase
    .from('sparepart_transactions')
    .select('*')
    .order('tanggal', { ascending: false });
  
  if (sparepartId) {
    query = query.eq('sparepart_id', sparepartId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data?.map((item: any) => ({
    id: item.id,
    sparepart_id: item.sparepart_id,
    tanggal: item.tanggal,
    jenis: item.jenis,
    jumlah: Number(item.jumlah) || 0,
    satuan: item.satuan || '',
    no_lambung: item.no_lambung || '',
    nama_alat: item.nama_alat || '',
    no_perbaikan: item.no_perbaikan || '',
    keterangan: item.keterangan || '',
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const useSparepartTransactions = (sparepartId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('sparepart_transactions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sparepart_transactions' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['sparepartTransactions', sparepartId] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, sparepartId]);

  return useQuery<SparepartTransaction[]>({
    queryKey: ['sparepartTransactions', sparepartId],
    queryFn: () => fetchSparepartTransactions(sparepartId),
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};

export const useAddSparepartTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<SparepartTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('sparepart_transactions')
        .insert({
          sparepart_id: data.sparepart_id,
          tanggal: data.tanggal || new Date().toISOString(),
          jenis: data.jenis,
          jumlah: data.jumlah,
          satuan: data.satuan || null,
          no_lambung: data.no_lambung || null,
          nama_alat: data.nama_alat || null,
          no_perbaikan: data.no_perbaikan || null,
          keterangan: data.keterangan || null,
        });
      
      if (error) {
        console.error('Sparepart Transaction Insert Error:', error);
        const msg = [
          error.message,
          error.details && `Detail: ${error.details}`,
          error.hint && `Petunjuk: ${error.hint}`,
          error.code && `Kode: ${error.code}`,
        ].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal menyimpan transaksi sparepart');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparepartTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['sparepart'] });
    },
  });
};

