/**
 * Role-Based Access Control (RBAC) Configuration
 * Mendefinisikan setiap role dan permissions-nya
 */

export type UserRole = 'admin' | 'commentator' | 'viewer';

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  [key: string]: Permission;
}

/**
 * Definisi semua halaman sistem untuk Manajemen Akses
 */
export const ALL_PAGES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'dataAlatBerat', label: 'Data Alat Berat' },
  { key: 'dataAlatPendukung', label: 'Data Alat Pendukung' },
  { key: 'sewaAlatEksternal', label: 'Sewa Alat' },
  { key: 'rpa', label: 'RPA' },
  { key: 'riwayatPenggunaanAlat', label: 'Riwayat Penggunaan Alat' },
  { key: 'pemutihanAlat', label: 'Persetujuan Pemutihan' },
  { key: 'pemutihan', label: 'Data Pemutihan' },
  { key: 'kegiatanMekanik', label: 'Kegiatan Mekanik' },
  { key: 'stockSparepart', label: 'Stock Sparepart' },
  { key: 'ppa', label: 'PPA' },
  { key: 'formPerbaikan', label: 'Form Perbaikan' },
  { key: 'stockBBM', label: 'Stock BBM' },
  { key: 'stockOli', label: 'Stock Oli' },
  { key: 'timeSheet', label: 'Time Sheet' },
  { key: 'system', label: 'System' },
];

/**
 * Semua jenis permission yang tersedia
 */
export const ALL_PERMISSION_TYPES: { key: string; label: string }[] = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_export_excel', label: 'Export Excel' },
  { key: 'can_export_pdf', label: 'Export PDF' },
  { key: 'can_import', label: 'Import' },
  { key: 'can_approve', label: 'Approve' },
  { key: 'can_print', label: 'Print' },
];

/**
 * Definisi akses untuk setiap role
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    // Dashboard
    dashboard: { view: true, create: true, edit: true, delete: true },

    // Data Alat Berat
    dataAlatBerat: { view: true, create: true, edit: true, delete: true },
    dataAlatPendukung: { view: true, create: true, edit: true, delete: true },
    sewaAlatEksternal: { view: true, create: true, edit: true, delete: true },
    rpa: { view: true, create: true, edit: true, delete: true },
    riwayatPenggunaanAlat: { view: true, create: true, edit: true, delete: true },
    pemutihanAlat: { view: true, create: true, edit: true, delete: true },
    pemutihan: { view: true, create: true, edit: true, delete: true },

    // Laporan Perbaikan
    formPerbaikan: { view: true, create: true, edit: true, delete: true },
    stockSparepart: { view: true, create: true, edit: true, delete: true },
    ppa: { view: true, create: true, edit: true, delete: true },
    kegiatanMekanik: { view: true, create: true, edit: true, delete: true },

    // Laporan Bulanan
    stockBBM: { view: true, create: true, edit: true, delete: true },
    stockOli: { view: true, create: true, edit: true, delete: true },
    timeSheet: { view: true, create: true, edit: true, delete: true },

    // System (admin only)
    system: { view: true, create: true, edit: true, delete: true },
    userManagement: { view: true, create: true, edit: true, delete: true },
  },

  commentator: {
    // Dashboard
    dashboard: { view: true, create: false, edit: false, delete: false },

    // Data Alat Berat - Hanya view
    dataAlatBerat: { view: true, create: false, edit: false, delete: false },
    dataAlatPendukung: { view: true, create: false, edit: false, delete: false },
    sewaAlatEksternal: { view: true, create: false, edit: false, delete: false },
    rpa: { view: true, create: false, edit: false, delete: false },
    riwayatPenggunaanAlat: { view: true, create: false, edit: false, delete: false },
    pemutihanAlat: { view: true, create: true, edit: true, delete: false },
    pemutihan: { view: true, create: false, edit: false, delete: false },

    // Laporan Perbaikan - Bisa create dan edit
    formPerbaikan: { view: true, create: true, edit: true, delete: false },
    stockSparepart: { view: true, create: false, edit: false, delete: false },
    ppa: { view: true, create: true, edit: true, delete: false },
    kegiatanMekanik: { view: true, create: true, edit: true, delete: false },

    // Laporan Bulanan - Hanya view
    stockBBM: { view: true, create: false, edit: false, delete: false },
    stockOli: { view: true, create: false, edit: false, delete: false },
    timeSheet: { view: true, create: false, edit: false, delete: false },

    // System - No access
    system: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
  },

  viewer: {
    // Viewer bisa MELIHAT semua halaman
    dashboard: { view: true, create: false, edit: false, delete: false },
    dataAlatBerat: { view: true, create: false, edit: false, delete: false },
    dataAlatPendukung: { view: true, create: false, edit: false, delete: false },
    sewaAlatEksternal: { view: true, create: false, edit: false, delete: false },
    rpa: { view: true, create: false, edit: false, delete: false },
    riwayatPenggunaanAlat: { view: true, create: false, edit: false, delete: false },
    pemutihanAlat: { view: true, create: false, edit: false, delete: false },
    pemutihan: { view: true, create: false, edit: false, delete: false },
    formPerbaikan: { view: true, create: false, edit: false, delete: false },
    stockSparepart: { view: true, create: false, edit: false, delete: false },
    ppa: { view: true, create: false, edit: false, delete: false },
    kegiatanMekanik: { view: true, create: false, edit: false, delete: false },
    stockBBM: { view: true, create: false, edit: false, delete: false },
    stockOli: { view: true, create: false, edit: false, delete: false },
    timeSheet: { view: true, create: false, edit: false, delete: false },

    // System - No access
    system: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
  },
};

/**
 * Template permission per role untuk Manajemen Akses User
 * Digunakan saat "Reset ke Template Role"
 */
export const ROLE_PERMISSION_TEMPLATE: Record<UserRole, Record<string, Record<string, boolean>>> = {
  admin: Object.fromEntries(
    ALL_PAGES.map(p => [p.key, {
      can_view: true, can_create: true, can_edit: true, can_delete: true,
      can_export_excel: true, can_export_pdf: true, can_import: true,
      can_approve: true, can_print: true,
    }])
  ),
  commentator: Object.fromEntries(
    ALL_PAGES.map(p => {
      const isSystem = p.key === 'system';
      const canWrite = ['formPerbaikan', 'ppa', 'kegiatanMekanik'].includes(p.key);
      return [p.key, {
        can_view: !isSystem,
        can_create: canWrite,
        can_edit: canWrite,
        can_delete: false,
        can_export_excel: false,
        can_export_pdf: false,
        can_import: false,
        can_approve: false,
        can_print: canWrite,
      }];
    })
  ),
  viewer: Object.fromEntries(
    ALL_PAGES.map(p => [p.key, {
      can_view: p.key !== 'system',
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_export_excel: false,
      can_export_pdf: false,
      can_import: false,
      can_approve: false,
      can_print: p.key !== 'system',
    }])
  ),
};

/**
 * Deskripsi role untuk ditampilkan di UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Admin dapat mengakses semua fitur, membuat, mengedit, dan menghapus data',
  commentator: 'Commentator dapat melihat data, membuat laporan perbaikan dan kegiatan mekanik',
  viewer: 'Viewer hanya dapat melihat semua data tanpa dapat membuat atau mengedit',
};

/**
 * Cek apakah user memiliki permission untuk melakukan action
 */
export const hasPermission = (
  role: UserRole | undefined,
  resource: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean => {
  const effectiveRole = role || 'viewer';
  const rolePerms = ROLE_PERMISSIONS[effectiveRole as UserRole];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms[action] === true;
};

/**
 * Get all accessible resources untuk user dengan role tertentu
 */
export const getAccessibleResources = (role: UserRole): string[] => {
  const rolePerms = ROLE_PERMISSIONS[role];
  return Object.keys(rolePerms).filter(resource => rolePerms[resource].view);
};

/**
 * Menu items untuk ditampilkan berdasarkan role
 */
export const ROLE_MENU_ACCESS: Record<UserRole, string[]> = {
  admin: [
    'dashboard',
    'dataAlatBerat',
    'dataAlatPendukung',
    'sewaAlatEksternal',
    'rpa',
    'riwayatPenggunaanAlat',
    'formPerbaikan',
    'stockSparepart',
    'ppa',
    'kegiatanMekanik',
    'stockBBM',
    'stockOli',
    'timeSheet',
    'system',
    'manajemenUser',
    'manajemenAksesUser',
    'auditLog',
    'loginHistory',
  ],
  commentator: [
    'dashboard',
    'dataAlatBerat',
    'formPerbaikan',
    'kegiatanMekanik',
    'ppa',
  ],
  viewer: [
    'dashboard',
    'dataAlatBerat',
    'dataAlatPendukung',
    'sewaAlatEksternal',
    'rpa',
    'riwayatPenggunaanAlat',
    'formPerbaikan',
    'stockSparepart',
    'ppa',
    'kegiatanMekanik',
    'stockBBM',
    'stockOli',
    'timeSheet',
  ],
};

/**
 * Helper functions untuk UI-level access control
 */

export const shouldShowActionColumn = (role: UserRole | undefined, resource: string): boolean => {
  const effectiveRole = role || 'viewer';
  const permission = ROLE_PERMISSIONS[effectiveRole as UserRole]?.[resource];
  return permission ? (permission.edit || permission.delete) : false;
};

export const shouldShowCreateButton = (role: UserRole | undefined, resource: string): boolean => {
  return hasPermission(role, resource, 'create');
};

export const shouldShowEditButton = (role: UserRole | undefined, resource: string): boolean => {
  return hasPermission(role, resource, 'edit');
};

export const shouldShowDeleteButton = (role: UserRole | undefined, resource: string): boolean => {
  return hasPermission(role, resource, 'delete');
};
