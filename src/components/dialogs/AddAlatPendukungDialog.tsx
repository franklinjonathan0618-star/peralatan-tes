
import { useState, FormEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { AlatPendukung } from '@/types';
import { MultiFotoUploader } from '@/components/ui/MultiFotoUploader';
import { serializeFotoList } from '@/utils/fotoUtils';

interface AddAlatPendukungDialogProps {
  onSubmit: (data: Omit<AlatPendukung, 'id'>) => Promise<void> | void;
  className?: string;
}

export function AddAlatPendukungDialog({ onSubmit, className }: AddAlatPendukungDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaAlat: '',
    jenisAlat: '',
    kondisi: 'Baik',
    lokasi: '',
    lokasiSebelumnya: '',
    keterangan: '',
    gambar: '',
    foto: '',
    noLambung: '',
    merk: '',
    tipe: '',
    status: 'standby'
  } as Omit<AlatPendukung, 'id'>);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast({
        title: 'Berhasil',
        description: 'Data alat pendukung berhasil ditambahkan',
      });
      setOpen(false);
      
      // Reset form
      setFormData({
        namaAlat: '',
        jenisAlat: '',
        kondisi: 'Baik',
        lokasi: '',
        lokasiSebelumnya: '',
        keterangan: '',
        gambar: '',
        foto: '',
        noLambung: '',
        merk: '',
        tipe: '',
        status: 'standby'
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Gagal',
        description: error?.message || 'Gagal menambahkan data alat pendukung. Pastikan semua field required sudah diisi and RLS policies sudah dikonfigurasi dengan benar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Alat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Alat Pendukung Baru</DialogTitle>
            <DialogDescription>
              Form untuk menambahkan data alat pendukung baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="noLambung">No. Lambung</Label>
                <Input
                  id="noLambung"
                  value={formData.noLambung || ''}
                  onChange={(e) => setFormData({ ...formData, noLambung: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
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
              <div className="grid gap-2">
                <Label htmlFor="jenisAlat">Jenis Alat</Label>
                <Input
                  id="jenisAlat"
                  value={formData.jenisAlat || ''}
                  onChange={(e) => setFormData({ ...formData, jenisAlat: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="merk">Merk</Label>
                <Input
                  id="merk"
                  value={formData.merk || ''}
                  onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipe">Type</Label>
                <Input
                  id="tipe"
                  value={formData.tipe || ''}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kondisi">Kondisi</Label>
                <Select
                  value={formData.kondisi || ''}
                  onValueChange={(value: 'Baik' | 'Maintenance' | 'Rusak') =>
                    setFormData({ ...formData, kondisi: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kondisi" />
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
              <div className="grid gap-2">
                <Label htmlFor="lokasi">Lokasi</Label>
                <Input
                  id="lokasi"
                  value={formData.lokasi || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lokasi: e.target.value
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lokasiSebelumnya">Lokasi Sebelumnya</Label>
                <Input
                  id="lokasiSebelumnya"
                  value={formData.lokasiSebelumnya || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lokasiSebelumnya: e.target.value
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'standby'}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standby">Standby</SelectItem>
                    <SelectItem value="sedang digunakan">Sedang Digunakan</SelectItem>
                    <SelectItem value="kanibal">Kanibal</SelectItem>
                    <SelectItem value="pemutihan">Pemutihan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
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
