import { useMemo } from 'react';
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { useAlatPendukung } from '@/hooks/useAlatPendukung';
import { useSewaAlatEksternal } from '@/hooks/useSewaAlatEksternal';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AlatItem {
  id: string;
  noLambung: string;
  namaAlat: string;
  tipe: 'berat' | 'pendukung' | 'sewa';
  vendor?: string;
}

interface SelectAlatPerbaikanProps {
  id?: string;
  value: string;
  onChange: (noLambung: string) => void;
  onAlatSelected?: (alat: AlatItem | undefined) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SelectAlatPerbaikan({ id, value, onChange, onAlatSelected, required, disabled }: SelectAlatPerbaikanProps) {
  const { data: alatBeratList, isLoading: isLoadingBerat } = useAlatBerat();
  const { data: alatPendukungList, isLoading: isLoadingPendukung } = useAlatPendukung();
  const { data: sewaAlatList, isLoading: isLoadingSewa } = useSewaAlatEksternal();

  const isLoading = isLoadingBerat || isLoadingPendukung || isLoadingSewa;

  // Combine and filter all alat types
  const sortedList = useMemo(() => {
    const combined: AlatItem[] = [];

    // Filter Alat Berat with kondisi rusak or maintenance
    alatBeratList?.forEach((alat) => {
      combined.push({
        id: alat.id,
        noLambung: alat.no_lambung || '',
        namaAlat: alat.nama_alat || '',
        tipe: 'berat',
      });
    });

    // Filter Alat Pendukung with kondisi rusak or maintenance
    alatPendukungList?.forEach((alat) => {
      combined.push({
        id: alat.id,
        noLambung: alat.noLambung || '',
        namaAlat: alat.namaAlat || '',
        tipe: 'pendukung',
      });
    });

    // Sewa Alat Eksternal (include all since they don't have kondisi field)
    sewaAlatList?.forEach((alat: any) => {
      combined.push({
        id: alat.id || '',
        noLambung: alat.nama_alat || '', // Use nama_alat as noLambung for sewa
        namaAlat: alat.nama_alat || '',
        tipe: 'sewa',
        vendor: alat.vendor || '',
      });
    });

    // Sort by noLambung
    return combined.sort((a, b) => a.noLambung.localeCompare(b.noLambung));
  }, [alatBeratList, alatPendukungList, sewaAlatList]);

  const handleValueChange = (val: string) => {
    onChange(val);
    if (onAlatSelected) {
      const selectedAlat = sortedList.find(a => a.noLambung === val);
      onAlatSelected(selectedAlat);
    }
  };

  // Group by tipe
  const alatBeratItems = sortedList.filter(a => a.tipe === 'berat');
  const alatPendukungItems = sortedList.filter(a => a.tipe === 'pendukung');
  const sewaAlatItems = sortedList.filter(a => a.tipe === 'sewa');

  return (
    <Select 
      value={value} 
      onValueChange={handleValueChange} 
      required={required} 
      disabled={disabled || isLoading}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={isLoading ? "Memuat data..." : "Pilih Alat"} />
      </SelectTrigger>
      <SelectContent>
        {alatBeratItems.length > 0 && (
          <SelectGroup>
            <SelectLabel>Alat Berat</SelectLabel>
            {alatBeratItems.map((alat) => (
              <SelectItem key={`${alat.tipe}-${alat.id}`} value={alat.noLambung}>
                {alat.noLambung} - {alat.namaAlat}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {alatPendukungItems.length > 0 && (
          <SelectGroup>
            <SelectLabel>Alat Pendukung</SelectLabel>
            {alatPendukungItems.map((alat) => (
              <SelectItem key={`${alat.tipe}-${alat.id}`} value={alat.noLambung}>
                {alat.noLambung} - {alat.namaAlat}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {sewaAlatItems.length > 0 && (
          <SelectGroup>
            <SelectLabel>Sewa Alat Eksternal</SelectLabel>
            {sewaAlatItems.map((alat) => (
              <SelectItem key={`${alat.tipe}-${alat.id}`} value={alat.noLambung}>
                {alat.namaAlat} ({alat.vendor})
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {sortedList.length === 0 && !isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            Tidak ada alat dengan kondisi rusak atau maintenance
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
