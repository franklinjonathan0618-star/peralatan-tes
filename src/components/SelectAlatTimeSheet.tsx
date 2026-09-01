import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { useAlatPendukung } from '@/hooks/useAlatPendukung';
import { useSewaAlatEksternal } from '@/hooks/useSewaAlatEksternal';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlatItem {
  id: string;
  noLambung: string;
  namaAlat: string;
  tipe: 'berat' | 'pendukung' | 'sewa';
  vendor?: string;
}

interface SelectAlatTimeSheetProps {
  id?: string;
  value: string;
  onChange: (noLambung: string) => void;
  onAlatSelected?: (alat: AlatItem | undefined) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SelectAlatTimeSheet({ id, value, onChange, onAlatSelected, disabled }: SelectAlatTimeSheetProps) {
  const { data: alatBeratList, isLoading: isLoadingBerat } = useAlatBerat();
  const { data: alatPendukungList, isLoading: isLoadingPendukung } = useAlatPendukung();
  const { data: sewaAlatList, isLoading: isLoadingSewa } = useSewaAlatEksternal();

  const isLoading = isLoadingBerat || isLoadingPendukung || isLoadingSewa;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Combine all alat types
  const sortedList = useMemo(() => {
    const combined: AlatItem[] = [];

    alatBeratList?.forEach((alat) => {
      combined.push({
        id: alat.id,
        noLambung: alat.no_lambung || '',
        namaAlat: alat.nama_alat || '',
        tipe: 'berat',
      });
    });

    alatPendukungList?.forEach((alat) => {
      combined.push({
        id: alat.id,
        noLambung: alat.noLambung || '',
        namaAlat: alat.namaAlat || '',
        tipe: 'pendukung',
      });
    });

    sewaAlatList?.forEach((alat: any) => {
      combined.push({
        id: alat.id || '',
        noLambung: alat.nama_alat || '',
        namaAlat: alat.nama_alat || '',
        tipe: 'sewa',
        vendor: alat.vendor || '',
      });
    });

    return combined.sort((a, b) => a.noLambung.localeCompare(b.noLambung));
  }, [alatBeratList, alatPendukungList, sewaAlatList]);

  // Currently selected alat object
  const selectedAlat = useMemo(
    () => sortedList.find((a) => a.noLambung === value),
    [sortedList, value]
  );

  // Filter list based on search query
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedList;
    return sortedList.filter(
      (a) =>
        a.noLambung.toLowerCase().includes(q) ||
        a.namaAlat.toLowerCase().includes(q) ||
        (a.vendor || '').toLowerCase().includes(q)
    );
  }, [sortedList, searchQuery]);

  // Group filtered list
  const groups = useMemo(() => ({
    berat: filteredList.filter((a) => a.tipe === 'berat'),
    pendukung: filteredList.filter((a) => a.tipe === 'pendukung'),
    sewa: filteredList.filter((a) => a.tipe === 'sewa'),
  }), [filteredList]);

  const handleSelect = (alat: AlatItem) => {
    onChange(alat.noLambung);
    if (onAlatSelected) onAlatSelected(alat);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onAlatSelected) onAlatSelected(undefined);
    setSearchQuery('');
  };

  // Calculate whether to open upward or downward
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 400; // approximate max dropdown height
    setOpenUpward(spaceBelow < dropdownHeight && rect.top > spaceBelow);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens & calculate position
  useEffect(() => {
    if (open) {
      calculatePosition();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, calculatePosition]);

  const displayLabel = selectedAlat
    ? `${selectedAlat.noLambung} - ${selectedAlat.namaAlat}`
    : isLoading
    ? 'Memuat data...'
    : 'Pilih Alat';

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring ring-offset-2',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onMouseDown={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
              className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Hapus pilihan"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 w-full rounded-md border border-input bg-popover shadow-lg animate-in fade-in-0 zoom-in-95",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {/* Search input */}
          <div className="flex items-center border-b border-input px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari nama alat atau no lambung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-80 overflow-y-auto py-1">
            {filteredList.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada alat ditemukan
              </div>
            ) : (
              <>
                {groups.berat.length > 0 && (
                  <OptionGroup label="Alat Berat" items={groups.berat} value={value} onSelect={handleSelect} />
                )}
                {groups.pendukung.length > 0 && (
                  <OptionGroup label="Alat Pendukung" items={groups.pendukung} value={value} onSelect={handleSelect} />
                )}
                {groups.sewa.length > 0 && (
                  <OptionGroup label="Sewa Alat Eksternal" items={groups.sewa} value={value} onSelect={handleSelect} isSewa />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for a group of options
function OptionGroup({
  label,
  items,
  value,
  onSelect,
  isSewa = false,
}: {
  label: string;
  items: AlatItem[];
  value: string;
  onSelect: (alat: AlatItem) => void;
  isSewa?: boolean;
}) {
  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40 sticky top-0">
        {label}
      </div>
      {items.map((alat) => {
        const isSelected = alat.noLambung === value;
        return (
          <button
            key={`${alat.tipe}-${alat.id}`}
            type="button"
            onClick={() => onSelect(alat)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors',
              isSelected && 'bg-accent/60 font-medium'
            )}
          >
            <Check className={cn('h-4 w-4 shrink-0 text-primary', isSelected ? 'opacity-100' : 'opacity-0')} />
            <span className="flex-1 truncate">
              {isSewa ? (
                <>
                  <span className="font-medium">{alat.namaAlat}</span>
                  {alat.vendor && <span className="ml-1 text-muted-foreground text-xs">({alat.vendor})</span>}
                </>
              ) : (
                <>
                  <span className="font-mono text-xs text-muted-foreground mr-1.5">{alat.noLambung}</span>
                  <span className="font-medium">{alat.namaAlat}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
