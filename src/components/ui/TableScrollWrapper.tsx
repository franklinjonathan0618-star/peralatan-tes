import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TableScrollWrapper
 *
 * Membungkus tabel dengan:
 * 1. Scrollbar horizontal ATAS (mirror) — tersinkronisasi 2 arah secara instan (0-lag)
 * 2. Sticky header tabel — header tetap di atas saat data di-scroll secara vertikal
 * 3. Batas tinggi maksimum (maxHeight) sehingga data tabel scroll di dalam kontainer
 */

interface TableScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

const TableScrollWrapper = React.forwardRef<HTMLDivElement, TableScrollWrapperProps>(
  ({ children, className, maxHeight = "max-h-[calc(100vh-260px)] min-h-[300px]" }, ref) => {
    const topScrollRef = React.useRef<HTMLDivElement>(null);
    const tableWrapRef = React.useRef<HTMLDivElement>(null);
    const phantomRef = React.useRef<HTMLDivElement>(null);

    // Sinkronisasi instan tanpa dropped frame atau delay:
    // Update scrollLeft secara langsung hanya jika nilainya belum sama.
    // Saat event scroll balasan terpicu, nilainya sudah sama sehingga loop berhenti seketika.
    const handleTopScroll = () => {
      const topEl = topScrollRef.current;
      const tableEl = tableWrapRef.current;
      if (topEl && tableEl && tableEl.scrollLeft !== topEl.scrollLeft) {
        tableEl.scrollLeft = topEl.scrollLeft;
      }
    };

    const handleTableScroll = () => {
      const topEl = topScrollRef.current;
      const tableEl = tableWrapRef.current;
      if (topEl && tableEl && topEl.scrollLeft !== tableEl.scrollLeft) {
        topEl.scrollLeft = tableEl.scrollLeft;
      }
    };

    // Hitung lebar phantom div secara presisi saat tabel berubah ukuran
    React.useEffect(() => {
      let lastWidth = 0;

      const updatePhantomWidth = () => {
        if (!tableWrapRef.current || !phantomRef.current) return;
        const tableEl = tableWrapRef.current.querySelector("table");
        if (tableEl) {
          const contentWidth = Math.max(tableEl.scrollWidth, tableWrapRef.current.scrollWidth);
          if (contentWidth !== lastWidth) {
            lastWidth = contentWidth;
            phantomRef.current.style.width = `${contentWidth}px`;
          }
        }
      };

      updatePhantomWidth();

      const resizeObserver = new ResizeObserver(updatePhantomWidth);
      if (tableWrapRef.current) {
        resizeObserver.observe(tableWrapRef.current);
        const tableEl = tableWrapRef.current.querySelector("table");
        if (tableEl) resizeObserver.observe(tableEl);
      }

      return () => resizeObserver.disconnect();
    }, [children]);

    return (
      <div
        ref={ref}
        className={cn("flex flex-col w-full border rounded-md bg-background shadow-sm overflow-hidden", className)}
      >
        {/* ── 1. Scrollbar Cermin di Atas Header ── */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="w-full overflow-x-scroll overflow-y-hidden border-b border-slate-200 bg-slate-100/90 top-mirror-scrollbar flex-shrink-0"
          style={{ height: "14px", minHeight: "14px", willChange: "scroll-position" }}
          title="Geser scrollbar ini untuk menggeser tabel ke samping"
        >
          <div ref={phantomRef} style={{ height: "1px", minWidth: "100%" }} />
        </div>

        {/* ── 2. Container Utama Tabel (Sticky Header & Vertical Scroll) ── */}
        <div
          ref={tableWrapRef}
          onScroll={handleTableScroll}
          className={cn("overflow-auto relative w-full", maxHeight)}
          style={{ willChange: "scroll-position" }}
        >
          {children}
        </div>
      </div>
    );
  }
);

TableScrollWrapper.displayName = "TableScrollWrapper";

export { TableScrollWrapper };
