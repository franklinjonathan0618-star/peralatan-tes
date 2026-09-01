import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Trash, Edit, Plus, Printer, CheckCircle2, XCircle, Minus } from 'lucide-react';
import { usePemutihan, useAddPemutihan, useUpdatePemutihan, useDeletePemutihan } from '@/hooks/usePemutihan';
import { usePagePermission } from '@/hooks/usePagePermission';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';
import { SelectAlatTimeSheet } from '@/components/SelectAlatTimeSheet';
import type { Pemutihan } from '@/types';

const PemutihanAlat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pemutihan | null>(null);
  const [selectedPemutihan, setSelectedPemutihan] = useState<Pemutihan | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pemutihanData = [], isLoading } = usePemutihan();
  const { mutateAsync: addPemutihan, isPending: isAdding } = useAddPemutihan();
  const { mutateAsync: updatePemutihan, isPending: isUpdating } = useUpdatePemutihan();
  const { mutateAsync: deletePemutihan, isPending: isDeleting } = useDeletePemutihan();

  const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_print: canPrint, can_approve: canApprove } = usePagePermission('pemutihanAlat');
  const canShowActions = canEdit || canDelete || canApprove || canPrint;

  const [formData, setFormData] = useState({
    no_lambung: '',
    nama_alat: '',
    merk: '',
    tipe: '',
    part_terlepas: [''],
    status: 'terjual' as 'terjual' | 'kanibal' | 'pemutihan',
    keterangan: '',
    tanggal: '',
  });

  const handleAlatSelected = (alat: any) => {
    if (alat) {
      setFormData(prev => ({
        ...prev,
        nama_alat: alat.namaAlat || '',
      }));
    }
  };

  const filteredData = pemutihanData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.no_lambung?.toLowerCase().includes(searchLower) ||
      item.nama_alat?.toLowerCase().includes(searchLower) ||
      item.merk?.toLowerCase().includes(searchLower) ||
      item.tipe?.toLowerCase().includes(searchLower) ||
      item.part_terlepas?.toLowerCase().includes(searchLower) ||
      item.status?.toLowerCase().includes(searchLower) ||
      (item.tanggal && new Date(item.tanggal).toLocaleDateString('id-ID').includes(searchLower))
    );
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      no_lambung: '',
      nama_alat: '',
      merk: '',
      tipe: '',
      part_terlepas: [''],
      status: 'terjual',
      keterangan: '',
      tanggal: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Pemutihan) => {
    setEditingItem(item);
    // Parse part_terlepas string into array if it exists
    const partsArray = item.part_terlepas
      ? item.part_terlepas.split(',').map(p => p.trim()).filter(p => p !== '')
      : [''];

    setFormData({
      no_lambung: item.no_lambung,
      nama_alat: item.nama_alat,
      merk: item.merk || '',
      tipe: item.tipe || '',
      part_terlepas: partsArray.length > 0 ? partsArray : [''],
      status: item.status,
      keterangan: item.keterangan || '',
      tanggal: item.tanggal || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return;
    }
    try {
      await deletePemutihan(id);
    } catch (error) {
      console.error('Error deleting pemutihan:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert part_terlepas array to comma-separated string
      const partsString = formData.part_terlepas
        .filter(part => part.trim() !== '')
        .join(', ');

      const submitData = {
        ...formData,
        part_terlepas: partsString || undefined,
      };

      if (editingItem) {
        await updatePemutihan({ ...submitData, id: editingItem.id });
      } else {
        await addPemutihan(submitData);
      }
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving pemutihan:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (index: number, value: string) => {
    const newParts = [...formData.part_terlepas];
    newParts[index] = value;
    setFormData(prev => ({ ...prev, part_terlepas: newParts }));
  };

  const addPartField = () => {
    setFormData(prev => ({ ...prev, part_terlepas: [...prev.part_terlepas, ''] }));
  };

  const removePartField = (index: number) => {
    if (formData.part_terlepas.length > 1) {
      const newParts = formData.part_terlepas.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, part_terlepas: newParts }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'terjual') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Terjual</span>;
    } else if (statusLower === 'kanibal') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">Kanibal</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

const getPemutihanStatusBadge = (status?: string) => {
  const statusLower = status?.toLowerCase() || 'pending';

  if (statusLower === 'approved') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Disetujui
      </span>
    );
  } else if (statusLower === 'rejected') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Ditolak
      </span>
    );
  } else if (statusLower === 'completed') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Selesai
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Menunggu
    </span>
  );
};

  const handlePrintSingle = (item: Pemutihan) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pemutihan - ${item.no_lambung || 'Dokumen'}</title>
            <style>
              @page { size: A4 landscape; margin: 1cm; }
              body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .company-name { font-weight: bold; font-size: 14px; }
              .company-division { font-size: 12px; margin-bottom: 10px; }
              h1 { color: #1a365d; text-align: center; font-size: 18px; margin-bottom: 5px; }
              .print-date { text-align: center; color: #666; margin-bottom: 20px; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
              th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Cabang Papua</div>
              <div class="company-division">Peralatan</div>
            </div>
            <h1>PEMUTIHAN ALAT</h1>
            <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>No. Lambung</th>
                  <th>Nama Alat</th>
                  <th>Merk</th>
                  <th>Tipe</th>
                  <th>Part Terlepas</th>
                  <th>Status</th>
                  <th>Status Pemutihan</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td>${item.no_lambung || '-'}</td>
                  <td>${item.nama_alat || '-'}</td>
                  <td>${item.merk || '-'}</td>
                  <td>${item.tipe || '-'}</td>
                  <td>${item.part_terlepas || '-'}</td>
                  <td>${item.status || '-'}</td>
                  <td>${item.status_pemutihan || 'Menunggu'}</td>
                  <td>${item.keterangan || '-'}</td>
                </tr>
              </tbody>
            </table>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleApprove = async () => {
    if (!selectedPemutihan) return;
    try {
      await updatePemutihan({
        ...selectedPemutihan,
        status_pemutihan: 'approved'
      });
      setShowApproveDialog(false);
      setSelectedPemutihan(null);
    } catch (error) {
      console.error('Error approving pemutihan:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedPemutihan) return;
    try {
      await updatePemutihan({
        ...selectedPemutihan,
        status_pemutihan: 'rejected'
      });
      setShowRejectDialog(false);
      setSelectedPemutihan(null);
    } catch (error) {
      console.error('Error rejecting pemutihan:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Persetujuan Pemutihan Alat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan No. Lambung, Nama Alat, Merk, dll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {canCreate && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            )}
          </div>

          <TableScrollWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Lambung</TableHead>
                  <TableHead>Nama Alat</TableHead>
                  <TableHead>Merk</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Part Terlepas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status Pemutihan</TableHead>
                  {canShowActions && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={canShowActions ? 10 : 9} className="text-center py-6">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canShowActions ? 10 : 9} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data pemutihan'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateData(filteredData, currentPage, pageSize).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</TableCell>
                      <TableCell className="font-medium">{item.no_lambung}</TableCell>
                      <TableCell>{item.nama_alat}</TableCell>
                      <TableCell>{item.merk || '-'}</TableCell>
                      <TableCell>{item.tipe || '-'}</TableCell>
                      <TableCell>{item.part_terlepas || '-'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getPemutihanStatusBadge(item.status_pemutihan)}</TableCell>
                      {canShowActions && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canPrint && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:bg-gray-100 p-1 h-8 w-8"
                                title="Cetak"
                                onClick={() => handlePrintSingle(item)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            {item.status_pemutihan === 'pending' && canApprove && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50 p-1 h-8 w-8"
                                  title="Setujui"
                                  onClick={() => {
                                    setSelectedPemutihan(item);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                                  title="Tolak"
                                  onClick={() => {
                                    setSelectedPemutihan(item);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                disabled={isUpdating}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableScrollWrapper>

          {filteredData.length > 0 && (
            <div className="mt-4">
              <SimplePagination
                currentPage={currentPage}
                totalPages={getTotalPages(filteredData.length, pageSize)}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Data Pemutihan' : 'Tambah Data Pemutihan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="no_lambung">No. Lambung *</Label>
                  <SelectAlatTimeSheet
                    id="no_lambung"
                    value={formData.no_lambung}
                    onChange={(v) => setFormData(prev => ({ ...prev, no_lambung: v }))}
                    onAlatSelected={handleAlatSelected}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama_alat">Nama Alat *</Label>
                  <Input
                    id="nama_alat"
                    name="nama_alat"
                    value={formData.nama_alat}
                    onChange={handleInputChange}
                    required
                    placeholder="Otomatis terisi dari No. Lambung"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="merk">Merk</Label>
                  <Input
                    id="merk"
                    name="merk"
                    value={formData.merk}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipe">Tipe</Label>
                  <Input
                    id="tipe"
                    name="tipe"
                    value={formData.tipe}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal *</Label>
                  <Input
                    id="tanggal"
                    name="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Part Terlepas</Label>
                {formData.part_terlepas.map((part, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={part}
                      onChange={(e) => handlePartChange(index, e.target.value)}
                      placeholder={`Nama part ${index + 1}`}
                      className="flex-1"
                    />
                    {formData.part_terlepas.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePartField(index)}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPartField}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Part
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="terjual">Terjual</option>
                  <option value="kanibal">Kanibal</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isAdding || isUpdating}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menyetujui pemutihan alat ini?</p>
            <p className="font-medium mt-2">No. Lambung: {selectedPemutihan?.no_lambung}</p>
            <p className="font-medium">Nama Alat: {selectedPemutihan?.nama_alat}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={isUpdating}
            >
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penolakan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menolak pemutihan alat ini?</p>
            <p className="font-medium mt-2">No. Lambung: {selectedPemutihan?.no_lambung}</p>
            <p className="font-medium">Nama Alat: {selectedPemutihan?.nama_alat}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={isUpdating}
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PemutihanAlat;
