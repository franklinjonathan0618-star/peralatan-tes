import { useState } from 'react';
import { usePemutihan, useUpdatePemutihan } from '@/hooks/usePemutihan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePagePermission } from '@/hooks/usePagePermission';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';
import { formatDateDisplay } from '@/utils/dateUtils';
import { supabase } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Pemutihan } from '@/types';

// Expand/collapse row with details
function PemutihanRow({ pemutihan, canApprove }: { pemutihan: Pemutihan; canApprove: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: updatePemutihan, isPending } = useUpdatePemutihan();
  const queryClient = useQueryClient();

  const status = pemutihan.status_pemutihan || 'pending';
  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Menunggu', cls: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-800' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-800' },
    completed: { label: 'Selesai', cls: 'bg-blue-100 text-blue-800' },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  const statusAlatConfig: Record<string, { label: string; cls: string }> = {
    terjual: { label: 'Terjual', cls: 'bg-red-100 text-red-800' },
    kanibal: { label: 'Kanibal', cls: 'bg-orange-100 text-orange-800' },
    pemutihan: { label: 'Pemutihan', cls: 'bg-purple-100 text-purple-800' },
  };
  const sac = statusAlatConfig[pemutihan.status] || statusAlatConfig.terjual;

  // Aksi lanjutan setelah pemutihan disetujui di halaman Persetujuan:
  // pilih apakah alat menjadi "Kanibal" atau "Pemutihan"
  const handleStatusUpdate = async (
    targetStatus: 'kanibal' | 'pemutihan'
  ) => {
    const statusLabel =
      targetStatus === 'pemutihan' ? 'Pemutihan' : 'Kanibal';

    if (
      !confirm(
        `Apakah Anda yakin ingin mengubah status alat ${pemutihan.nama_alat} menjadi "${statusLabel}"?`
      )
    ) {
      return;
    }

    try {
      const updateData = {
        status: targetStatus,
        lokasi: 'Pool BTG',
      };

      // Try to update in alat_berat first
      const { data: beratData, error: beratError } = await (supabase as any)
        .from('alat_berat')
        .update(updateData)
        .eq('no_lambung', pemutihan.no_lambung)
        .select('no_lambung');

      if (beratError) {
        throw beratError;
      }

      if (!beratData || beratData.length === 0) {
        const { data: pendukungData, error: pendukungError } =
          await (supabase as any)
            .from('alat_pendukung')
            .update(updateData)
            .eq('no_lambung', pemutihan.no_lambung)
            .select('no_lambung');

        if (pendukungError) {
          throw pendukungError;
        }

        if (!pendukungData || pendukungData.length === 0) {
          throw new Error('Data alat tidak ditemukan');
        }
      }

      // Ubah record pemutihan menjadi selesai
      await updatePemutihan({
        ...pemutihan,
        status: targetStatus,
        status_pemutihan: 'completed',
      });

      // Invalidate equipment queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['alatBerat'] });
      queryClient.invalidateQueries({ queryKey: ['alatPendukung'] });

      alert(`Status alat berhasil diubah menjadi ${statusLabel}`);
    } catch (error) {
      console.error('Error updating equipment status:', error);
      alert('Gagal mengubah status alat. Silakan coba lagi.');
    }
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <TableCell>{pemutihan.tanggal ? formatDateDisplay(pemutihan.tanggal) : '-'}</TableCell>
        <TableCell className="font-medium">{pemutihan.no_lambung}</TableCell>
        <TableCell>{pemutihan.nama_alat}</TableCell>
        <TableCell>{pemutihan.merk || '-'}</TableCell>
        <TableCell>{pemutihan.tipe || '-'}</TableCell>
        <TableCell>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sac.cls}`}>
            {sac.label}
          </span>
        </TableCell>
        <TableCell>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
            {sc.label}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {canApprove && status === 'approved' && (
              <>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('kanibal');
                  }}
                >
                  Kanibal
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('pemutihan');
                  }}
                >
                  Pemutihan
                </Button>
              </>
            )}
            {status === 'completed' && (
              <Button
                size="sm"
                className="h-8 px-3 bg-blue-600 text-white"
                disabled
              >
                Selesai
              </Button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(ex => !ex); }}
              className="p-1 text-gray-400 hover:text-gray-700"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="p-0 bg-gray-50 border-b">
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Informasi Alat</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">No. Lambung:</span> {pemutihan.no_lambung}</p>
                    <p><span className="text-gray-500">Nama Alat:</span> {pemutihan.nama_alat}</p>
                    <p><span className="text-gray-500">Merk:</span> {pemutihan.merk || '-'}</p>
                    <p><span className="text-gray-500">Tipe:</span> {pemutihan.tipe || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Detail Pemutihan</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Tanggal:</span> {pemutihan.tanggal ? formatDateDisplay(pemutihan.tanggal) : '-'}</p>
                    <p><span className="text-gray-500">Status Alat:</span> {sac.label}</p>
                    <p><span className="text-gray-500">Status Pemutihan:</span> {sc.label}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Part Terlepas</p>
                <p className="text-sm">{pemutihan.part_terlepas || '-'}</p>
              </div>
              {pemutihan.keterangan && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Keterangan</p>
                  <p className="text-sm">{pemutihan.keterangan}</p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function Pemutihan() {
  const { data: pemutihanList, isLoading } = usePemutihan();
  const { can_approve: canApprove } = usePagePermission('pemutihan');

  const [filter, setFilter] = useState<'semua' | 'pending' | 'approved' | 'rejected' | 'completed'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = filter === 'semua'
    ? pemutihanList
    : pemutihanList.filter(p => p.status_pemutihan === filter);

  const totalPages = getTotalPages(filtered.length, pageSize);
  const paginatedData = paginateData(filtered, currentPage, pageSize);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Pemutihan Alat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar  pemutihan alat berat dan pendukung
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex flex-wrap rounded-md shadow-sm" role="group">
          {(['semua', 'pending', 'approved', 'rejected', 'completed'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-medium border transition-colors first:rounded-l-md last:rounded-r-md ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f === 'semua' ? 'Semua' : f === 'pending' ? 'Menunggu' : f === 'approved' ? 'Disetujui' : f === 'rejected' ? 'Ditolak' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Pemutihan Alat{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({filtered.length} data)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada data pemutihan alat.
            </div>
          ) : (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Lambung</TableHead>
                    <TableHead>Nama Alat</TableHead>
                    <TableHead>Merk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status Alat</TableHead>
                    <TableHead>Status Pemutihan</TableHead>
                    <TableHead className="w-[200px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {paginatedData.map(pemutihan => (
                    <PemutihanRow key={pemutihan.id} pemutihan={pemutihan} canApprove={canApprove} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              totalItems={filtered.length}
            />
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}