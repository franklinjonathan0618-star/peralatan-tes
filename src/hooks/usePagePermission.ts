import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowCreateButton, shouldShowEditButton, shouldShowDeleteButton, shouldShowActionColumn, ROLE_PERMISSIONS } from '@/utils/rolePermissions';
import type { UserRole } from '@/utils/rolePermissions';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface PagePermission {
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

const ADMIN_FULL_ACCESS: PagePermission = {
  can_view: true,
  can_create: true,
  can_edit: true,
  can_delete: true,
  can_export_excel: true,
  can_export_pdf: true,
  can_import: true,
  can_approve: true,
  can_print: true,
};

/**
 * Hook untuk mengambil permission individual user dari database
 * untuk halaman tertentu.
 *
 * Priority:
 *   0. Role admin → selalu full access, ABAIKAN database (supaya perubahan role
 *      dari viewer→admin langsung berlaku tanpa perlu hapus permission lama)
 *   1. user_permissions dari database (per-user custom) — hanya untuk non-admin
 *   2. Fallback ke ROLE_PERMISSIONS jika belum ada custom permission
 */
export function usePagePermission(pageKey: string): PagePermission & { loading: boolean } {
  const { user } = useAuth();
  const [perm, setPerm] = useState<PagePermission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Admin selalu mendapat full access — jangan cek DB agar perubahan role
    // dari non-admin → admin langsung berlaku tanpa sisa permission lama.
    if (user.role === 'admin') {
      setPerm(ADMIN_FULL_ACCESS);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPerm(null); // Reset to null when fetching so PageGuard waits

    fetch(`${API_URL}/api/system/user-permissions/${user.id}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;

        const rows: Array<PagePermission & { page_key: string }> = json.data || [];
        const row = rows.find(r => r.page_key === pageKey);

        if (row) {
          // Gunakan custom permission dari database
          setPerm({
            can_view: Boolean(row.can_view),
            can_create: Boolean(row.can_create),
            can_edit: Boolean(row.can_edit),
            can_delete: Boolean(row.can_delete),
            can_export_excel: Boolean(row.can_export_excel),
            can_export_pdf: Boolean(row.can_export_pdf),
            can_import: Boolean(row.can_import),
            can_approve: Boolean(row.can_approve),
            can_print: Boolean(row.can_print),
          });
        } else {
          // Fallback ke role-based permission
          setPerm(roleBasedFallback(user.role as UserRole, pageKey));
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Error network — fallback ke role-based
        setPerm(roleBasedFallback(user.role as UserRole, pageKey));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id, user?.role, pageKey]);

  // Saat loading atau belum ada data, kembalikan role-based sementara
  const fallback = user?.role === 'admin' ? ADMIN_FULL_ACCESS : roleBasedFallback(user?.role as UserRole, pageKey);
  const resolved = perm ?? fallback;

  return { ...resolved, loading };
}

function roleBasedFallback(role: UserRole | undefined, pageKey: string): PagePermission {
  // Admin sudah ditangani sebelum fungsi ini dipanggil
  // Di sini role pasti 'commentator' | 'viewer' | undefined

  // Check role-based view permission from ROLE_PERMISSIONS
  const rolePerms = role ? ROLE_PERMISSIONS[role] : null;
  const resourcePerms = rolePerms?.[pageKey];
  const canView = resourcePerms ? resourcePerms.view : false;

  return {
    can_view: canView,
    can_create: shouldShowCreateButton(role, pageKey),
    can_edit: shouldShowEditButton(role, pageKey),
    can_delete: shouldShowDeleteButton(role, pageKey),
    can_export_excel: false,
    can_export_pdf: false,
    can_import: false,
    can_approve: false,
    can_print: role === 'viewer' || shouldShowActionColumn(role, pageKey),
  };
}
