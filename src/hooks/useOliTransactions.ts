
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import type { OliTransaction } from '@/types/oil';

export const useOliTransactions = (oilType: string) => {
  return useQuery({
    queryKey: ['oli-transactions', oilType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oli_transactions')
        .select('*')
        .eq('jenis_oli', oilType)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching oli transactions:', error);
        throw error;
      }
      
      return data?.map((item: any) => ({
        id: item.id,
        tanggal: item.tanggal,
        jenis: item.jenis as 'pembelian' | 'pemakaian' | 'sisa_stock',
        volume: Number(item.jumlah),
        hargaPembelian: item.cost ? Number(item.cost) : undefined,
        totalHarga: item.cost && item.jumlah ? Number(item.cost) * Number(item.jumlah) : undefined,
        keterangan: item.keterangan,
        noLambung: item.no_lambung || undefined,
        namaAlat: item.nama_alat || undefined,
        lokasiProyek: item.lokasiProyek || undefined
      })) || [];
    },
  });
};

// Helper function to adjust stock in oli_stocks table by delta
const adjustOliStock = async (jenisOli: string, delta: number) => {
  const { data: existingStock } = await supabase
    .from('oli_stocks')
    .select('id, jumlah_stock')
    .eq('jenis_oli', jenisOli)
    .maybeSingle();
  
  const currentStock = Number(existingStock?.jumlah_stock) || 0;
  const newStock = Math.max(0, currentStock + delta);
  
  if (existingStock) {
    const { error } = await supabase
      .from('oli_stocks')
      .update({ jumlah_stock: newStock })
      .eq('id', existingStock.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('oli_stocks')
      .insert({
        jenis_oli: jenisOli,
        jumlah_stock: newStock,
        satuan: 'Liter'
      });
    
    if (error) throw error;
  }
};

export const useAddOliTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: OliTransaction & { oilType: string }) => {
      try {
        if (!data.tanggal || !data.volume || !data.oilType) {
          throw new Error('Tanggal, Volume, dan Jenis Oli harus diisi');
        }

        const { error } = await supabase
          .from('oli_transactions')
          .insert({
            jenis_oli: data.oilType,
            tanggal: data.tanggal,
            jenis: data.jenis,
            jumlah: data.volume,
            cost: data.hargaPembelian || null,
            keterangan: data.keterangan || '',
            no_lambung: data.noLambung || '',
            nama_alat: data.namaAlat || '',
            "lokasiProyek": data.lokasiProyek || null
          });
        
        if (error) {
          console.error('Oli Insert Error:', error.code, error.message, error.details);
          throw new Error(error.message || 'Gagal menyimpan transaksi oli');
        }
        
        // Update stock: pembelian/sisa_stock -> +volume, pemakaian -> -volume
        const delta = (data.jenis === 'pembelian' || data.jenis === 'sisa_stock') ? data.volume : -data.volume;
        await adjustOliStock(data.oilType, delta);
      } catch (error: any) {
        console.error('Error in useAddOliTransaction:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['oli-transactions', variables.oilType] });
      queryClient.invalidateQueries({ queryKey: ['all-oil-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stock'] });
    },
  });
};

export const useUpdateOliTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: OliTransaction & { oilType: string; oldVolume?: number; oldJenis?: 'pembelian' | 'pemakaian' | 'sisa_stock' }) => {
      try {
        if (!data.id) throw new Error('ID is required for update');
        if (!data.tanggal || !data.volume) {
          throw new Error('Tanggal dan Volume harus diisi');
        }

        // Ambil data transaksi lama jika oldVolume/oldJenis belum lengkap
        let oldOilType = data.oilType;
        let oldVolume = data.oldVolume;
        let oldJenis = data.oldJenis;

        if (oldVolume === undefined || !oldJenis) {
          const { data: oldRows } = await supabase
            .from('oli_transactions')
            .select('jenis_oli, jumlah, jenis')
            .eq('id', String(data.id))
            .limit(1);

          if (oldRows && oldRows.length > 0) {
            oldOilType = oldRows[0].jenis_oli || data.oilType;
            oldVolume = Number(oldRows[0].jumlah) || 0;
            oldJenis = oldRows[0].jenis;
          }
        }

        const { error } = await supabase
          .from('oli_transactions')
          .update({
            tanggal: data.tanggal,
            jenis: data.jenis,
            jumlah: data.volume,
            cost: data.hargaPembelian || null,
            keterangan: data.keterangan || '',
            no_lambung: data.noLambung || '',
            nama_alat: data.namaAlat || '',
            "lokasiProyek": data.lokasiProyek || null
          })
          .eq('id', String(data.id));
        
        if (error) {
          console.error('Oli Update Error:', error.code, error.message);
          throw new Error(error.message || 'Gagal mengupdate transaksi oli');
        }
        
        // 1. Revert efek transaksi lama
        if (oldOilType && oldVolume !== undefined && oldJenis) {
          const reverseOld = (oldJenis === 'pembelian' || oldJenis === 'sisa_stock')
            ? -oldVolume
            : oldVolume;
          await adjustOliStock(oldOilType, reverseOld);
        }
        
        // 2. Terapkan efek transaksi baru
        const applyNew = (data.jenis === 'pembelian' || data.jenis === 'sisa_stock')
          ? data.volume
          : -data.volume;
        await adjustOliStock(data.oilType, applyNew);
      } catch (error: any) {
        console.error('Error in useUpdateOliTransaction:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['oli-transactions', variables.oilType] });
      queryClient.invalidateQueries({ queryKey: ['all-oil-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stock'] });
    },
  });
};

export const useDeleteOliTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, oilType, volume, jenis }: { id: string | number; oilType?: string; volume?: number; jenis?: 'pembelian' | 'pemakaian' | 'sisa_stock' }) => {
      // Ambil data transaksi lama sebelum dihapus jika parameter belum lengkap
      let targetOilType = oilType;
      let targetVolume = volume;
      let targetJenis = jenis;

      if (!targetOilType || targetVolume === undefined || !targetJenis) {
        const { data: oldRows } = await supabase
          .from('oli_transactions')
          .select('jenis_oli, jumlah, jenis')
          .eq('id', String(id))
          .limit(1);

        if (oldRows && oldRows.length > 0) {
          targetOilType = oldRows[0].jenis_oli;
          targetVolume = Number(oldRows[0].jumlah) || 0;
          targetJenis = oldRows[0].jenis;
        }
      }

      const { error } = await supabase
        .from('oli_transactions')
        .delete()
        .eq('id', String(id));
      
      if (error) throw error;
      
      // Pulihkan stok: balik efek transaksi yang dihapus
      // pembelian/sisa_stock dihapus -> kurangi stok (-targetVolume)
      // pemakaian dihapus -> KEMBALIKAN STOK (+targetVolume)
      if (targetOilType && targetVolume !== undefined && targetJenis) {
        const reverseDelta = (targetJenis === 'pembelian' || targetJenis === 'sisa_stock')
          ? -targetVolume
          : targetVolume;
        await adjustOliStock(targetOilType, reverseDelta);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oli-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-oil-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['oli-stock'] });
    },
  });
};

