import React from "react";
import { AlatBerat } from "@/types";
import { formatDateDisplay } from "@/utils/dateUtils";

interface PrintableAlatBeratProps {
  data: AlatBerat[];
  title: string;
}

export const PrintableAlatBerat: React.FC<PrintableAlatBeratProps> = ({
  data,
  title,
}) => {
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">LAPORAN {title.toUpperCase()}</h1>
        <p className="text-sm text-gray-600">Dicetak pada: {printDate}</p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">No. Lambung</th>
            <th className="border p-2 text-left">Nama Alat</th>
            <th className="border p-2 text-left">Merk</th>
            <th className="border p-2 text-left">S/N</th>
            <th className="border p-2 text-left">Tipe</th>
            <th className="border p-2 text-left">Tahun</th>
            <th className="border p-2 text-left">Kondisi</th>
            <th className="border p-2 text-left">Lokasi</th>
            <th className="border p-2 text-left">Lokasi Sebelumnya</th>
            <th className="border p-2 text-left">Operator</th>
            <th className="border p-2 text-left">Service Terakhir</th>
            <th className="border p-2 text-left">Service Berikutnya</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="border p-2">{item.no_lambung || (item as any).noLambung || "-"}</td>
              <td className="border p-2">{item.nama_alat || (item as any).namaAlat || "-"}</td>
              <td className="border p-2">{item.merk || "-"}</td>
              <td className="border p-2">{item.noSeri || "-"}</td>
              <td className="border p-2">{item.tipe || "-"}</td>
              <td className="border p-2">{item.tahun_perolehan || (item as any).tahunPembuatan || "-"}</td>
              <td className="border p-2">{item.kondisi || "-"}</td>
              <td className="border p-2">{item.lokasi || "-"}</td>
              <td className="border p-2">{item.lokasi_sebelumnya || (item as any).lokasiSebelumnya || "-"}</td>
              <td className="border p-2">{(item as any).operator || "-"}</td>
              <td className="border p-2">
                {item.serviceTerakhir
                  ? formatDateDisplay(item.serviceTerakhir)
                  : "-"}
              </td>
              <td className="border p-2">
                {item.serviceBerikutnya
                  ? formatDateDisplay(item.serviceBerikutnya)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        }`,
        }}
      />
    </div>
  );
};
