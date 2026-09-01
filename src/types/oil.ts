
export interface OliTransaction {
  id: string;
  tanggal: string;
  jenis: 'pembelian' | 'pemakaian' | 'sisa_stock';
  volume: number;
  hargaPembelian?: number;
  totalHarga?: number;
  keterangan: string;
  lokasiProyek?: string;
  noLambung?: string;
  namaAlat?: string;
}

export interface OilType {
  id: string;
  name: string;
}
