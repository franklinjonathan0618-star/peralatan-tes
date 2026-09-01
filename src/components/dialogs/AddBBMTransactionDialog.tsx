import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import type { BBMData } from '@/types';
import { DatePicker } from "@/components/ui/date-picker";

interface AddBBMTransactionDialogProps {
  onSubmit: (data: Omit<BBMData, 'id'>) => Promise<void> | void;
}

export function AddBBMTransactionDialog({ onSubmit }: AddBBMTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'pembelian' | 'pemakaian'>('pembelian');
  const [formData, setFormData] = useState<Omit<BBMData, 'id'> & { volume: string }>({
    tanggalPembelian: new Date(),
    volumePembelian: 0,
    hargaPerLiter: 0,
    tanggalPemakaian: null,
    volumePemakaian: 0,
    keteranganPemakaian: '',
    namaAlatBerat: '',
    lokasiProyek: '',
    volume: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const volume = Number(formData.volume);
    if (isNaN(volume) || volume <= 0) {
      alert('Volume harus berupa angka lebih dari 0');
      return;
    }

    if (transactionType === 'pemakaian') {
      if (!formData.namaAlatBerat.trim()) {
        alert('Nama Alat Berat harus diisi untuk transaksi pemakaian');
        return;
      }
      if (!formData.keteranganPemakaian.trim()) {
        alert('Keterangan harus diisi untuk transaksi pemakaian');
        return;
      }
    } else {
      if (Number(formData.hargaPerLiter) <= 0) {
        alert('Harga per liter harus lebih dari 0');
        return;
      }
    }

    const submissionData: Omit<BBMData, 'id'> = transactionType === 'pembelian'
      ? {
          tanggalPembelian: formData.tanggalPembelian,
          volumePembelian: volume,
          hargaPerLiter: Number(formData.hargaPerLiter),
          tanggalPemakaian: null,
          volumePemakaian: 0,
          keteranganPemakaian: '',
          namaAlatBerat: '',
          lokasiProyek: formData.lokasiProyek?.trim(),
        }
      : {
          tanggalPembelian: new Date(),
          volumePembelian: 0,
          hargaPerLiter: 0,
          tanggalPemakaian: formData.tanggalPemakaian || new Date(),
          volumePemakaian: volume,
          keteranganPemakaian: formData.keteranganPemakaian.trim(),
          namaAlatBerat: formData.namaAlatBerat.trim(),
          lokasiProyek: formData.lokasiProyek?.trim(),
        };

    setIsLoading(true);
    try {
      await onSubmit(submissionData);
      setOpen(false);

      // Reset form
      setFormData({
        tanggalPembelian: new Date(),
        volumePembelian: 0,
        hargaPerLiter: 0,
        tanggalPemakaian: null,
        volumePemakaian: 0,
        keteranganPemakaian: '',
        namaAlatBerat: '',
        lokasiProyek: '',
        volume: '',
      });
      setTransactionType('pembelian');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Transaksi BBM
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Transaksi BBM</DialogTitle>
            <DialogDescription>
              Form untuk menambahkan transaksi pembelian atau pemakaian BBM
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Jenis Transaksi</Label>
              <Select
                value={transactionType}
                onValueChange={(value: 'pembelian' | 'pemakaian') => {
                  setTransactionType(value);
                  setFormData({
                    ...formData,
                    volumePembelian: 0,
                    hargaPerLiter: 0,
                    volumePemakaian: 0,
                    keteranganPemakaian: '',
                    namaAlatBerat: '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pembelian">Pembelian BBM</SelectItem>
                  <SelectItem value="pemakaian">Pemakaian BBM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lokasiProyek">Lokasi Proyek (Opsional)</Label>
              <Input
                id="lokasiProyek"
                value={formData.lokasiProyek || ''}
                onChange={(e) =>
                  setFormData({ ...formData, lokasiProyek: e.target.value })
                }
                placeholder="Contoh: Proyek A, Site B, Kantor Pusat"
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{transactionType === 'pembelian' ? 'Tanggal Pembelian' : 'Tanggal Pemakaian'}</Label>
                <DatePicker
                  date={transactionType === 'pembelian' ? formData.tanggalPembelian : (formData.tanggalPemakaian || new Date())}
                  setDate={(date) => {
                    if (transactionType === 'pembelian') {
                      setFormData({ ...formData, tanggalPembelian: date || new Date() });
                    } else {
                      setFormData({ ...formData, tanggalPemakaian: date || new Date() });
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="volume">
                  {transactionType === 'pembelian' ? 'Volume Pembelian (Liter)' : 'Volume Pemakaian (Liter)'}
                </Label>
                <Input
                  id="volume"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  required
                  placeholder="Masukkan volume dalam liter"
                />
              </div>
            </div>

            {transactionType === 'pembelian' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hargaPerLiter">Harga per Liter (Rp)</Label>
                  <Input
                    id="hargaPerLiter"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.hargaPerLiter}
                    onChange={(e) =>
                      setFormData({ ...formData, hargaPerLiter: Number(e.target.value) })
                    }
                    required
                    placeholder="Masukkan harga per liter"
                  />
                </div>
              </div>
            )}

            {transactionType === 'pemakaian' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="namaAlatBerat">Nama Alat Berat</Label>
                  <Input
                    id="namaAlatBerat"
                    value={formData.namaAlatBerat}
                    onChange={(e) =>
                      setFormData({ ...formData, namaAlatBerat: e.target.value })
                    }
                    required
                    placeholder="Masukkan nama alat berat"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="keteranganPemakaian">Keterangan Pemakaian</Label>
                  <Textarea
                    id="keteranganPemakaian"
                    value={formData.keteranganPemakaian}
                    onChange={(e) =>
                      setFormData({ ...formData, keteranganPemakaian: e.target.value })
                    }
                    placeholder="Contoh: Penggunaan rutin, Project A, dll"
                    required
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
