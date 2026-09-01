import { useMemo } from 'react';
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { AlatBerat } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectAlatBeratProps {
  id?: string;
  value: string;
  onChange: (noLambung: string) => void;
  onAlatSelected?: (alat: AlatBerat | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  filterKondisi?: string[];
  filterStatus?: string[];
}

export function SelectAlatBerat({ id, value, onChange, onAlatSelected, required, disabled, filterKondisi, filterStatus }: SelectAlatBeratProps) {
  const { data: alatBeratList, isLoading } = useAlatBerat();

  // Filter and sort list by no_lambung
  const sortedList = useMemo(() => {
    let filtered = [...alatBeratList];
    
    // Filter by kondisi OR status if provided
    if (filterKondisi && filterKondisi.length > 0 || filterStatus && filterStatus.length > 0) {
      filtered = filtered.filter(alat => {
        const matchesKondisi = filterKondisi && filterKondisi.length > 0 && alat.kondisi && filterKondisi.includes(alat.kondisi.toLowerCase());
        const matchesStatus = filterStatus && filterStatus.length > 0 && alat.status && filterStatus.includes(alat.status);
        return matchesKondisi || matchesStatus;
      });
    }
    
    return filtered.sort((a, b) => 
      (a.no_lambung || '').localeCompare(b.no_lambung || '')
    );
  }, [alatBeratList, filterKondisi, filterStatus]);

  const handleValueChange = (val: string) => {
    onChange(val);
    if (onAlatSelected) {
      const selectedAlat = alatBeratList.find(a => a.no_lambung === val);
      onAlatSelected(selectedAlat);
    }
  };

  return (
    <Select 
      value={value} 
      onValueChange={handleValueChange} 
      required={required} 
      disabled={disabled || isLoading}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={isLoading ? "Memuat data..." : "Pilih No. Lambung"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Daftar Alat Berat</SelectLabel>
          {sortedList.map((alat) => (
            <SelectItem key={alat.id} value={alat.no_lambung || 'unknown'}>
              {alat.no_lambung} {alat.nama_alat ? `- ${alat.nama_alat}` : ''}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
