
import React from 'react';
import { format } from 'date-fns';
import { OliTransaction } from '../../types/oil';

interface PrintableOilStockProps {
  transactions: OliTransaction[];
  oilType: string;
}

const PrintableOilStock: React.FC<PrintableOilStockProps> = ({ transactions, oilType }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  let totalPembelian = 0;
  let totalSisaStock = 0;
  let totalPemakaian = 0;

  transactions.forEach((item) => {
    const vol = Number(item.volume) || 0;
    if (item.jenis === 'pembelian') {
      totalPembelian += vol;
    } else if (item.jenis === 'sisa_stock') {
      totalSisaStock += vol;
    } else if (item.jenis === 'pemakaian') {
      totalPemakaian += vol;
    }
  });

  const totalStokAkhir = (totalPembelian + totalSisaStock) - totalPemakaian;

  return (
    <div className="p-4 bg-white text-gray-900" style={{ width: '100%', margin: '0 auto', fontSize: '11px' }}>
      <style type="text/css" media="print">{`
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; font-size: 11px; padding: 0; margin: 0; }
        }
      `}</style>
      <div className="mb-4 pb-2 border-b-2 border-gray-900" style={{ width: '100%' }}>
        <div className="font-bold text-sm">Cabang Papua</div>
        <div className="text-xs text-gray-600">Peralatan</div>
      </div>
      <div className="mb-4 text-center">
        <h1 className="text-base font-bold text-blue-900 mb-1">DAFTAR TRANSAKSI STOCK {oilType.toUpperCase()}</h1>
        <p className="text-xs text-gray-500">Tanggal Cetak: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      <table className="w-full border-collapse border border-gray-400" style={{ width: '100%' }}>
        <thead>
          <tr className="bg-gray-100 font-bold text-center">
            <th className="border border-gray-400 px-2 py-1.5" style={{ width: '35px' }}>No</th>
            <th className="border border-gray-400 px-2 py-1.5">Tanggal</th>
            <th className="border border-gray-400 px-2 py-1.5">Jenis Transaksi</th>
            <th className="border border-gray-400 px-2 py-1.5">Volume (L)</th>
            <th className="border border-gray-400 px-2 py-1.5">Harga per Liter</th>
            <th className="border border-gray-400 px-2 py-1.5">Total Harga</th>
            <th className="border border-gray-400 px-2 py-1.5">No. Lambung</th>
            <th className="border border-gray-400 px-2 py-1.5">Nama Alat</th>
            <th className="border border-gray-400 px-2 py-1.5">Lokasi Proyek</th>
            <th className="border border-gray-400 px-2 py-1.5">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-400 px-2 py-1 text-center">{index + 1}</td>
              <td className="border border-gray-400 px-2 py-1">{item.tanggal ? format(new Date(item.tanggal), 'dd/MM/yyyy') : '-'}</td>
              <td className="border border-gray-400 px-2 py-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis === 'pembelian' ? 'bg-blue-100 text-blue-800' :
                  item.jenis === 'sisa_stock' ? 'bg-green-100 text-green-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                  {item.jenis === 'pembelian' ? 'Pembelian' : item.jenis === 'sisa_stock' ? 'Sisa Stock' : 'Pemakaian'}
                </span>
              </td>
              <td className="border border-gray-400 px-2 py-1 text-right font-medium">{item.volume.toLocaleString('id-ID')}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{item.hargaPembelian ? formatCurrency(item.hargaPembelian) : '-'}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{item.totalHarga ? formatCurrency(item.totalHarga) : '-'}</td>
              <td className="border border-gray-400 px-2 py-1">{item.noLambung || '-'}</td>
              <td className="border border-gray-400 px-2 py-1">{item.namaAlat || '-'}</td>
              <td className="border border-gray-400 px-2 py-1">{item.lokasiProyek || '-'}</td>
              <td className="border border-gray-400 px-2 py-1">{item.keterangan || '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-bold">
            <td colSpan={3} className="border border-gray-400 px-2 py-1.5 text-center font-bold">
              Total Sisa Stok (Pembelian + Sisa Stock - Pemakaian)
            </td>
            <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-blue-900">
              {totalStokAkhir.toLocaleString('id-ID')}
            </td>
            <td colSpan={6} className="border border-gray-400 px-2 py-1.5"></td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-400 rounded flex justify-between items-center text-xs" style={{ width: '100%' }}>
        <div><strong>Ringkasan:</strong></div>
        <div>Pembelian: <strong>{totalPembelian.toLocaleString('id-ID')} L</strong></div>
        <div>Sisa Stock: <strong>{totalSisaStock.toLocaleString('id-ID')} L</strong></div>
        <div>Pemakaian: <strong>{totalPemakaian.toLocaleString('id-ID')} L</strong></div>
        <div className="text-blue-900">Total Sisa Stok: <strong>{totalStokAkhir.toLocaleString('id-ID')} L</strong></div>
      </div>
    </div>
  );
};

export default PrintableOilStock;
