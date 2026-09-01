import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { ALL_PAGES, ROLE_PERMISSION_TEMPLATE, UserRole } from '../utils/rolePermissions';
import { invalidateUserPermissionCache } from './useCurrentUserPermissions';



const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface UserPermission {
  id?: string;
  user_id: string;
  page_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export_excel: boolean;
  can_export_pdf: boolean;
  can_import: boolean;
  can_approve: boolean;
  can_print: boolean;
}

// Struktur flat map: { page_key: { can_view: bool, ... } }
export type PermissionMap = Record<string, Omit<UserPermission, 'id' | 'user_id' | 'page_key'>>;

function defaultPermissionMap(): PermissionMap {
  return Object.fromEntries(
    ALL_PAGES.map(p => [p.key, {
      can_view: false, can_create: false, can_edit: false, can_delete: false,
      can_export_excel: false, can_export_pdf: false, can_import: false,
      can_approve: false, can_print: false,
    }])
  );
}

function rowsToMap(rows: UserPermission[]): PermissionMap {
  const map = defaultPermissionMap();
  for (const row of rows) {
    if (map[row.page_key] !== undefined) {
      map[row.page_key] = {
        can_view: Boolean(row.can_view),
        can_create: Boolean(row.can_create),
        can_edit: Boolean(row.can_edit),
        can_delete: Boolean(row.can_delete),
        can_export_excel: Boolean(row.can_export_excel),
        can_export_pdf: Boolean(row.can_export_pdf),
        can_import: Boolean(row.can_import),
        can_approve: Boolean(row.can_approve),
        can_print: Boolean(row.can_print),
      };
    }
  }
  return map;
}

export const useUserPermissions = () => {
  const [permissionMap, setPermissionMap] = useState<PermissionMap>(defaultPermissionMap());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserPermissions = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Gunakan endpoint backend yang JOIN user_permissions dengan permissions
      // agar page_key (page_name) dikembalikan dengan benar
      const res = await fetch(`${API_URL}/api/system/user-permissions/${userId}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error.message);

      const data: UserPermission[] = json.data || [];

      if (data.length === 0) {
        setPermissionMap(defaultPermissionMap());
      } else {
        setPermissionMap(rowsToMap(data));
      }
    } catch (e: any) {
      console.error('fetchUserPermissions error:', e.message);
      setPermissionMap(defaultPermissionMap());
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUserPermissions = useCallback(async (userId: string, map: PermissionMap) => {
    setLoading(true);
    try {
      const permissions = Object.entries(map).map(([page_key, perms]) => ({
        page_key,
        ...perms,
      }));

      const res = await fetch(`${API_URL}/api/system/save-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, permissions }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      // Invalidate cache so NavBar re-fetches fresh permissions
      invalidateUserPermissionCache(userId);

      // Log audit
      await logAudit('Manajemen Akses User', 'Permission Change', `Update permission user_id: ${userId}`);

      toast({ title: 'Berhasil', description: 'Permission user berhasil disimpan.' });
      return true;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const copyPermissionsFromUser = useCallback(async (fromUserId: string, _toUserId: string) => {
    setLoading(true);
    try {
      // Ambil permission dari user sumber langsung melalui API MySQL
      const res = await fetch(`${API_URL}/api/system/user-permissions/${fromUserId}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error.message);

      const data: UserPermission[] = json.data || [];
      const sourceMap = rowsToMap(data);
      setPermissionMap(sourceMap);

      toast({ title: 'Permission disalin', description: 'Silakan simpan untuk menerapkan perubahan.' });
      return sourceMap;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);


  const resetToRoleTemplate = useCallback(async (role: UserRole) => {
    const template = ROLE_PERMISSION_TEMPLATE[role];
    if (!template) return;
    // Convert template format to PermissionMap format
    const map = defaultPermissionMap();
    for (const page of ALL_PAGES) {
      if (template[page.key]) {
        map[page.key] = {
          can_view: template[page.key].can_view ?? false,
          can_create: template[page.key].can_create ?? false,
          can_edit: template[page.key].can_edit ?? false,
          can_delete: template[page.key].can_delete ?? false,
          can_export_excel: template[page.key].can_export_excel ?? false,
          can_export_pdf: template[page.key].can_export_pdf ?? false,
          can_import: template[page.key].can_import ?? false,
          can_approve: template[page.key].can_approve ?? false,
          can_print: template[page.key].can_print ?? false,
        };
      }
    }
    setPermissionMap(map);
    toast({ title: 'Template diterapkan', description: `Permission direset ke template role ${role}. Silakan simpan.` });
  }, [toast]);

  const updateLocalPermission = useCallback((pageKey: string, permKey: string, value: boolean) => {
    setPermissionMap(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [permKey]: value,
      },
    }));
  }, []);

  return {
    permissionMap,
    loading,
    fetchUserPermissions,
    saveUserPermissions,
    copyPermissionsFromUser,
    resetToRoleTemplate,
    updateLocalPermission,
  };
};

async function logAudit(module: string, activity: string, detail: string) {
  try {
    const rawSession = localStorage.getItem('mwt_local_auth_user_v1') || localStorage.getItem('user');
    if (!rawSession) return;
    const u = JSON.parse(rawSession);
    const { v4: uuidv4 } = await import('uuid');
    await fetch(`${API_URL}/api/audit_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uuidv4(),
        user_id: u.id,
        username: u.username,
        module,
        activity,
        detail,
        created_at: new Date().toISOString(),
      }),
    });
  } catch { /* non-critical */ }
}
