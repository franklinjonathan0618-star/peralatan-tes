
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';

// Interface sesuai skema tabel bbm_transactions
export interface BBMTransaction {
  id: string;
  tanggal: string;       // date → string 'yyyy-MM-dd'
  jenisBBM: string;      // jenis_bbm
  jumlah: number;        // jumlah
  satuan: string;        // satuan
  noLambung: string;     // no_lambung
  namaAlat: string;      // nama_alat
  cost: number;          // cost
  keterangan: string;    // keterangan
  jenis?: 'pembelian' | 'pemakaian' | 'sisa_stock';
  lokasiProyek?: string;
}

const supabaseAny = supabase as any;

const fetchBBMTransactions = async (): Promise<BBMTransaction[]> => {
  const { data, error } = await supabaseAny
    .from('bbm_transactions')
    .select('*')
    .order('tanggal', { ascending: false });

  if (error) {
    console.error('BBM Transactions Fetch Error:', error);
    throw new Error(error.message || 'Gagal memuat data transaksi BBM');
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    tanggal: item.tanggal || '',
    jenisBBM: item.jenis_bbm || '',
    jumlah: Number(item.jumlah) || 0,
    satuan: item.satuan || '',
    noLambung: item.no_lambung || '',
    namaAlat: item.nama_alat || '',
    cost: Number(item.cost) || 0,
    keterangan: item.keterangan || '',
    jenis: item.jenis || 'pemakaian',
    lokasiProyek: item.lokasiProyek || '',
  }));
};

export const useBBMTransactions = () => {
  return useQuery<BBMTransaction[]>({
    queryKey: ['bbm-transactions'],
    queryFn: fetchBBMTransactions,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

// ── Helper: update jumlah_stock berdasarkan jenis & delta ──────────────────
async function adjustStock(jenisBBM: string, delta: number) {
  const { data: stockRows } = await supabaseAny
    .from('bbm_stocks')
    .select('id, jumlah_stock')
    .eq('jenis_bbm', jenisBBM)
    .limit(1);

  if (!stockRows || stockRows.length === 0) {
    const newQty = Math.max(0, delta);
    await supabaseAny
      .from('bbm_stocks')
      .insert({
        jenis_bbm: jenisBBM,
        jumlah_stock: newQty,
        satuan: 'liter',
        harga_satuan: 0,
        keterangan: 'Auto-initialized from transaction'
      });
    return;
  }

  const stock = stockRows[0];
  const newQty = Math.max(0, (Number(stock.jumlah_stock) || 0) + delta);

  await supabaseAny
    .from('bbm_stocks')
    .update({ jumlah_stock: newQty })
    .eq('id', stock.id);
}

export const useAddBBMTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<BBMTransaction, 'id'>) => {
      if (!data.tanggal) throw new Error('Tanggal harus diisi');
      if (!data.jenisBBM) throw new Error('Jenis BBM harus diisi');
      if (!data.jumlah || data.jumlah <= 0) throw new Error('Jumlah harus lebih dari 0');

      const { error } = await supabaseAny
        .from('bbm_transactions')
        .insert({
          tanggal: data.tanggal,
          jenis_bbm: data.jenisBBM,
          jumlah: data.jumlah,
          satuan: data.satuan || null,
          no_lambung: data.noLambung || '',
          nama_alat: data.namaAlat || '',
          cost: data.cost || null,
          keterangan: data.keterangan || null,
          jenis: data.jenis || 'pemakaian',
          "lokasiProyek": data.lokasiProyek || null,
        });

      if (error) {
        console.error('BBM Transaction Insert Error:', error);
        const msg = [
          error.message,
          error.details && `Detail: ${error.details}`,
          error.hint && `Petunjuk: ${error.hint}`,
          error.code && `Kode: ${error.code}`,
        ].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal menyimpan transaksi BBM');
      }

      // ── Sinkronisasi master stock ──────────────────────────
      // pemakaian → kurangi stok, pembelian → tambah stok
      const delta = (data.jenis === 'pembelian' || data.jenis === 'sisa_stock') ? data.jumlah : -data.jumlah;
      await adjustStock(data.jenisBBM, delta);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

export const useUpdateBBMTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: BBMTransaction) => {
      if (!id) throw new Error('ID diperlukan untuk update');
      if (!data.tanggal) throw new Error('Tanggal harus diisi');
      if (!data.jenisBBM) throw new Error('Jenis BBM harus diisi');

      // Ambil transaksi lama sebelum diubah
      const { data: oldRows } = await supabaseAny
        .from('bbm_transactions')
        .select('jenis_bbm, jumlah, jenis')
        .eq('id', id)
        .limit(1);

      const oldTx = oldRows && oldRows.length > 0 ? oldRows[0] : null;

      const { error } = await supabaseAny
        .from('bbm_transactions')
        .update({
          tanggal: data.tanggal,
          jenis_bbm: data.jenisBBM,
          jumlah: data.jumlah,
          satuan: data.satuan || null,
          no_lambung: data.noLambung || '',
          nama_alat: data.namaAlat || '',
          cost: data.cost || null,
          keterangan: data.keterangan || null,
          jenis: data.jenis || 'pemakaian',
          "lokasiProyek": data.lokasiProyek || null,
        })
        .eq('id', id);

      if (error) {
        console.error('BBM Transaction Update Error:', error);
        const msg = [
          error.message,
          error.details && `Detail: ${error.details}`,
          error.hint && `Petunjuk: ${error.hint}`,
          error.code && `Kode: ${error.code}`,
        ].filter(Boolean).join(' | ');
        throw new Error(msg || 'Gagal mengupdate transaksi BBM');
      }

      // ── Balik efek lama, terapkan efek baru ─────────────
      if (oldTx) {
        // Balik efek transaksi lama
        const reverseOld = (oldTx.jenis === 'pembelian' || oldTx.jenis === 'sisa_stock')
          ? -Number(oldTx.jumlah)
          : Number(oldTx.jumlah);
        await adjustStock(oldTx.jenis_bbm, reverseOld);
      }

      // Terapkan efek transaksi baru
      const applyNew = (data.jenis === 'pembelian' || data.jenis === 'sisa_stock') ? data.jumlah : -data.jumlah;
      await adjustStock(data.jenisBBM, applyNew);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

export const useDeleteBBMTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Ambil data transaksi sebelum dihapus
      const { data: oldRows } = await supabaseAny
        .from('bbm_transactions')
        .select('jenis_bbm, jumlah, jenis')
        .eq('id', id)
        .limit(1);

      const oldTx = oldRows && oldRows.length > 0 ? oldRows[0] : null;

      const { error } = await supabaseAny
        .from('bbm_transactions')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Gagal menghapus transaksi BBM');

      // ── Pulihkan stok: balik efek transaksi yang dihapus ──
      if (oldTx) {
        const reverseDelta = (oldTx.jenis === 'pembelian' || oldTx.jenis === 'sisa_stock')
          ? -Number(oldTx.jumlah)   // pembelian/sisa_stock dihapus → kurangi stok
          : Number(oldTx.jumlah);   // pemakaian dihapus → kembalikan stok
        await adjustStock(oldTx.jenis_bbm, reverseDelta);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bbm-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bbm-stocks'] });
    },
  });
};

