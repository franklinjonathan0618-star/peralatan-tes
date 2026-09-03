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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlatBerat } from '@/types';
import { MultiFotoUploader } from '@/components/ui/MultiFotoUploader';
import { serializeFotoList } from '@/utils/fotoUtils';
import { FisikAlatHelpTooltip } from '@/components/FisikAlatHelpTooltip';

interface AddAlatBeratDialogProps {
  onSubmit: (data: Omit<AlatBerat, 'id'>) => Promise<void> | void;
  className?: string;
}

export function AddAlatBeratDialog({ onSubmit, className }: AddAlatBeratDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    no_lambung: '',
    nama_alat: '',
    tahun_perolehan: undefined,
    lokasi: '',
    lokasi_sebelumnya: '',
    merk: '',
    tipe: '',
    noSeri: '',
    kondisi: 'Baik',
    fisik_alat: undefined as number | undefined,
    status: 'standby',
    keterangan: '',
    serviceTerakhir: '',
    serviceBerikutnya: '',
    foto: '',
  } as Omit<AlatBerat, 'id'>);

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
      await onSubmit(formData);
      setOpen(false);
      // Reset form
      setFormData({
        no_lambung: '',
        nama_alat: '',
        tahun_perolehan: undefined,
        lokasi: '',
        lokasi_sebelumnya: '',
        merk: '',
        tipe: '',
        noSeri: '',
        kondisi: 'Baik',
        fisik_alat: undefined,
        status: 'standby',
        keterangan: '',
        serviceTerakhir: '',
        serviceBerikutnya: '',
      } as Omit<AlatBerat, 'id'>);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mr-2"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Tambah Alat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Alat Berat Baru</DialogTitle>
          <DialogDescription>
            Form untuk menambahkan data alat berat baru ke dalam sistem
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Row 1: No. Lambung & Nama Alat */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="noLambung">No. Lambung</Label>
                <Input
                  id="noLambung"
                  value={formData.no_lambung || ''}
                  onChange={(e) => setFormData({ ...formData, no_lambung: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="namaAlat">Nama Alat</Label>
                <Input
                  id="namaAlat"
                  value={formData.nama_alat || ''}
                  onChange={(e) => setFormData({ ...formData, nama_alat: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Merk & Tipe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="merk">Merk</Label>
                <Input
                  id="merk"
                  value={formData.merk || ''}
                  onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipe">Tipe</Label>
                <Input
                  id="tipe"
                  value={formData.tipe || ''}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: No. Seri & Tahun */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="noSeri">No. Seri</Label>
                <Input
                  id="noSeri"
                  value={formData.noSeri || ''}
                  onChange={(e) => setFormData({ ...formData, noSeri: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tahunPerolehan">Tahun</Label>
                <Input
                  id="tahunPerolehan"
                  type="number"
                  value={formData.tahun_perolehan || ''}
                  onChange={(e) => setFormData({ ...formData, tahun_perolehan: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>

            {/* Row 4: Lokasi & Lokasi Sebelumnya */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lokasi">Lokasi</Label>
                <Input
                  id="lokasi"
                  value={formData.lokasi || ''}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lokasi_sebelumnya">Lokasi Sebelumnya</Label>
                <Input
                  id="lokasi_sebelumnya"
                  value={formData.lokasi_sebelumnya || ''}
                  onChange={(e) => setFormData({ ...formData, lokasi_sebelumnya: e.target.value })}
                />
              </div>
            </div>

            {/* Row 5: Kondisi & Fisik Alat */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kondisi">Kondisi</Label>
                <Select
                  value={formData.kondisi || 'Baik'}
                  onValueChange={(value) => setFormData({ ...formData, kondisi: value })}
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
              <div className="grid gap-2">
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

            {/* Row 6: Status & Keterangan */}
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

            {/* Row 7: Service Terakhir & Service Berikutnya */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceTerakhir">Service Terakhir</Label>
                <Input
                  id="serviceTerakhir"
                  type="date"
                  value={formData.serviceTerakhir || ''}
                  onChange={(e) => setFormData({ ...formData, serviceTerakhir: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceBerikutnya">Service Berikutnya</Label>
                <Input
                  id="serviceBerikutnya"
                  type="date"
                  value={formData.serviceBerikutnya || ''}
                  onChange={(e) => setFormData({ ...formData, serviceBerikutnya: e.target.value })}
                />
              </div>
            </div>

            {/* Row 8: Upload 5 Foto */}
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
