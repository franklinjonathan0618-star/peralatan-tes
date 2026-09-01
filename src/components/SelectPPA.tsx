import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePPA, PPAItem } from "@/hooks/usePPA";

interface SelectPPAProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  onPPASelected?: (ppa: PPAItem | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SelectPPA: React.FC<SelectPPAProps> = ({
  value,
  onChange,
  onPPASelected,
  placeholder = "Pilih No. PPA (opsional)",
  required = false,
  disabled = false,
}) => {
  const { data: ppaList, isLoading } = usePPA();

  // Hanya tampilkan PPA yang sudah disetujui
  const approvedPPA = (ppaList ?? []).filter((ppa) => ppa.status === "approved");

  const handleChange = (val: string) => {
    // Nilai khusus untuk "tidak ada PPA"
    if (val === "__none__") {
      onChange(null);
      onPPASelected?.(null);
    } else {
      onChange(val);
      const selected = approvedPPA.find((ppa) => ppa.no_ppa === val) ?? null;
      onPPASelected?.(selected);
    }
  };

  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Memuat data PPA..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!required && (
          <SelectItem value="__none__">
            — Tidak ada PPA —
          </SelectItem>
        )}
        {approvedPPA.length === 0 && !isLoading ? (
          <SelectItem value="__empty__" disabled>
            Tidak ada PPA yang disetujui
          </SelectItem>
        ) : (
          approvedPPA.map((ppa) => (
            <SelectItem key={ppa.id} value={ppa.no_ppa}>
              {ppa.no_ppa} — {ppa.nama_alat}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SelectPPA;
