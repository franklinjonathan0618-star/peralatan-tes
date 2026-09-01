// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSystemUsers, SystemUser } from '@/hooks/useSystemUsers';
import { useUserPermissions, PermissionMap } from '@/hooks/useUserPermissions';
import { ALL_PAGES, ALL_PERMISSION_TYPES, UserRole } from '@/utils/rolePermissions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Save, RefreshCw, Copy, RotateCcw, Shield, CheckSquare, Square
} from 'lucide-react';
import { TableScrollWrapper } from '@/components/ui/TableScrollWrapper';

const PERM_LABELS: Record<string, string> = {
  can_view: 'View', can_create: 'Create', can_edit: 'Edit', can_delete: 'Delete',
  can_export_excel: 'Excel', can_export_pdf: 'PDF', can_import: 'Import',
  can_approve: 'Approve', can_print: 'Print',
};

const ManajemenAksesUser = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { users, loading: usersLoading, fetchUsers } = useSystemUsers();
  const {
    permissionMap, loading: permLoading,
    fetchUserPermissions, saveUserPermissions,
    copyPermissionsFromUser, resetToRoleTemplate, updateLocalPermission
  } = useUserPermissions();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyFromUserId, setCopyFromUserId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const u = users.find(u => u.id === selectedUserId);
      setSelectedUser(u || null);
      fetchUserPermissions(selectedUserId);
      setHasChanges(false);
    }
  }, [selectedUserId]);

  const handleToggle = (pageKey: string, permKey: string, value: boolean) => {
    updateLocalPermission(pageKey, permKey, value);
    setHasChanges(true);
  };

  const handleToggleAll = (permKey: string, value: boolean) => {
    ALL_PAGES.forEach(p => updateLocalPermission(p.key, permKey, value));
    setHasChanges(true);
  };

  const handleToggleRow = (pageKey: string, value: boolean) => {
    ALL_PERMISSION_TYPES.forEach(pt => updateLocalPermission(pageKey, pt.key, value));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    const ok = await saveUserPermissions(selectedUserId, permissionMap);
    if (ok) setHasChanges(false);
    setIsSaving(false);
  };

  const handleCopy = async () => {
    if (!copyFromUserId) return;
    await copyPermissionsFromUser(copyFromUserId, selectedUserId);
    setShowCopyDialog(false);
    setHasChanges(true);
  };

  const handleReset = async () => {
    if (!selectedUser) return;
    await resetToRoleTemplate(selectedUser.role as UserRole);
    setHasChanges(true);
  };

  const permKeys = ALL_PERMISSION_TYPES.map(pt => pt.key);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>System</span><span>/</span><span>Manajemen Akses User</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Akses User</h1>
              <p className="text-gray-500 text-sm mt-1">Atur permission setiap user secara individual per halaman</p>
            </div>
            {selectedUserId && (
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setShowCopyDialog(true)} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <Copy className="h-4 w-4 mr-1" /> Copy dari User Lain
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto">
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset ke Template Role
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}
                  className={`flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto ${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} text-white`}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Permission'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* User Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <Label className="shrink-0 font-medium text-gray-700">Pilih User:</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="-- Pilih user untuk diatur permission-nya --" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="font-mono text-sm">{u.username}</span>
                      <span className="text-gray-500 ml-2 text-xs">({u.full_name}) · {u.role}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <Badge variant="outline" className="text-xs capitalize">{selectedUser.role}</Badge>
                {hasChanges && <span className="text-amber-600 text-xs font-medium">● Ada perubahan belum disimpan</span>}
              </div>
            )}
          </div>
        </div>

        {/* Permission Matrix */}
        {selectedUserId && (
          <TableScrollWrapper className="rounded-xl border border-gray-200">
            {permLoading ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Memuat permission...</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[200px]">
                      Halaman
                    </th>
                    {ALL_PERMISSION_TYPES.map(pt => (
                      <th key={pt.key} className="px-2 py-3 text-center font-medium text-gray-600 min-w-[70px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs">{pt.label}</span>
                          <div className="flex gap-1">
                            <button onClick={() => handleToggleAll(pt.key, true)} title="Centang semua"
                              className="text-blue-500 hover:text-blue-700">
                              <CheckSquare className="h-3 w-3" />
                            </button>
                            <button onClick={() => handleToggleAll(pt.key, false)} title="Hapus semua"
                              className="text-gray-400 hover:text-gray-600">
                              <Square className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-medium text-gray-600 min-w-[100px]">
                      <span className="text-xs">Toggle Baris</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_PAGES.map((page, idx) => {
                    const pagePerms = permissionMap[page.key] || {};
                    const allChecked = permKeys.every(k => pagePerms[k]);
                    return (
                      <tr key={page.key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/30 transition-colors`}>
                        <td className={`px-4 py-2.5 font-medium text-gray-800 sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {page.label}
                        </td>
                        {ALL_PERMISSION_TYPES.map(pt => (
                          <td key={pt.key} className="px-2 py-2.5 text-center">
                            <input
                              type="checkbox"
                              id={`perm-${page.key}-${pt.key}`}
                              checked={Boolean(pagePerms[pt.key])}
                              onChange={e => handleToggle(page.key, pt.key, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => handleToggleRow(page.key, !allChecked)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${allChecked ? 'text-red-500 hover:bg-red-50' : 'text-blue-500 hover:bg-blue-50'}`}>
                            {allChecked ? 'Hapus' : 'Semua'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </TableScrollWrapper>
        )}

        {!selectedUserId && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Pilih user terlebih dahulu</p>
            <p className="text-sm mt-1">Permission akan muncul setelah user dipilih</p>
          </div>
        )}
      </div>

      {/* Dialog: Copy Permission */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Copy className="h-5 w-5 text-blue-600" /> Copy Permission dari User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium">Salin permission dari:</Label>
            <Select value={copyFromUserId} onValueChange={setCopyFromUserId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="-- Pilih user sumber --" />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.id !== selectedUserId).map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-mono text-sm">{u.username}</span>
                    <span className="text-gray-500 ml-2 text-xs">({u.role})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">Permission akan disalin ke tampilan. Klik "Simpan" untuk menerapkan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>Batal</Button>
            <Button onClick={handleCopy} disabled={!copyFromUserId} className="bg-blue-600 hover:bg-blue-700 text-white">
              Salin Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManajemenAksesUser;
