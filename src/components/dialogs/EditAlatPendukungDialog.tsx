
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import type { AlatPendukung } from '@/types';
import { MultiFotoUploader } from '@/components/ui/MultiFotoUploader';
import { serializeFotoList } from '@/utils/fotoUtils';

interface EditAlatPendukungDialogProps {
  alatPendukung: AlatPendukung;
  onSubmit: (data: AlatPendukung) => Promise<void> | void;
}

export function EditAlatPendukungDialog({ alatPendukung, onSubmit }: EditAlatPendukungDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AlatPendukung>({
    ...alatPendukung,
    foto: alatPendukung.foto || ''
  });

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="edit-alat-pendukung-title">Edit Alat Pendukung</DialogTitle>
          <DialogDescription id="edit-alat-pendukung-description">
            Edit data alat pendukung
          </DialogDescription>
        </DialogHeader>
        <div role="document" aria-labelledby="edit-alat-pendukung-title" aria-describedby="edit-alat-pendukung-description">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noLambung">No. Lambung</Label>
              <Input
                id="noLambung"
                value={formData.noLambung || ''}
                onChange={(e) => setFormData({ ...formData, noLambung: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaAlat">Nama Alat</Label>
              <Input
                id="namaAlat"
                value={formData.namaAlat}
                onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jenisAlat">Jenis Alat</Label>
              <Input
                id="jenisAlat"
                value={formData.jenisAlat || ''}
                onChange={(e) => setFormData({ ...formData, jenisAlat: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merk">Merk</Label>
              <Input
                id="merk"
                value={formData.merk || ''}
                onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipe">Type</Label>
              <Input
                id="tipe"
                value={formData.tipe || ''}
                onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kondisi">Kondisi</Label>
              <Select
                value={formData.kondisi || ''}
                onValueChange={(value) => setFormData({ ...formData, kondisi: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baik">Baik</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Rusak">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  lokasi: e.target.value
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasiSebelumnya">Lokasi Sebelumnya</Label>
              <Input
                id="lokasiSebelumnya"
                value={formData.lokasiSebelumnya || (formData as any).lokasi_sebelumnya || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  lokasiSebelumnya: e.target.value,
                  lokasi_sebelumnya: e.target.value
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                value={formData.keterangan || ''}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'standby'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="sedang digunakan">Sedang Digunakan</SelectItem>
                  <SelectItem value="kanibal">Kanibal</SelectItem>
                  <SelectItem value="pemutihan">Pemutihan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload 5 Foto */}
          <div className="pt-2 border-t border-slate-100">
            <MultiFotoUploader
              value={formData.foto}
              onChange={(fotos) => setFormData(prev => ({ ...prev, foto: serializeFotoList(fotos) || '' }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
