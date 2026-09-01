// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Search, RefreshCw, ClipboardList, Trash2 } from 'lucide-react';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

const ACTIVITY_COLORS: Record<string, string> = {
  'Create': 'bg-green-100 text-green-700',
  'Update': 'bg-blue-100 text-blue-700',
  'Delete': 'bg-red-100 text-red-700',
  'Approve': 'bg-purple-100 text-purple-700',
  'Login': 'bg-teal-100 text-teal-700',
  'Logout': 'bg-gray-100 text-gray-700',
  'Permission Change': 'bg-amber-100 text-amber-700',
  'Reset Password': 'bg-orange-100 text-orange-700',
};

const MODULES = ['Semua', 'Manajemen User', 'Manajemen Akses User', 'Laporan Alat', 'Laporan Perbaikan', 'Laporan Bulanan', 'System'];
const ACTIVITIES = ['Semua', 'Create', 'Update', 'Delete', 'Approve', 'Login', 'Logout', 'Permission Change', 'Reset Password'];

const ITEMS_PER_PAGE = 25;

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const AuditLog = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { logs, loading, error, totalCount, fetchAuditLogs, cleanupOldLogs } = useAuditLog();

  const [searchUser, setSearchUser] = useState('');
  const [filterModule, setFilterModule] = useState('Semua');
  const [filterActivity, setFilterActivity] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleCleanup = async () => {
    if (!window.confirm('Hapus semua log audit yang lebih lama dari 90 hari? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsCleaning(true);
    const deleted = await cleanupOldLogs(90);
    setIsCleaning(false);
    if (deleted > 0) {
      alert(`${deleted} log berhasil dihapus.`);
      fetchAuditLogs();
    } else {
      alert('Tidak ada log yang lebih lama dari 90 hari.');
    }
  };

  const filtered = logs.filter(log => {
    const matchUser = !searchUser || log.username?.toLowerCase().includes(searchUser.toLowerCase());
    const matchModule = filterModule === 'Semua' || log.module?.includes(filterModule);
    const matchActivity = filterActivity === 'Semua' || log.activity === filterActivity;
    return matchUser && matchModule && matchActivity;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFilter = () => { setCurrentPage(1); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>System</span><span>/</span><span>Audit Log</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
              <p className="text-gray-500 text-sm mt-1">
                Menampilkan {filtered.length} dari {totalCount} aktivitas
                {totalCount >= 500 && <span className="ml-1 text-amber-500 font-medium">(dibatasi 500 terbaru)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCleanup} disabled={isCleaning || loading}
                className="text-red-500 border-red-200 hover:bg-red-50">
                <Trash2 className={`h-4 w-4 mr-1 ${isCleaning ? 'animate-spin' : ''}`} />
                Hapus Log &gt; 90 Hari
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500 mb-1 block">Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Username..." value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); handleFilter(); }}
                  className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <div className="min-w-[180px]">
              <Label className="text-xs text-gray-500 mb-1 block">Modul</Label>
              <Select value={filterModule} onValueChange={v => { setFilterModule(v); handleFilter(); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Label className="text-xs text-gray-500 mb-1 block">Aktivitas</Label>
              <Select value={filterActivity} onValueChange={v => { setFilterActivity(v); handleFilter(); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <TableScrollWrapper className="rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[160px]">Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Memuat data...
                </TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-16 text-gray-400">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>Tidak ada data audit log</p>
                </TableCell></TableRow>
              ) : paginated.map((log, idx) => (
                <TableRow key={log.id || idx} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                  <TableCell className="font-mono text-sm font-medium text-gray-800">{log.username || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{log.module || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_COLORS[log.activity] || 'bg-gray-100 text-gray-600'}`}>
                      {log.activity || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[300px] truncate" title={log.detail}>
                    {log.detail || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>‹ Prev</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, currentPage - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm"
                      onClick={() => setCurrentPage(p)} className={p === currentPage ? 'bg-blue-600 text-white' : ''}>
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>Next ›</Button>
              </div>
            </div>
          )}
        </TableScrollWrapper>
      </div>
    </div>
  );
};

export default AuditLog;
