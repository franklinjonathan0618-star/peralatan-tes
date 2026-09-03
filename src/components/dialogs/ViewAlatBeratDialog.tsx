import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { AlatBerat } from "@/types";
import { formatDateDisplay } from "@/utils/dateUtils";
import FotoViewerModal from "@/components/FotoViewerModal";
import { parseFotoList, SLOT_LABELS } from "@/utils/fotoUtils";
import { FisikAlatHelpTooltip } from "@/components/FisikAlatHelpTooltip";

interface ViewAlatBeratDialogProps {
  alatBerat: AlatBerat;
}

export function ViewAlatBeratDialog({ alatBerat }: ViewAlatBeratDialogProps) {
  const [viewerState, setViewerState] = useState<{ src: string[]; index: number } | null>(null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Lihat detail"
          aria-label="Lihat detail alat berat"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="view-dialog-title">Detail Alat Berat</DialogTitle>
          <DialogDescription id="view-dialog-description">
            Informasi lengkap mengenai alat berat{" "}
            {alatBerat.nama_alat || (alatBerat as any).namaAlat}
          </DialogDescription>
        </DialogHeader>
        <div
          role="document"
          aria-labelledby="view-dialog-title"
          aria-describedby="view-dialog-description"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  No. Lambung
                </label>
                <p className="text-sm">
                  {alatBerat.no_lambung || (alatBerat as any).noLambung || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nama Alat
                </label>
                <p className="text-sm">
                  {alatBerat.nama_alat || (alatBerat as any).namaAlat || "-"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Merk
                </label>
                <p className="text-sm">{alatBerat.merk || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tipe
                </label>
                <p className="text-sm">{alatBerat.tipe || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tahun Perolehan
                </label>
                <p className="text-sm">
                  {alatBerat.tahun_perolehan ||
                    (alatBerat as any).tahunPembuatan ||
                    "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Kondisi
                </label>
                <p className="text-sm">{alatBerat.kondisi || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <label className="text-sm font-medium text-gray-500">
                    Fisik Alat (%)
                  </label>
                  <FisikAlatHelpTooltip iconClassName="h-3.5 w-3.5" />
                </div>
                <p className="text-sm">{alatBerat.fisik_alat !== undefined ? `${alatBerat.fisik_alat}%` : "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Lokasi
                </label>
                <p className="text-sm">{alatBerat.lokasi || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Lokasi Sebelumnya
                </label>
                <p className="text-sm">{alatBerat.lokasi_sebelumnya || (alatBerat as any).lokasiSebelumnya || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <p className="text-sm">{alatBerat.status || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  No. Seri
                </label>
                <p className="text-sm">{alatBerat.noSeri || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Service Terakhir
                </label>
                <p className="text-sm">
                  {alatBerat.serviceTerakhir
                    ? formatDateDisplay(alatBerat.serviceTerakhir)
                    : "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Service Berikutnya
                </label>
                <p className="text-sm">
                  {alatBerat.serviceBerikutnya
                    ? formatDateDisplay(alatBerat.serviceBerikutnya)
                    : "-"}
                </p>
              </div>
            </div>

            {/* Display Foto Alat (Multi-Foto Galeri) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-semibold text-gray-700">Foto Alat</label>
              {(() => {
                const fotos = parseFotoList(alatBerat.foto);
                if (fotos.length === 0) {
                  return <p className="text-sm text-gray-400 italic">Belum ada foto yang diunggah</p>;
                }
                return (
                  <>
                    <div className="grid grid-cols-5 gap-2">
                      {fotos.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setViewerState({ src: fotos, index: idx })}
                          className="group relative h-16 rounded-md overflow-hidden border border-slate-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer bg-slate-50"
                          title={`Lihat Foto ${idx + 1}: ${SLOT_LABELS[idx] || ''}`}
                        >
                          <img src={src} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 font-bold rounded-tl">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                    {viewerState && (
                      <FotoViewerModal
                        src={viewerState.src}
                        alt={alatBerat.nama_alat || (alatBerat as any).namaAlat || 'Foto Alat'}
                        initialIndex={viewerState.index}
                        onClose={() => setViewerState(null)}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
