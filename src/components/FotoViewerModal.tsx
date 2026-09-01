import React, { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseFotoList, SLOT_LABELS } from '@/utils/fotoUtils';

interface FotoViewerModalProps {
  src: string | string[];
  alt: string;
  initialIndex?: number;
  onClose: () => void;
}

/**
 * FotoViewerModal — Lightbox Carousel Galeri Multi-Foto (Mendukung hingga 5 Foto per Alat)
 */
const FotoViewerModal: React.FC<FotoViewerModalProps> = ({ src, alt, initialIndex = 0, onClose }) => {
  const fotoList = parseFotoList(src);
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < fotoList.length ? initialIndex : 0
  );

  const currentSrc = fotoList[currentIndex] || '';

  // Navigasi keyboard (Panah Kiri, Panah Kanan, Esc)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fotoList.length, currentIndex, onClose]);

  const handlePrev = () => {
    if (fotoList.length <= 1) return;
    setCurrentIndex(prev => (prev === 0 ? fotoList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (fotoList.length <= 1) return;
    setCurrentIndex(prev => (prev === fotoList.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    if (!currentSrc) return;
    const a = document.createElement('a');
    a.href = currentSrc;
    a.download = `${alt.replace(/\s+/g, '_')}_foto_${currentIndex + 1}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  if (fotoList.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div className="relative flex flex-col items-center max-w-4xl max-h-[95vh] w-full mx-4">
        {/* Toolbar Header */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold truncate max-w-xs sm:max-w-md" title={alt}>
              {alt}
            </span>
            {fotoList.length > 1 && (
              <span className="text-xs bg-blue-600/80 text-white font-medium px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {fotoList.length} — {SLOT_LABELS[currentIndex] || `Foto ${currentIndex + 1}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Download foto ini"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition"
              title="Tutup (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Area Gambar Utama dengan Panah Navigasi */}
        <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl min-h-[300px] max-h-[72vh]">
          {/* Tombol Kiri */}
          {fotoList.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-blue-600 text-white rounded-full p-2.5 shadow-xl transition-all backdrop-blur-sm cursor-pointer"
              title="Foto Sebelumnya (Panah Kiri)"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Gambar */}
          <img
            key={currentSrc}
            src={currentSrc}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain"
            style={{ display: 'block' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-size='16' text-anchor='middle' dominant-baseline='middle'%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E`;
            }}
          />

          {/* Tombol Kanan */}
          {fotoList.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-blue-600 text-white rounded-full p-2.5 shadow-xl transition-all backdrop-blur-sm cursor-pointer"
              title="Foto Selanjutnya (Panah Kanan)"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnail Selector Bar jika foto lebih dari 1 */}
        {fotoList.length > 1 && (
          <div className="flex items-center gap-2 mt-3 px-2 overflow-x-auto max-w-full py-1">
            {fotoList.map((f, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`relative h-12 w-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  i === currentIndex
                    ? 'border-blue-500 scale-105 ring-2 ring-blue-400 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
                title={SLOT_LABELS[i] || `Foto ${i + 1}`}
              >
                <img src={f} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 font-bold rounded-tl">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-white/40 text-[11px] mt-2">Gunakan panah keyboard atau klik panah untuk melihat foto lainnya • Esc untuk keluar</p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default FotoViewerModal;
