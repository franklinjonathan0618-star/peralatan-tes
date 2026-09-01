
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

import { usePPA, useUpdatePPA } from '@/hooks/usePPA';
import { SelectAlatBerat } from '@/components/SelectAlatBerat';
import { getTodayLocalDateString, normalizeDateOnly } from '@/utils/dateUtils';

export default function EditPPA() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    tanggal: '',
    no_ppa: '',
    nama_alat: '',
    no_lambung: '',
    kerusakan: '',
    keterangan: ''
  });

  const { data: ppaData } = usePPA();
  const updatePPA = useUpdatePPA();

  // Find the PPA item to edit
  useEffect(() => {
    if (ppaData && id) {
      const ppaItem = ppaData.find(item => item.id === id);
      if (ppaItem) {
        setFormData({
          tanggal: normalizeDateOnly(ppaItem.tanggal) || getTodayLocalDateString(),
          no_ppa: ppaItem.no_ppa || '',
          nama_alat: ppaItem.nama_alat || '',
          no_lambung: ppaItem.no_lambung || '',
          kerusakan: ppaItem.kerusakan || '',
          keterangan: ppaItem.keterangan || ''
        });
      } else {
        navigate('/PPA');
      }
    }
  }, [ppaData, id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_alat || !formData.no_lambung || !formData.kerusakan) {
      return;
    }

    if (!id) return;

    try {
      await updatePPA.mutateAsync({
        id,
        ...formData,
        tanggal: normalizeDateOnly(formData.tanggal),
        keterangan: formData.keterangan || null
      });

      // Redirect to PPA list
      navigate('/PPA');
    } catch (error) {
      console.error('Error updating PPA:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/PPA')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar PPA
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Permohonan Perbaikan Alat</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  name="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="no_ppa">No. PPA</Label>
                <Input
                  id="no_ppa"
                  name="no_ppa"
                  value={formData.no_ppa}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama_alat">Nama Alat <span className="text-red-500">*</span></Label>
                <Input
                  id="nama_alat"
                  name="nama_alat"
                  value={formData.nama_alat}
                  onChange={handleChange}
                  placeholder="Contoh: Excavator Komatsu PC200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="no_lambung">No. Lambung <span className="text-red-500">*</span></Label>
                <SelectAlatBerat
                  id="no_lambung"
                  value={formData.no_lambung}
                  onChange={(val) => setFormData(prev => ({ ...prev, no_lambung: val }))}
                  onAlatSelected={(alat) => {
                    if (alat) {
                      setFormData(prev => ({ ...prev, nama_alat: (alat.nama_alat as string) || '' }));
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="kerusakan">Kerusakan <span className="text-red-500">*</span></Label>
                <Textarea
                  id="kerusakan"
                  name="kerusakan"
                  value={formData.kerusakan}
                  onChange={handleChange}
                  placeholder="Jelaskan kerusakan yang terjadi"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                <Textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder="Tambahkan keterangan jika diperlukan"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/PPA')}
                disabled={updatePPA.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updatePPA.isPending}>
                {updatePPA.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
