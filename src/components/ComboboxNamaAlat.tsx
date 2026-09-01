import { useState, useRef, useEffect, useMemo } from 'react';
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { useAlatPendukung } from '@/hooks/useAlatPendukung';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxNamaAlatProps {
  value: string;
  onChange: (namaAlat: string, noLambung?: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface AlatOption {
  id: string;
  namaAlat: string;
  noLambung?: string;
  kategori: 'Alat Berat' | 'Alat Pendukung';
}

/**
 * Combobox for Nama Alat:
 * - Menggabungkan Alat Berat + Alat Pendukung
 * - Pencarian berdasarkan nama alat ATAU no. lambung
 * - Nilai yang disimpan adalah nama_alat; teks bebas juga diperbolehkan
 */
export function ComboboxNamaAlat({
  value,
  onChange,
  placeholder = 'Ketik nama / no. lambung...',
  required,
}: ComboboxNamaAlatProps) {
  const { data: alatBeratList = [], isLoading: loadingBerat } = useAlatBerat();
  const { data: alatPendukungList = [], isLoading: loadingPendukung } = useAlatPendukung();

  const isLoading = loadingBerat || loadingPendukung;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build merged options list — hanya alat kondisi Baik dan status aktif
  const options = useMemo<AlatOption[]>(() => {
    const isLayak = (kondisi?: string | null, status?: string | null) =>
      (!kondisi || kondisi.toLowerCase() === 'baik') &&
      (!status || status.toLowerCase() === 'standby');

    const berat: AlatOption[] = alatBeratList
      .filter((a) => a.nama_alat && isLayak((a as any).kondisi, a.status))
      .map((a) => ({
        id: String(a.id),
        namaAlat: a.nama_alat!,
        noLambung: a.no_lambung || undefined,
        kategori: 'Alat Berat',
      }));

    const pendukung: AlatOption[] = alatPendukungList
      .filter((a) => a.namaAlat && isLayak((a as any).kondisi, a.status))
      .map((a) => ({
        id: String(a.id),
        namaAlat: a.namaAlat!,
        noLambung: a.noLambung || undefined,
        kategori: 'Alat Pendukung',
      }));

    return [...berat, ...pendukung].sort((a, b) =>
      a.namaAlat.localeCompare(b.namaAlat)
    );
  }, [alatBeratList, alatPendukungList]);

  // Filter by query: matches nama OR no lambung
  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.namaAlat.toLowerCase().includes(q) ||
        (o.noLambung && o.noLambung.toLowerCase().includes(q))
    );
  }, [options, inputValue]);

  // Group for display
  const grouped = useMemo(() => {
    const map: Partial<Record<string, AlatOption[]>> = {};
    for (const opt of filtered) {
      if (!map[opt.kategori]) map[opt.kategori] = [];
      map[opt.kategori]!.push(opt);
    }
    return map;
  }, [filtered]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v); // free text allowed, no lambung
    setOpen(true);
  };

  const handleSelect = (opt: AlatOption) => {
    setInputValue(opt.namaAlat);
    onChange(opt.namaAlat, opt.noLambung);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm pr-14 transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={isLoading ? 'Memuat data...' : placeholder}
          required={required}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
            className="p-1 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([kategori, items]) => (
            <div key={kategori}>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0 border-b">
                {kategori}
              </div>
              {items!.map((opt) => (
                <button
                  key={`${opt.kategori}-${opt.id}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b last:border-b-0 ${
                    opt.namaAlat === inputValue ? 'bg-blue-50 font-medium text-blue-700' : ''
                  }`}
                >
                  <span>{opt.namaAlat}</span>
                  {opt.noLambung && (
                    <span className="ml-2 text-xs text-gray-400">({opt.noLambung})</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
