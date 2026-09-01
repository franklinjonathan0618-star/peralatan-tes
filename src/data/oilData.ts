
import { OliTransaction } from '@/types/oil';

export const oilTypes = [
  { id: 'oli-40', name: 'Oli 40' },
  { id: 'oli-10', name: 'Oli 10' },
  { id: 'oli-90', name: 'Oli 90' },
];

export const sampleOilTransactions: OliTransaction[] = [
  {
    id: '1',
    tanggal: '2024-01-15',
    jenis: 'pembelian',
    volume: 100,
    hargaPembelian: 15000,
    totalHarga: 1500000,
    keterangan: 'Pembelian oli untuk stok awal'
  },
  {
    id: '2',
    tanggal: '2024-01-16',
    jenis: 'pemakaian',
    volume: 20,
    hargaPembelian: 15000,
    totalHarga: 300000,
    keterangan: 'Pemakaian untuk excavator unit 001'
  },
  {
    id: '3',
    tanggal: '2024-01-17',
    jenis: 'pembelian',
    volume: 50,
    hargaPembelian: 15500,
    totalHarga: 775000,
    keterangan: 'Pembelian tambahan oli 40'
  },
  {
    id: '4',
    tanggal: '2024-01-18',
    jenis: 'pemakaian',
    volume: 15,
    hargaPembelian: 15000,
    totalHarga: 225000,
    keterangan: 'Service rutin bulldozer unit 002'
  },
  {
    id: '5',
    tanggal: '2024-01-20',
    jenis: 'pembelian',
    volume: 75,
    hargaPembelian: 16000,
    totalHarga: 1200000,
    keterangan: 'Restok oli 90 untuk maintenance'
  },
  {
    id: '6',
    tanggal: '2024-01-22',
    jenis: 'pemakaian',
    volume: 25,
    hargaPembelian: 16000,
    totalHarga: 400000,
    keterangan: 'Ganti oli mesin grader unit 003'
  },
  {
    id: '7',
    tanggal: '2024-01-25',
    jenis: 'pemakaian',
    volume: 30,
    hargaPembelian: 15500,
    totalHarga: 465000,
    keterangan: 'Maintenance loader unit 004'
  },
  {
    id: '8',
    tanggal: '2024-01-28',
    jenis: 'pembelian',
    volume: 120,
    hargaPembelian: 15800,
    totalHarga: 1896000,
    keterangan: 'Pembelian bulanan oli untuk stok'
  }
];
