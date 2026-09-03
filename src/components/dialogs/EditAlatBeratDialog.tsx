
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import type { AlatBerat } from '@/types';
import { formatDateForInput, normalizeDateOnly } from '@/utils/dateUtils';
import { MultiFotoUploader } from '@/components/ui/MultiFotoUploader';
import { serializeFotoList } from '@/utils/fotoUtils';
import { FisikAlatHelpTooltip } from '@/components/FisikAlatHelpTooltip';

interface EditAlatBeratDialogProps {
  alatBerat: AlatBerat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlatBerat) => Promise<void> | void;
}

export function EditAlatBeratDialog({ alatBerat, open, onOpenChange, onSubmit }: EditAlatBeratDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AlatBerat>(alatBerat);

  useEffect(() => {
    setFormData({
      ...alatBerat,
      lokasi_sebelumnya: alatBerat.lokasi_sebelumnya || (alatBerat as any).lokasiSebelumnya || '',
      serviceTerakhir: formatDateForInput(alatBerat.serviceTerakhir),
      serviceBerikutnya: formatDateForInput(alatBerat.serviceBerikutnya),
    });
  }, [alatBerat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi field yang wajib diisi
    const missingFields = [];
    if (!formData.no_lambung?.trim()) missingFields.push('No. Lambung');
    if (!formData.nama_alat?.trim()) missingFields.push('Nama Alat');
    if (!formData.merk?.trim()) missingFields.push('Merk');
    if (!formData.tipe?.trim()) missingFields.push('Tipe');
    if (!formData.lokasi?.trim()) missingFields.push('Lokasi');
    if (!formData.kondisi?.trim()) missingFields.push('Kondisi');
    if (!formData.status?.trim()) missingFields.push('Status');

    if (missingFields.length > 0) {
      toast({
        title: "Peringatan: Data Belum Lengkap",
        description: `Harap lengkapi field berikut sebelum menyimpan: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        serviceTerakhir: normalizeDateOnly(formData.serviceTerakhir) || undefined,
        serviceBerikutnya: normalizeDateOnly(formData.serviceBerikutnya) || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Alat Berat</DialogTitle>
        </DialogHeader>
        <div className="sr-only" id="edit-form-description">
          Form untuk mengubah data alat berat
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="edit-form-description">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="no_lambung">No. Lambung</Label>
              <Input
                id="no_lambung"
                value={formData.no_lambung || ''}
                onChange={(e) => setFormData({ ...formData, no_lambung: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_alat">Nama Alat</Label>
              <Input
                id="nama_alat"
                value={formData.nama_alat || ''}
                onChange={(e) => setFormData({ ...formData, nama_alat: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merk">Merk</Label>
              <Input
                id="merk"
                value={formData.merk || ''}
                onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe</Label>
              <Input
                id="tipe"
                value={formData.tipe || ''}
                onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noSeri">No. Seri</Label>
              <Input
                id="noSeri"
                type="text"
                value={formData.noSeri || ''}
                onChange={(e) => setFormData({ ...formData, noSeri: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun_perolehan">Tahun</Label>
              <Input
                id="tahun_perolehan"
                type="number"
                value={formData.tahun_perolehan || ''}
                onChange={(e) => setFormData({ ...formData, tahun_perolehan: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi || ''}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi_sebelumnya">Lokasi Sebelumnya</Label>
              <Input
                id="lokasi_sebelumnya"
                value={formData.lokasi_sebelumnya || ''}
                onChange={(e) => setFormData({ ...formData, lokasi_sebelumnya: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="fisik_alat">Fisik Alat (%)</Label>
                <FisikAlatHelpTooltip iconClassName="h-4 w-4" />
              </div>
              <Input
                id="fisik_alat"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0 - 100"
                value={formData.fisik_alat || ''}
                onChange={(e) => setFormData({ ...formData, fisik_alat: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceTerakhir">Service Terakhir</Label>
              <Input
                id="serviceTerakhir"
                type="date"
                value={formData.serviceTerakhir || ''}
                onChange={(e) => setFormData({ ...formData, serviceTerakhir: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceBerikutnya">Service Berikutnya</Label>
              <Input
                id="serviceBerikutnya"
                type="date"
                value={formData.serviceBerikutnya || ''}
                onChange={(e) => setFormData({ ...formData, serviceBerikutnya: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                value={formData.keterangan || ''}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
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
