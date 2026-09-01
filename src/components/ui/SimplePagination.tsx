import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 500, 1000];

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 25,
  onPageSizeChange,
  totalItems,
}: SimplePaginationProps) {
  // Build page numbers to show (max 5 visible pages)
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className="flex flex-wrap items-center justify-between mt-4 px-1 gap-2">
      {/* Kiri: info & selector rows per page */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {totalItems && startItem && endItem
            ? `${startItem}–${endItem} dari ${totalItems} data`
            : `Halaman ${currentPage} dari ${totalPages}`}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Tampil:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: navigasi halaman */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'hover:bg-accent'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Helper: paginate an array. Returns the slice for the given page. */
export function paginateData<T>(data: T[], currentPage: number, pageSize: number = 10): T[] {
  const start = (currentPage - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

/** Helper: get total pages */
export function getTotalPages(totalItems: number, pageSize: number = 10): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
