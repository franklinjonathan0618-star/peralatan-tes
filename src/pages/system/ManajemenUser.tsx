// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSystemUsers, SystemUser } from '@/hooks/useSystemUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  UserPlus, Search, RefreshCw, Edit, KeyRound, UserX, UserCheck,
  Wifi, WifiOff, Shield, User as UserIcon, Trash2
} from 'lucide-react';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  commentator: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

const emptyCreateForm = {
  username: '', full_name: '', email: '', password: '', role: 'viewer' as const, is_active: 1,
};

const ManajemenUser = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { users, loading, fetchUsers, createUser, updateUser, resetPassword, toggleUserStatus, deleteUser } = useSystemUsers();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'viewer' as const, is_active: 1 });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (u: SystemUser) => {
    setSelectedUser(u);
    setEditForm({ full_name: u.full_name, email: u.email, role: u.role, is_active: u.is_active });
    setShowEdit(true);
  };

  const handleOpenReset = (u: SystemUser) => {
    setSelectedUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowReset(true);
  };

  const handleOpenConfirmDelete = (u: SystemUser) => {
    setSelectedUser(u);
    setShowConfirmDelete(true);
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.full_name || !createForm.password) return;
    const ok = await createUser(createForm);
    if (ok) { setShowCreate(false); setCreateForm(emptyCreateForm); }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    const ok = await updateUser(selectedUser.id, editForm);
    if (ok) setShowEdit(false);
  };

  const handleReset = async () => {
    if (!selectedUser) return;
    if (newPassword !== confirmPassword) { setPasswordError('Password tidak cocok'); return; }
    if (newPassword.length < 6) { setPasswordError('Password minimal 6 karakter'); return; }
    const ok = await resetPassword(selectedUser.id, newPassword);
    if (ok) setShowReset(false);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const ok = await deleteUser(selectedUser.id, selectedUser.username);
    if (ok) setShowConfirmDelete(false);
  };

  const onlineCount = users.filter(u => u.isOnline).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>System</span><span>/</span><span>Manajemen User</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
              <p className="text-gray-500 text-sm mt-1">
                Total {users.length} user · <span className="text-green-600 font-medium">{onlineCount} online</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-4 w-4 mr-1" /> Tambah User
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari username, nama, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <TableScrollWrapper className="rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Online</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">Memuat data...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">Tidak ada data</TableCell></TableRow>
              ) : filteredUsers.map(u => (
                <TableRow key={u.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium text-gray-900">{u.username}</TableCell>
                  <TableCell>{u.full_name || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{u.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_BADGE[u.role] || ROLE_BADGE.viewer}`}>
                      <Shield className="h-3 w-3" />{u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className={u.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(u.last_login)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(u.last_activity)}</TableCell>
                  <TableCell>
                    {u.isOnline ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <Wifi className="h-3.5 w-3.5" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                        <WifiOff className="h-3.5 w-3.5" /> Offline
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit" onClick={() => handleOpenEdit(u)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Reset Password" onClick={() => handleOpenReset(u)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        onClick={() => { setSelectedUser(u); setShowDelete(true); }}>
                        {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus Permanen beserta Aktivitas" onClick={() => handleOpenConfirmDelete(u)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollWrapper>
      </div>

      {/* Dialog: Tambah User */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" /> Tambah User Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: 'Username *', key: 'username', type: 'text', placeholder: 'contoh: john_doe' },
              { label: 'Nama Lengkap *', key: 'full_name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'john@example.com' },
              { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min. 6 karakter' },
            ].map(f => (
              <div key={f.key}>
                <Label htmlFor={`create-${f.key}`} className="text-sm font-medium">{f.label}</Label>
                <Input id={`create-${f.key}`} type={f.type} placeholder={f.placeholder}
                  value={createForm[f.key]} className="mt-1"
                  onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <Label htmlFor="create-role" className="text-sm font-medium">Role *</Label>
              <Input
                id="create-role"
                type="text"
                placeholder="contoh: admin, viewer, operator..."
                value={createForm.role}
                className="mt-1"
                onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value as any }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={String(createForm.is_active)} onValueChange={v => setCreateForm(prev => ({ ...prev, is_active: Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit User */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-blue-600" /> Edit User — {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: 'Nama Lengkap', key: 'full_name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-sm font-medium">{f.label}</Label>
                <Input type={f.type} value={editForm[f.key]} className="mt-1"
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <Label htmlFor="edit-role" className="text-sm font-medium">Role</Label>
              <Input
                id="edit-role"
                type="text"
                placeholder="contoh: admin, viewer, operator..."
                value={editForm.role}
                className="mt-1"
                onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={String(editForm.is_active)} onValueChange={v => setEditForm(prev => ({ ...prev, is_active: Number(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
            <Button onClick={handleEdit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset Password */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-600" /> Reset Password — {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Password Baru</Label>
              <Input type="password" placeholder="Min. 6 karakter" value={newPassword} className="mt-1"
                onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Konfirmasi Password</Label>
              <Input type="password" placeholder="Ulangi password" value={confirmPassword} className="mt-1"
                onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset(false)}>Batal</Button>
            <Button onClick={handleReset} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? 'Mereset...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Nonaktifkan/Aktifkan User */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.is_active ? 'Nonaktifkan User?' : 'Aktifkan User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_active
                ? `User "${selectedUser?.username}" akan dinonaktifkan dan tidak bisa login. Data tidak akan dihapus.`
                : `User "${selectedUser?.username}" akan diaktifkan kembali dan bisa login.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && toggleUserStatus(selectedUser.id, !selectedUser.is_active).then(() => { setShowDelete(false); fetchUsers(); })}
              className={selectedUser?.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}>
              {selectedUser?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Hapus User Permanen (Hard Delete) */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Hapus User Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus user <strong>"{selectedUser?.username}"</strong> secara permanen beserta <strong>seluruh aktivitasnya</strong> (log audit, log aktivitas, riwayat login, permission, dan kegiatan mekanik).
              <br /><br />
              <span className="text-red-500 font-semibold">Peringatan: Tindakan ini tidak dapat dibatalkan dan semua data terkait user ini akan hilang selamanya.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDelete(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white">
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManajemenUser;
