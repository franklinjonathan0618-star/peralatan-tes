import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { AlatPendukung } from '@/types';
import FotoViewerModal from '@/components/FotoViewerModal';
import { parseFotoList, SLOT_LABELS } from '@/utils/fotoUtils';

interface ViewAlatPendukungDialogProps {
  alatPendukung: AlatPendukung;
}

export function ViewAlatPendukungDialog({ alatPendukung }: ViewAlatPendukungDialogProps) {
  const [viewerState, setViewerState] = useState<{ src: string[]; index: number } | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Lihat detail">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="view-alat-pendukung-title">Detail Alat Pendukung</DialogTitle>
          <DialogDescription id="view-alat-pendukung-description">
            Informasi lengkap mengenai alat pendukung {alatPendukung.namaAlat}
          </DialogDescription>
        </DialogHeader>
        <div role="document" aria-labelledby="view-alat-pendukung-title" aria-describedby="view-alat-pendukung-description">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Alat</label>
                <p className="text-sm font-semibold">{alatPendukung.namaAlat}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Jenis Alat</label>
                <p className="text-sm">{alatPendukung.jenisAlat || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Kondisi</label>
                <p className="text-sm">{alatPendukung.kondisi || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Lokasi</label>
                <p className="text-sm">{alatPendukung.lokasi || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Lokasi Sebelumnya</label>
                <p className="text-sm">{alatPendukung.lokasiSebelumnya || (alatPendukung as any).lokasi_sebelumnya || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">No. Lambung</label>
                <p className="text-sm font-mono">{alatPendukung.noLambung || '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Keterangan</label>
              <p className="text-sm">{alatPendukung.keterangan || '-'}</p>
            </div>

            {/* Display Foto Alat (Multi-Foto Galeri 5 Slot) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-semibold text-gray-700">Foto Alat</label>
              {(() => {
                const fotos = parseFotoList(alatPendukung.foto || alatPendukung.gambar);
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
                        alt={alatPendukung.namaAlat}
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
