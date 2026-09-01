# 📋 Dokumentasi Sistem Login & Role-Based Access Control (RBAC)

## 1. Overview
Sistem telah diupdate dengan fitur login/register lengkap dan role-based access control yang memfilter menu berdasarkan role pengguna.

## 2. Demo Akun yang Tersedia

### Admin (Akses Penuh)
- **Username:** `admin`
- **Password:** `admin123`
- **Akses:** Semua fitur, dapat membuat/edit/hapus data

### Commentator (Commentator Laporan)  
- **Username:** `commentator`
- **Password:** `commentator123`
- **Akses:** Dashboard, Data Alat, Form Perbaikan, Kegiatan Mekanik, PPA
- **Fungsi:** Dapat membuat laporan perbaikan dan kegiatan mekanik

### Viewer (Hanya Lihat)
- **Username:** `viewer`
- **Password:** `viewer123`
- **Akses:** Dashboard, Data Alat, Form Perbaikan, Stock BBM/Oli
- **Fungsi:** Hanya dapat melihat data, tidak bisa membuat/edit

## 3. Struktur File Baru

```
src/
├── pages/
│   ├── LoginRegister.tsx        # ✨ BARU: Halaman Login/Register dengan tabs
│   └── Login.tsx                # ❌ LAMA (dapat dihapus)
├── hooks/
│   └── useCurrentUser.ts        # ✨ BARU: Hook untuk membaca user dari localStorage
├── utils/
│   ├── rolePermissions.ts       # ✨ BARU: Definisi permissions untuk setiap role
│   └── withTimeout.ts           # Ada: Fast-fail timeout untuk queries
└── components/
    ├── NavBar.tsx               # ✅ UPDATED: Menampilkan user info & filter menu
    └── ProtectedRoute.tsx        # Sama: Melindungi routes
```

## 4. Role Permissions Detail

### ADMIN - Akses Penuh Ke Semua Fitur
| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Data Alat Berat | ✅ | ✅ | ✅ | ✅ |
| Data Alat Pendukung | ✅ | ✅ | ✅ | ✅ |
| Sewa Alat Eksternal | ✅ | ✅ | ✅ | ✅ |
| RPA | ✅ | ✅ | ✅ | ✅ |
| Form Perbaikan | ✅ | ✅ | ✅ | ✅ |
| Stock Sparepart | ✅ | ✅ | ✅ | ✅ |
| PPA | ✅ | ✅ | ✅ | ✅ |
| Kegiatan Mekanik | ✅ | ✅ | ✅ | ✅ |
| Stock BBM | ✅ | ✅ | ✅ | ✅ |
| Stock Oli | ✅ | ✅ | ✅ | ✅ |
| Time Sheet | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ✅ | ✅ | ✅ |

### COMMENTATOR - Pembuat Laporan Perbaikan
| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Data Alat Berat | ✅ | ❌ | ❌ | ❌ |
| Form Perbaikan | ✅ | ✅ | ✅ | ❌ |
| PPA | ✅ | ✅ | ✅ | ❌ |
| Kegiatan Mekanik | ✅ | ✅ | ✅ | ❌ |
| Lainnya | ❌ | ❌ | ❌ | ❌ |

### VIEWER - Hanya Melihat Data
| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Data Alat Berat | ✅ | ❌ | ❌ | ❌ |
| Data Alat Pendukung | ✅ | ❌ | ❌ | ❌ |
| Form Perbaikan | ✅ | ❌ | ❌ | ❌ |
| Stock BBM | ✅ | ❌ | ❌ | ❌ |
| Stock Oli | ✅ | ❌ | ❌ | ❌ |
| Lainnya | ❌ | ❌ | ❌ | ❌ |

## 5. Fitur Halaman Login/Register

### Tab Login
- Input username dan password
- Pre-filled dengan demo account untuk testing
- Info box menampilkan semua demo credentials
- Show/Hide password toggle
- Error handling yang jelas

### Tab Daftar (Register)
- Form lengkap: Nama, Username, Email, Password, Confirm Password
- Pemilihan role (Admin, Commentator, Viewer)
- Validasi password minimum 6 karakter
- Validasi email format
- Deskripsi role yang ditampilkan dinamis
- Show/Hide password toggle untuk kedua field password

## 6. User Info Display

Di navbar sebelah kanan (desktop):
```
┌─────────────────────┐
│ 👤 Admin            │
│    ADMIN (role)     │
│ [Logout button]     │
└─────────────────────┘
```

Menampilkan:
- Avatar/Icon dengan color background
- Nama lengkap user
- Badge role (Admin, Commentator, Viewer)
- Logout button

## 7. Menu Filtering

Menu di NavBar otomatis di-filter berdasarkan role:

**Admin melihat:**
- Dashboard
- Laporan Alat (4 submenu)
- Laporan Perbaikan (4 submenu)
- Laporan Bulanan (3 submenu)
- ✅ Semua 11 submenu

**Commentator melihat:**
- Dashboard
- Data Alat Berat
- Form Perbaikan
- PPA
- Kegiatan Mekanik
- ✅ 5 menu items

**Viewer melihat:**
- Dashboard
- Data Alat Berat
- Data Alat Pendukung
- Form Perbaikan
- Stock BBM
- Stock Oli
- ✅ 6 menu items

## 8. Cara Implementasi di Code

### Membaca User Saat Ini
```typescript
import { getCurrentUser } from '@/hooks/useCurrentUser';

const user = getCurrentUser();
console.log(user.full_name, user.role);
```

### Cek Permission User
```typescript
import { hasPermission } from '@/utils/rolePermissions';

const canDelete = hasPermission(user.role, 'FormPerbaikan', 'delete');
if (canDelete) {
  // Tampilkan delete button
}
```

### Filter Menu Berdasarkan Role
NavBar sudah melakukan ini otomatis via `getAccessibleMenuItems()`

## 9. Data Tersimpan

User data disimpan di **localStorage**:
```json
{
  "id": "user-admin",
  "username": "admin",
  "email": "admin@example.com",
  "full_name": "Admin",
  "role": "admin"
}
```

**Key di localStorage:**
- `isAuthenticated`: 'true' (boolean check)
- `user`: stringified JSON user object

## 10. Testing Checklist

- [ ] Login dengan admin/admin123 → Lihat dashboard
- [ ] Login dengan commentator/commentator123 → Menu terbatas
- [ ] Login dengan viewer/viewer123 → Menu paling terbatas
- [ ] Daftar akun baru dengan role berbeda
- [ ] Periksa navbar menampilkan nama & role
- [ ] Klik logout → Kembali ke login
- [ ] Cek refresh page → User info masih ada (dari localStorage)
- [ ] Buka DevTools → Lihat localStorage data

## 11. Pesan Penting

⚠️ **Catatan Keamanan:**
- Saat ini menggunakan localStorage (bukan secure)
- Username/password adalah demo (hardcoded untuk testing)
- Untuk production, integrate dengan backend authentication proper
- Gunakan JWT tokens dan secure session management

## 12. Next Steps (Opsional)

Untuk development lebih lanjut:
1. **Backend integration:** Connect dengan database real untuk user management
2. **JWT tokens:** Implement proper token-based authentication
3. **Advance permissions:** Tambah permission per field/action granular
4. **Audit logging:** Track user actions dan perubahan data
5. **Email verification:** Validasi email saat register
6. **2FA:** Two-factor authentication untuk security lebih tinggi

---

**Build Status:** ✅ Sukses - 3798 modules  
**Last Updated:** March 4, 2026  
**Version:** 1.1.0 (dengan RBAC)
