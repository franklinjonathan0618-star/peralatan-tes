import { useState } from 'react';
import { useRPA, useCompleteRPA, RPAItem } from '@/hooks/useRPA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { usePagePermission } from '@/hooks/usePagePermission';
import { supabase } from '@/integrations/api/client';
import { useQuery } from '@tanstack/react-query';
import { formatDateDisplay } from '@/utils/dateUtils';
import { SimplePagination, paginateData, getTotalPages } from '@/components/ui/SimplePagination';

// Fetch all RPA with details in a single hook for the history page
function useRPAWithDetails() {
  const { data: rpaList = [], isLoading } = useRPA();
  // Only show 'digunakan' and 'selesai' entries
  const filtered = rpaList.filter(r => r.status === 'digunakan' || r.status === 'selesai');
  return { data: filtered, isLoading };
}

// Expand/collapse row with details
function RPAHistoryRow({ rpa, isAdmin }: { rpa: RPAItem; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: completeRPA, isPending } = useCompleteRPA();

  // Lazy-load details only when expanded
  const { data: details = [] } = useQuery({
    queryKey: ['rpa-details', rpa.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rpa_details')
        .select('*')
        .eq('rpa_id', rpa.id);
      if (error) throw error;
      return data || [];
    },
    enabled: expanded,
  });

  const status = rpa.status || 'digunakan';
  const statusConfig: Record<string, { label: string; cls: string }> = {
    digunakan: { label: 'Sedang Digunakan', cls: 'bg-blue-100 text-blue-800' },
    selesai: { label: 'Selesai', cls: 'bg-green-100 text-green-800' },
  };
  const sc = statusConfig[status] || statusConfig.digunakan;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <TableCell>{rpa.rpa_id}</TableCell>
        <TableCell>{formatDateDisplay(rpa.tanggal)}</TableCell>
        <TableCell>{rpa.item_pekerjaan}</TableCell>
        <TableCell>{rpa.lokasi_proyek || '-'}</TableCell>
        <TableCell>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
            {sc.label}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {isAdmin && status === 'digunakan' && (
              <Button
                size="sm"
                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Tandai RPA ${rpa.rpa_id} sebagai selesai? Status semua alat akan kembali menjadi "Aktif".`)) {
                    completeRPA(rpa.id!);
                  }
                }}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Sudah Selesai
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
          <TableCell colSpan={6} className="p-0 bg-gray-50 border-b">
            <div className="px-6 py-3">
              <p className="text-sm font-semibold text-gray-600 mb-2">Daftar Alat dalam RPA ini:</p>
              {details.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Tidak ada data alat.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-4 font-medium text-gray-500">No. Lambung</th>
                      <th className="text-left py-1 pr-4 font-medium text-gray-500">Nama Alat</th>
                      <th className="text-left py-1 pr-4 font-medium text-gray-500">Uraian Pekerjaan</th>
                      <th className="text-left py-1 pr-4 font-medium text-gray-500">Periode Mulai</th>
                      <th className="text-left py-1 pr-4 font-medium text-gray-500">Periode Selesai</th>
                      <th className="text-left py-1 font-medium text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((d: any) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-1.5 pr-4">{d.no_lambung || '-'}</td>
                        <td className="py-1.5 pr-4">{d.nama_alat || '-'}</td>
                        <td className="py-1.5 pr-4">{d.uraian_pekerjaan || '-'}</td>
                        <td className="py-1.5 pr-4">
                          {d.mulai_tanggal ? formatDateDisplay(d.mulai_tanggal) : '-'}
                        </td>
                        <td className="py-1.5 pr-4">
                          {d.selesai_tanggal ? formatDateDisplay(d.selesai_tanggal) : '-'}
                        </td>
                        <td className="py-1.5">{d.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function RiwayatPenggunaanAlat() {
  const { data: rpaList, isLoading } = useRPAWithDetails();
  const { can_approve: isAdmin } = usePagePermission('riwayatPenggunaanAlat');

  const [filter, setFilter] = useState<'semua' | 'digunakan' | 'selesai'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = filter === 'semua'
    ? rpaList
    : rpaList.filter(r => r.status === filter);

  const totalPages = getTotalPages(filtered.length, pageSize);
  const paginatedData = paginateData(filtered, currentPage, pageSize);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Penggunaan Alat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar RPA yang sedang digunakan atau sudah selesai
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex flex-wrap rounded-md shadow-sm" role="group">
          {(['semua', 'digunakan', 'selesai'] as const).map(f => (
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
              {f === 'semua' ? 'Semua' : f === 'digunakan' ? 'Sedang Digunakan' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar RPA{' '}
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
              Tidak ada data riwayat penggunaan alat.
            </div>
          ) : (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. RPA</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Item Pekerjaan</TableHead>
                    <TableHead>Lokasi Proyek</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {paginatedData.map(rpa => (
                    <RPAHistoryRow key={rpa.id} rpa={rpa} isAdmin={isAdmin} />
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

