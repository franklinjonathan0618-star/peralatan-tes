import React, { useState } from 'react';
import { toast } from 'sonner';
import { OliTransaction } from '../../types/oil';
import { SelectAlatTimeSheet } from '@/components/SelectAlatTimeSheet';
interface OilTransactionFormProps {
  onSubmit: (transaction: OliTransaction) => void;
  onCancel: () => void;
  editingItem?: OliTransaction | null;
}

const OilTransactionForm: React.FC<OilTransactionFormProps> = ({ 
  onSubmit, 
  onCancel, 
  editingItem 
}) => {
  const [formJenis, setFormJenis] = useState<'pembelian' | 'pemakaian' | 'sisa_stock'>(
    editingItem?.jenis || 'pembelian'
  );
  
  const [formData, setFormData] = useState({
    tanggal: editingItem?.tanggal || '',
    jumlahMasuk: editingItem?.jumlahMasuk ?? (editingItem?.jenis !== 'pemakaian' ? (editingItem?.volume || 0) : 0),
    jumlahKeluar: editingItem?.jumlahKeluar ?? (editingItem?.jenis === 'pemakaian' ? (editingItem?.volume || 0) : 0),
    hargaPembelian: editingItem?.hargaPembelian || 0,
    keterangan: editingItem?.keterangan || '',
    lokasiProyek: editingItem?.lokasiProyek || '',
    noLambung: editingItem?.noLambung || '',
    namaAlat: editingItem?.namaAlat || '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    try {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: name === 'jumlahMasuk' || name === 'jumlahKeluar' || name === 'hargaPembelian' ? parseFloat(value) || 0 : value
      });
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Gagal mengupdate form');
    }
  };

  // Nilai efektif volume untuk perhitungan stok dan biaya
  const effectiveVolume = formJenis === 'pembelian'
    ? (formData.jumlahMasuk || 0)
    : formJenis === 'pemakaian'
      ? (formData.jumlahKeluar || 0)
      : (formData.jumlahMasuk || 0) - (formData.jumlahKeluar || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tanggal || !formData.keterangan) {
      toast.error('Mohon lengkapi tanggal dan keterangan');
      return;
    }

    if (formJenis === 'pembelian' && (!formData.jumlahMasuk || formData.jumlahMasuk <= 0)) {
      toast.error('Jumlah Masuk harus lebih dari 0 untuk pembelian');
      return;
    }

    if (formJenis === 'pemakaian' && (!formData.jumlahKeluar || formData.jumlahKeluar <= 0)) {
      toast.error('Jumlah Keluar harus lebih dari 0 untuk pemakaian');
      return;
    }

    if (formJenis === 'sisa_stock' && !formData.jumlahMasuk && !formData.jumlahKeluar) {
      toast.error('Jumlah Masuk atau Jumlah Keluar harus diisi untuk sisa stock');
      return;
    }

    if ((formJenis === 'pembelian' || formJenis === 'sisa_stock') && (!formData.hargaPembelian || formData.hargaPembelian <= 0)) {
      toast.error('Mohon masukkan harga per liter yang valid');
      return;
    }
    
    const newTransaction: OliTransaction = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      tanggal: formData.tanggal,
      jenis: formJenis,
      volume: Math.abs(effectiveVolume) || formData.jumlahMasuk || formData.jumlahKeluar || 0,
      jumlahMasuk: formData.jumlahMasuk || 0,
      jumlahKeluar: formData.jumlahKeluar || 0,
      keterangan: formData.keterangan,
      lokasiProyek: formData.lokasiProyek?.trim() || '',
      noLambung: formJenis === 'pemakaian' ? (formData.noLambung || '') : '',
      namaAlat: formJenis === 'pemakaian' ? (formData.namaAlat || '') : '',
      hargaPembelian: formData.hargaPembelian,
      totalHarga: (effectiveVolume || 0) * (formData.hargaPembelian || 0),
    };
    
    onSubmit(newTransaction);
  };

  return (
    <div className="glass-card p-6 mb-6 animate-fade-in overflow-visible">
      <h2 className="text-xl font-semibold mb-4">
        {editingItem ? 'Edit Transaksi Oli' : 'Tambah Transaksi Oli Baru'}
      </h2>
      
      <div className="mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => {
              setFormJenis('pembelian');
              setFormData(prev => ({ ...prev, jumlahKeluar: 0 }));
            }}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              formJenis === 'pembelian'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Pembelian
          </button>
          <button
            type="button"
            onClick={() => {
              setFormJenis('pemakaian');
              setFormData(prev => ({ ...prev, jumlahMasuk: 0 }));
            }}
            className={`px-4 py-2 text-sm font-medium border ${
              formJenis === 'pemakaian'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Pemakaian
          </button>
          <button
            type="button"
            onClick={() => setFormJenis('sisa_stock')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
              formJenis === 'sisa_stock'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Sisa Stock
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="tanggal" className="text-sm font-medium">
            Tanggal {formJenis === 'pembelian' ? 'Pembelian' : formJenis === 'sisa_stock' ? 'Sisa Stock' : 'Pemakaian'} <span className="text-red-500">*</span>
          </label>
          <input
            id="tanggal"
            name="tanggal"
            type="date"
            value={formData.tanggal}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="jumlahMasuk" className="text-sm font-medium">
            Jumlah Masuk (Liter) {formJenis !== 'pemakaian' && <span className="text-red-500">*</span>}
          </label>
          <input
            id="jumlahMasuk"
            name="jumlahMasuk"
            type="number"
            min="0"
            step="0.01"
            value={formData.jumlahMasuk}
            disabled={formJenis === 'pemakaian'}
            onChange={handleInputChange}
            className={`form-input ${formJenis === 'pemakaian' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
            required={formJenis !== 'pemakaian'}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="jumlahKeluar" className="text-sm font-medium">
            Jumlah Keluar (Liter) {formJenis !== 'pembelian' && <span className="text-red-500">*</span>}
          </label>
          <input
            id="jumlahKeluar"
            name="jumlahKeluar"
            type="number"
            min="0"
            step="0.01"
            value={formData.jumlahKeluar}
            disabled={formJenis === 'pembelian'}
            onChange={handleInputChange}
            className={`form-input ${formJenis === 'pembelian' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
            required={formJenis !== 'pembelian'}
          />
        </div>
        
        {(formJenis === 'pembelian' || formJenis === 'sisa_stock') && (
          <>
            <div className="space-y-2">
              <label htmlFor="hargaPembelian" className="text-sm font-medium">
                Harga per Liter (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                id="hargaPembelian"
                name="hargaPembelian"
                type="number"
                min="0"
                value={formData.hargaPembelian}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Total Biaya (Rp)
              </label>
              <div className="form-input bg-gray-50 text-gray-700">
                {formatCurrency(Math.max(0, effectiveVolume || 0) * (formData.hargaPembelian || 0))}
              </div>
            </div>
          </>
        )}
        
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="lokasiProyek" className="text-sm font-medium">
            Lokasi Proyek (Opsional)
          </label>
          <input
            id="lokasiProyek"
            name="lokasiProyek"
            type="text"
            value={formData.lokasiProyek}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Contoh: Proyek A, Site B, Kantor Pusat"
          />
        </div>

        {formJenis === 'pemakaian' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                No. Lambung (Opsional)
              </label>
              <SelectAlatTimeSheet
                value={formData.noLambung}
                onChange={(val) => setFormData({ ...formData, noLambung: val })}
                onAlatSelected={(alat) => {
                  if (alat) {
                    setFormData(prev => ({ ...prev, namaAlat: alat.namaAlat || '' }));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="namaAlat" className="text-sm font-medium">
                Nama Alat (Opsional)
              </label>
              <input
                id="namaAlat"
                name="namaAlat"
                type="text"
                value={formData.namaAlat}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Otomatis terisi dari No. Lambung"
              />
            </div>
          </>
        )}

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="keterangan" className="text-sm font-medium">
            Keterangan
          </label>
          <textarea
            id="keterangan"
            name="keterangan"
            value={formData.keterangan}
            onChange={handleInputChange}
            className="form-input min-h-[80px]"
            placeholder={formJenis === 'pembelian' ? 'Keterangan pembelian (jenis oli, merek, dll)...' : formJenis === 'sisa_stock' ? 'Keterangan sisa stock (sisa bulan lalu, dll)...' : 'Keterangan pemakaian (nama alat berat, keperluan, dll)...'}
            required
          />
        </div>
        
        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg"
          >
            Batal
          </button>
          <button type="submit" className="btn-primary">
            {editingItem ? 'Perbarui' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OilTransactionForm;
