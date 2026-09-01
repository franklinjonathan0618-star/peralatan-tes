import React from 'react';
import type { AlatPendukung } from '@/types';

interface PrintableAlatPendukungProps {
  data: AlatPendukung[];
  title: string;
}

const PrintableAlatPendukung: React.FC<PrintableAlatPendukungProps> = ({ data, title }) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="print-container p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">LAPORAN {title.toUpperCase()}</h1>
        <p className="text-sm text-gray-600">Dicetak pada: {printDate}</p>
      </div>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">No. Lambung</th>
            <th className="border p-2 text-left">Nama Alat</th>
            <th className="border p-2 text-left">Jenis</th>
            <th className="border p-2 text-left">Tahun</th>
            <th className="border p-2 text-left">Kondisi</th>
            <th className="border p-2 text-left">Lokasi</th>
            <th className="border p-2 text-left">Lokasi Sebelumnya</th>
            <th className="border p-2 text-left">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border p-2">{item.noLambung || '-'}</td>
              <td className="border p-2">{item.namaAlat}</td>
              <td className="border p-2">{item.jenisAlat || '-'}</td>
              <td className="border p-2">{item.tahunPerolehan || '-'}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.kondisi === 'Baik' ? 'bg-green-100 text-green-800' :
                  item.kondisi === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.kondisi}
                </span>
              </td>
              <td className="border p-2">{item.lokasi || '-'}</td>
              <td className="border p-2">{item.lokasiSebelumnya || item.lokasi_sebelumnya || '-'}</td>
              <td className="border p-2">{item.keterangan || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableAlatPendukung;
