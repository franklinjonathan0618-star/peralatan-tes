import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';

let API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

export interface SiloDokumen {
  id?: number;
  no_lambung: string;
  nama_alat?: string;
  nama_dokumen: string;
  nomor_silo?: string | null;
  tanggal_berlaku: string;
  tanggal_selesai: string;
  status: 'aktif' | 'kadaluarsa' | 'diajukan' | 'ditolak';
  status_realtime?: string;
  sisa_hari?: number;
  keterangan?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_mime?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Upload file SILO PDF ke backend
export async function uploadSiloPdf(file: File): Promise<{ fileName: string; filePath: string; fileSize: number; fileMime: string }> {
  return new Promise((resolve, reject) => {
    if (file.type !== 'application/pdf') {
      reject(new Error('File harus berformat PDF'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      reject(new Error('Ukuran file maksimal 50 MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch(`${API_URL}/api/upload-silo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64 })
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'Gagal mengunggah file PDF');
        resolve(json.data);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

// Hook untuk mendapatkan list SILO
export function useSilo(noLambung?: string) {
  return useQuery<SiloDokumen[]>({
    queryKey: ['silo_dokumen', noLambung],
    queryFn: async () => {
      let query = supabase.from('v_silo_dokumen').select('*').order('tanggal_berlaku', { ascending: false });
      if (noLambung) {
        query = query.eq('no_lambung', noLambung);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching SILO:', error);
        throw new Error(error.message);
      }
      return (data || []) as SiloDokumen[];
    },
    staleTime: 30000,
  });
}

// Hook Tambah SILO
export function useCreateSilo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SiloDokumen>) => {
      const { data, error } = await supabase.from('silo_dokumen').insert([payload]).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['silo_dokumen'] });
      toast.success('Dokumen SILO berhasil ditambahkan');
    },
    onError: (err: any) => {
      toast.error(`Gagal menambah SILO: ${err.message}`);
    }
  });
}

// Hook Edit SILO
export function useUpdateSilo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<SiloDokumen> & { id: number }) => {
      const { data, error } = await supabase.from('silo_dokumen').update(payload).eq('id', id).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['silo_dokumen'] });
      toast.success('Dokumen SILO berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(`Gagal memperbarui SILO: ${err.message}`);
    }
  });
}

// Hook Hapus SILO (Soft delete atau Hard delete)
export function useDeleteSilo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Soft delete: update deleted_at
      const { data, error } = await supabase.from('silo_dokumen').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['silo_dokumen'] });
      toast.success('Dokumen SILO berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(`Gagal menghapus SILO: ${err.message}`);
    }
  });
}
