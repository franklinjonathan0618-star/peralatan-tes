// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Search, RefreshCw, LogIn, LogOut, History, Trash2 } from 'lucide-react';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

const ITEMS_PER_PAGE = 25;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function calcDuration(loginAt: string, logoutAt: string | null): string {
  if (!logoutAt) return '-';
  const diff = new Date(logoutAt).getTime() - new Date(loginAt).getTime();
  if (diff < 0) return '-';
  const mins = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours > 0) return `${hours}j ${rem}m`;
  return `${mins}m`;
}

const LoginHistory = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { histories, loading, error, totalCount, fetchLoginHistory, cleanupOldHistories } = useLoginHistory();

  const [searchUser, setSearchUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const handleCleanup = async () => {
    if (!window.confirm('Hapus semua riwayat login yang lebih lama dari 90 hari? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsCleaning(true);
    const deleted = await cleanupOldHistories(90);
    setIsCleaning(false);
    if (deleted > 0) {
      alert(`${deleted} riwayat berhasil dihapus.`);
      fetchLoginHistory();
    } else {
      alert('Tidak ada riwayat yang lebih lama dari 90 hari.');
    }
  };

  const filtered = histories.filter(h =>
    !searchUser || h.username?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>System</span><span>/</span><span>Login History</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Login History</h1>
              <p className="text-gray-500 text-sm mt-1">
                Menampilkan {filtered.length} dari {totalCount} riwayat login
                {totalCount >= 500 && <span className="ml-1 text-amber-500 font-medium">(dibatasi 500 terbaru)</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleCleanup} disabled={isCleaning || loading}
                className="text-red-500 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                <Trash2 className={`h-4 w-4 mr-1 ${isCleaning ? 'animate-spin' : ''}`} />
                Hapus Riwayat &gt; 90 Hari
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchLoginHistory()} disabled={loading}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500 mb-1 block">Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Username..." value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setCurrentPage(1); }}
                  className="pl-9 h-9 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{histories.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Login</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {new Set(histories.map(h => h.username)).size}
            </div>
            <div className="text-xs text-gray-500 mt-1">User Unik</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {histories.filter(h => {
                const d = new Date(h.login_at);
                const today = new Date();
                return d.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Login Hari Ini</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">
              {histories.filter(h => !h.logout_at).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Sesi Aktif</div>
          </div>
        </div>

        {/* Table */}
        <TableScrollWrapper className="rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>User</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Logout</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Memuat data...
                </TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-16 text-gray-400">
                  <History className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p>Belum ada riwayat login</p>
                </TableCell></TableRow>
              ) : paginated.map((h, idx) => (
                <TableRow key={h.id || idx} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium text-gray-900">{h.username || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <LogIn className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">{formatDate(h.login_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {h.logout_at ? (
                      <div className="flex items-center gap-1.5">
                        <LogOut className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600">{formatDate(h.logout_at)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Belum logout</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{calcDuration(h.login_at, h.logout_at)}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{h.ip_address || '-'}</TableCell>
                  <TableCell>
                    {h.logout_at ? (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">Selesai</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Aktif</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages}</span>
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

export default LoginHistory;
