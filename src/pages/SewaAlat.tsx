import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileDown, Printer, Edit, Eye, Trash, Truck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useSewaAlat } from '../hooks/useSewaAlat';
import { usePagePermission } from '@/hooks/usePagePermission';
import { formatDateDisplay, parseMySQLDate } from '@/utils/dateUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';

interface SewaAlat {
  id?: string;
  nomorSewa: string;
  namaAlat: string;
  penyewa: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  biayaSewa: number;
  totalBiaya?: number;
  status: 'Aktif' | 'Selesai' | 'Terlambat' | 'Dibatalkan';
  lokasi: string;
  lokasi_sebelumnya?: string | null;
  lokasiSebelumnya?: string | null;
  operator: string;
  jamPemakaianPerHari?: number;
}

const SewaAlat = () => {
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(25);
 
   const { data: sewaData = [], isLoading } = useSewaAlat();
   const { can_create: canCreate, can_edit: canEdit, can_delete: canDelete, can_print: canPrint, can_export_excel: canExportExcel } = usePagePermission('sewaAlatEksternal');
   const canShowActions = canEdit || canDelete;

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sewaData;
    const q = searchQuery.toLowerCase();
    return sewaData.filter((item: any) =>
      (item.nomorSewa || '').toLowerCase().includes(q) ||
      (item.namaAlat || '').toLowerCase().includes(q) ||
      (item.penyewa || '').toLowerCase().includes(q) ||
      (item.lokasi || '').toLowerCase().includes(q) ||
      (item.lokasi_sebelumnya || item.lokasiSebelumnya || '').toLowerCase().includes(q) ||
      (item.operator || '').toLowerCase().includes(q)
    );
  }, [sewaData, searchQuery]);

  const totalPages = getTotalPages(filteredData.length, pageSize);
  const paginatedData = paginateData(filteredData, currentPage, pageSize);

  const stats = {
    total: sewaData.length,
    aktif: sewaData.filter((item: any) => item.status === 'Aktif').length,
    terlambat: sewaData.filter((item: any) => item.status === 'Terlambat').length,
    selesai: sewaData.filter((item: any) => item.status === 'Selesai').length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const calculateTotalBiaya = (
    biayaPerJam: number,
    jamPemakaianPerHari: number,
    tanggalMulai: string,
    tanggalSelesai: string,
  ) => {
    const mulai = parseMySQLDate(tanggalMulai);
    const selesai = parseMySQLDate(tanggalSelesai);

    if (!mulai || !selesai) return 0;

    const diffMs = selesai.getTime() - mulai.getTime();
    const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1); // inclusive

    return (Number(biayaPerJam) || 0) * (Number(jamPemakaianPerHari) || 0) * diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      case 'Selesai':
        return 'bg-blue-100 text-blue-800';
      case 'Terlambat':
        return 'bg-red-100 text-red-800';
      case 'Dibatalkan':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aktif':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'Selesai':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'Terlambat':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'Dibatalkan':
        return <Trash className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sewa Alat</h1>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sewa</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Kontrak Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Disewa</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aktif}</div>
            <p className="text-xs text-muted-foreground">Alat Beroperasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.terlambat}</div>
            <p className="text-xs text-muted-foreground">Melewati Tenggat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.selesai}</div>
            <p className="text-xs text-muted-foreground">Kontrak Selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Cari sewa alat..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-[300px]"
          />
        </div>
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
           {canCreate && (
             <Button className="w-full md:w-auto">
               <Plus className="h-4 w-4 mr-2" />
               Tambah Sewa
             </Button>
           )}
           {canPrint && (
           <Button variant="outline" className="w-full md:w-auto">
             <Printer className="h-4 w-4 mr-2" />
             Print
           </Button>
           )}
           {canExportExcel && (
           <Button variant="outline" className="w-full md:w-auto">
             <FileDown className="h-4 w-4 mr-2" />
             Export
           </Button>
           )}
         </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Sewa</TableHead>
                <TableHead>Nama Alat</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Biaya Per Jam</TableHead>
                <TableHead>Jam/Hari</TableHead>
                <TableHead>Total Biaya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Lokasi Sebelumnya</TableHead>
                <TableHead>Operator</TableHead>
                {canShowActions && <TableHead className="text-right">Aksi</TableHead>}
               </TableRow>
            </TableHeader>
             <TableBody>
               {paginatedData.map((item: any) => {
                 const jamPemakaian = item.jamPemakaianPerHari || 8; // default 8 jam jika tidak ada data
                const totalBiaya = item.totalBiaya && item.totalBiaya > 0
                  ? item.totalBiaya
                  : calculateTotalBiaya(item.biayaSewa, jamPemakaian, item.tanggalMulai, item.tanggalSelesai);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nomorSewa}</TableCell>
                    <TableCell>{item.namaAlat}</TableCell>
                    <TableCell>{item.penyewa}</TableCell>
                    <TableCell>{formatDateDisplay(item.tanggalMulai)}</TableCell>
                    <TableCell>{formatDateDisplay(item.tanggalSelesai)}</TableCell>
                    <TableCell>{formatCurrency(item.biayaSewa)}</TableCell>
                    <TableCell>{jamPemakaian} jam</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totalBiaya)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.lokasi}</TableCell>
                    <TableCell>{item.lokasi_sebelumnya || item.lokasiSebelumnya || '-'}</TableCell>
                    <TableCell>{item.operator}</TableCell>
                     {canShowActions && (
                       <TableCell className="text-right">
                         <div className="flex justify-end space-x-2">
                           <Button variant="ghost" size="icon" title="Lihat detail">
                             <Eye className="h-4 w-4" />
                           </Button>
                           {canEdit && (
                             <Button variant="ghost" size="icon" title="Edit">
                               <Edit className="h-4 w-4" />
                             </Button>
                           )}
                           {canDelete && (
                             <Button variant="ghost" size="icon" title="Hapus">
                               <Trash className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     )}
                   </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            totalItems={filteredData.length}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default SewaAlat;
