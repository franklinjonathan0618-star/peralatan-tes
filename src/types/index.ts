
export interface AlatPendukung {
  id: string;
  namaAlat: string;
  noLambung?: string | null;
  jenisAlat?: string | null;
  tahunPerolehan?: number | null;
  nilaiPerolehan?: number | null;
  lokasi?: string | null;
  lokasiSebelumnya?: string | null;
  lokasi_sebelumnya?: string | null;
  status?: string | null;
  keterangan?: string | null;
  merk?: string | null;
  tipe?: string | null;
  kondisi?: string | null;
  gambar?: string | null;
  foto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AlatBerat {
  id: string;
  no_lambung: string;
  nama_alat: string;
  jenis_alat?: string;
  tahun_perolehan?: number;
  nilai_perolehan?: number;
  lokasi?: string;
  lokasi_sebelumnya?: string;
  lokasiSebelumnya?: string;
  status?: string;
  keterangan?: string;
  merk?: string;
  tipe?: string;
  noSeri?: string;
  kondisi?: string;
  fisik_alat?: number;
  serviceTerakhir?: string;
  serviceBerikutnya?: string;
  foto?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BBMData {
  id: string;
  tanggalPembelian: Date;
  volumePembelian: number;
  hargaPerLiter: number;
  tanggalPemakaian: Date | null;
  volumePemakaian: number;
  keteranganPemakaian: string;
  namaAlatBerat: string;
  lokasiProyek?: string;
  totalHarga?: number;
}

export interface KegiatanMekanik {
  id?: string;
  user_id?: string | undefined;
  tanggal: Date | string;
  no_ppa: string | null;
  no_lambung: string;
  nama_alat: string | null;
  nama_mekanik: string;
  lokasi_pekerjaan: string;
  lokasi_sebelumnya?: string | null;
  keterangan: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Pemutihan {
  id: string;
  no_lambung: string;
  nama_alat: string;
  merk?: string;
  tipe?: string;
  part_terlepas?: string;
status: 'kanibal' | 'terjual' | 'pemutihan';
  status_pemutihan?: 'pending' | 'approved' | 'rejected' | 'completed';
  keterangan?: string;
  tanggal?: string;
  created_at?: string;
  updated_at?: string;
}

