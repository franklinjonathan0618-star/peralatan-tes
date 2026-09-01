
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import type { BBMData } from '@/types';
import { formatDateForMySQL, parseMySQLDate } from '@/utils/dateUtils';

interface EditBBMTransactionDialogProps {
  transaction: BBMData;
  onSubmit: (data: BBMData) => Promise<void> | void;
}

export function EditBBMTransactionDialog({ transaction, onSubmit }: EditBBMTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BBMData>(transaction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return formatDateForMySQL(date);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaksi BBM</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formData.volumePembelian > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tanggalPembelian">Tanggal Pembelian</Label>
                <Input
                  id="tanggalPembelian"
                  type="date"
                  value={formatDateForInput(formData.tanggalPembelian)}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tanggalPembelian: parseMySQLDate(e.target.value) || new Date()
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumePembelian">Volume Pembelian (Liter)</Label>
                <Input
                  id="volumePembelian"
                  type="number"
                  value={formData.volumePembelian}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    volumePembelian: Number(e.target.value) 
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hargaPerLiter">Harga Per Liter</Label>
                <Input
                  id="hargaPerLiter"
                  type="number"
                  value={formData.hargaPerLiter}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    hargaPerLiter: Number(e.target.value) 
                  })}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="lokasiProyekEdit">Lokasi Proyek (Opsional)</Label>
            <Input
              id="lokasiProyekEdit"
              value={formData.lokasiProyek || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                lokasiProyek: e.target.value 
              })}
              placeholder="Contoh: Proyek A, Site B, Kantor Pusat"
            />
          </div>
          
          {formData.volumePemakaian > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tanggalPemakaian">Tanggal Pemakaian</Label>
                <Input
                  id="tanggalPemakaian"
                  type="date"
                  value={formData.tanggalPemakaian ? formatDateForInput(formData.tanggalPemakaian) : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tanggalPemakaian: parseMySQLDate(e.target.value) || new Date()
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volumePemakaian">Volume Pemakaian (Liter)</Label>
                <Input
                  id="volumePemakaian"
                  type="number"
                  value={formData.volumePemakaian}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    volumePemakaian: Number(e.target.value) 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaAlatBerat">Nama Alat Berat</Label>
                <Input
                  id="namaAlatBerat"
                  value={formData.namaAlatBerat}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    namaAlatBerat: e.target.value 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keteranganPemakaian">Keterangan</Label>
                <Input
                  id="keteranganPemakaian"
                  value={formData.keteranganPemakaian}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    keteranganPemakaian: e.target.value 
                  })}
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
