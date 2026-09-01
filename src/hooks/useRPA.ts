
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { withTimeout } from '@/utils/withTimeout';
import { useActiveProject } from './useActiveProject';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type RPAItem = {
  id?: number;          // int(11) AUTO_INCREMENT PK dari tabel rpa
  rpa_id: string;       // varchar(50) - kode unik seperti "RPA-001"
  tanggal: string;
  item_pekerjaan: string;
  lokasi_proyek: string;
  status?: 'diproses' | 'digunakan' | 'ditolak' | 'selesai';
  created_at?: string;
  updated_at?: string;
}

export type RPADetailItem = {
  id?: number;          // int(11) AUTO_INCREMENT PK dari tabel rpa_details
  rpa_id: number;       // FK int(11) → rpa.id
  nama_alat: string;
  no_lambung?: string | null;
  uraian_pekerjaan: string;
  mulai_tanggal: string | null;
  selesai_tanggal: string | null;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipe detail tanpa FK (diisi oleh hook secara internal)
export type RPADetailInput = {
  nama_alat: string;
  no_lambung?: string | null;
  uraian_pekerjaan: string;
  mulai_tanggal: string | null;
  selesai_tanggal: string | null;
  keterangan: string | null;
}

// Alias useRPAs as useRPA for backward compatibility
export const useRPA = () => useRPAs();

export const useRPAs = () => {
  const { getProjectId } = useActiveProject();

  return useQuery({
    queryKey: ['rpas'],
    queryFn: async () => {
      try {
        const projectId = getProjectId();
        console.log('Active project ID for RPA:', projectId);

        let query = supabase.from('rpa').select('*');

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await withTimeout(
          Promise.resolve(
            query.order('created_at', { ascending: false }).then((r: any) => r)
          ),
          10000,
          'RPA Fetch'
        ) as any;

        if (error) throw error;
        return data as RPAItem[];
      } catch (err) {
        console.warn('Supabase RPA unavailable, using empty array', err);
        return [];
      }
    },
    retry: 1,
    retryDelay: 500,
  });
};

// Query detail berdasarkan rpa.id (bigint numeric)
export const useRPADetails = (rpaNumericId: number) => {
  const { getProjectId } = useActiveProject();

  return useQuery({
    queryKey: ['rpa-details', rpaNumericId],
    queryFn: async () => {
      try {
        const projectId = getProjectId();
        console.log('Active project ID for RPA details:', projectId);

        let query = supabase.from('rpa_details').select('*').eq('rpa_id', rpaNumericId);

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await withTimeout(
          Promise.resolve(query.then((r: any) => r)),
          10000,
          'RPA Details Fetch'
        ) as any;

        if (error) throw error;
        return data as RPADetailItem[];
      } catch (err) {
        console.warn('Supabase RPA Details unavailable, using empty array', err);
        return [];
      }
    },
    enabled: !!rpaNumericId,
    retry: 1,
    retryDelay: 500,
  });
};

export const useAddRPA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      rpaData: Omit<RPAItem, 'id' | 'created_at' | 'updated_at'>;
      details: RPADetailInput[];
    }) => {
      console.log('Inserting RPA data:', data);
      
      // 1. Insert ke tabel rpa
      const { data: rpaInserted, error: rpaError } = await supabase
        .from('rpa')
        .insert([{
          rpa_id: data.rpaData.rpa_id,
          tanggal: data.rpaData.tanggal,
          item_pekerjaan: data.rpaData.item_pekerjaan,
          lokasi_proyek: data.rpaData.lokasi_proyek || null,
        }])
        .select()
        .single();
      
      if (rpaError) {
        console.error('Error inserting RPA:', rpaError);
        throw rpaError;
      }
      
      console.log('RPA inserted:', rpaInserted);
      
      // 2. Insert detail menggunakan rpaInserted.id (int AUTO_INCREMENT) sebagai FK
      if (data.details && data.details.length > 0) {
        const detailsToInsert = data.details.map(detail => ({
          rpa_id: rpaInserted.id,    // FK int → rpa.id (MySQL AUTO_INCREMENT)
          nama_alat: detail.nama_alat,
          no_lambung: detail.no_lambung || null,
          uraian_pekerjaan: detail.uraian_pekerjaan || null,
          mulai_tanggal: detail.mulai_tanggal || null,
          selesai_tanggal: detail.selesai_tanggal || null,
          keterangan: detail.keterangan || null,
        }));
        
        console.log('Inserting RPA details:', detailsToInsert);
        
        const { error: detailsError } = await supabase
          .from('rpa_details')
          .insert(detailsToInsert);
        
        if (detailsError) {
          console.error('Error inserting RPA details:', detailsError);
          // Rollback: hapus header RPA yang sudah terinput agar tidak ada data orphan
          await supabase.from('rpa').delete().eq('id', rpaInserted.id);
          throw detailsError;
        }
      }
      
      return rpaInserted as RPAItem;
    },
    onSuccess: (insertedData) => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
      queryClient.invalidateQueries({ queryKey: ['rpa-details'] });
      if (insertedData) {
        let cleanApiUrl = API_URL;
        if (cleanApiUrl.endsWith('/')) {
          cleanApiUrl = cleanApiUrl.slice(0, -1);
        }
        fetch(`${cleanApiUrl}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'RPA',
            data: insertedData
          })
        }).catch(err => console.error('Failed to send RPA email:', err));
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });
};

export const useUpdateRPA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: number;                 // rpa.id (int AUTO_INCREMENT)
      rpaData: Partial<Omit<RPAItem, 'id' | 'created_at' | 'updated_at'>>;
      details: RPADetailInput[];
    }) => {
      // Update header RPA
      const { error: rpaError } = await supabase
        .from('rpa')
        .update({
          ...data.rpaData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);
      
      if (rpaError) throw rpaError;
      
      // Hapus detail lama menggunakan FK int (rpa_details.rpa_id = rpa.id)
      const { error: deleteError } = await supabase
        .from('rpa_details')
        .delete()
        .eq('rpa_id', data.id);
      
      if (deleteError) throw deleteError;
      
      // Insert detail baru
      if (data.details.length > 0) {
        const detailsToInsert = data.details.map(detail => ({
          rpa_id: data.id,       // FK int → rpa.id
          nama_alat: detail.nama_alat,
          no_lambung: detail.no_lambung || null,
          uraian_pekerjaan: detail.uraian_pekerjaan || null,
          mulai_tanggal: detail.mulai_tanggal || null,
          selesai_tanggal: detail.selesai_tanggal || null,
          keterangan: detail.keterangan || null,
        }));
        
        const { error: detailsError } = await supabase
          .from('rpa_details')
          .insert(detailsToInsert);
        
        if (detailsError) throw detailsError;
      }
      
      return { id: data.id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
      queryClient.invalidateQueries({ queryKey: ['rpa-details', variables.id] });
    },
  });
};

export const useDeleteRPA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      // Eksplisit delete detail dulu
      const { error: detailsError } = await supabase
        .from('rpa_details')
        .delete()
        .eq('rpa_id', id);
      
      if (detailsError) throw detailsError;
      
      const { error: rpaError } = await supabase
        .from('rpa')
        .delete()
        .eq('id', id);
      
      if (rpaError) throw rpaError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
    },
  });
};

// ─── Helper: update status alat yang terdaftar di rpa_details ────────────────
const updateAlatStatus = async (
  rpaNumericId: number,
  newStatus: 'standby' | 'sedang digunakan' | 'kanibal' | 'pemutihan'
) => {
  const supabaseAny = supabase as any;

  // Ambil data RPA untuk mendapatkan lokasi_proyek
  const { data: rpa, error: rpaError } = await supabaseAny
    .from('rpa')
    .select('lokasi_proyek')
    .eq('id', rpaNumericId)
    .single();

  if (rpaError) throw rpaError;

  // Ambil semua detail alat untuk RPA ini
  const { data: details, error } = await supabaseAny
    .from('rpa_details')
    .select('nama_alat, no_lambung')
    .eq('rpa_id', rpaNumericId);

  if (error) throw error;
  if (!details || details.length === 0) return;

  const updateData: any = { status: newStatus };

  if (newStatus === 'sedang digunakan' && rpa?.lokasi_proyek) {
    updateData.lokasi = rpa.lokasi_proyek;
  } else if (newStatus === 'standby' || newStatus === 'kanibal' || newStatus === 'pemutihan') {
    // Reset lokasi ke Pool saat status standby, kanibal, atau pemutihan
    updateData.lokasi = 'Pool BTG';
  }

  for (const detail of details) {
    const { nama_alat, no_lambung } = detail;

    // Cari & update di alat_berat
    if (no_lambung) {
      await supabaseAny
        .from('alat_berat')
        .update(updateData)
        .eq('no_lambung', no_lambung);

      await supabaseAny
        .from('alat_pendukung')
        .update(updateData)
        .eq('no_lambung', no_lambung);
    } else if (nama_alat) {
      // Fallback: cocokkan berdasarkan nama
      await supabaseAny
        .from('alat_berat')
        .update(updateData)
        .eq('nama_alat', nama_alat);

      await supabaseAny
        .from('alat_pendukung')
        .update(updateData)
        .eq('nama_alat', nama_alat);
    }
  }
};

// ─── Approve RPA → status "digunakan", semua alat → "sedang digunakan" ────────
export const useApproveRPA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rpaNumericId: number) => {
      const { error } = await (supabase as any)
        .from('rpa')
        .update({ status: 'digunakan' })
        .eq('id', rpaNumericId);

      if (error) throw error;

      await updateAlatStatus(rpaNumericId, 'sedang digunakan');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
    },
  });
};

// ─── Reject RPA → status "ditolak", alat tidak berubah ───────────────────────
export const useRejectRPA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rpaNumericId: number) => {
      const { error } = await (supabase as any)
        .from('rpa')
        .update({ status: 'ditolak' })
        .eq('id', rpaNumericId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
    },
  });
};

// ─── Complete RPA → status "selesai", semua alat → "standby" kembali ────────────
export const useCompleteRPA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rpaNumericId: number) => {
      const { error } = await (supabase as any)
        .from('rpa')
        .update({ status: 'selesai' })
        .eq('id', rpaNumericId);

      if (error) throw error;

      await updateAlatStatus(rpaNumericId, 'standby');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpas'] });
      queryClient.invalidateQueries({ queryKey: ['alat-berat'] });
      queryClient.invalidateQueries({ queryKey: ['alat-pendukung'] });
    },
  });
};


