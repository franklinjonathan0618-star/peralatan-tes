# 📋 Implementasi Sistem Login & Register Supabase

## ✅ Status Implementasi

Sistem login dan register telah dimodifikasi untuk menggunakan **Supabase Authentication** dengan integrasi penuh ke table `profiles`.

---

## 📊 Struktur Database (Table: profiles)

```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,                    -- User ID dari auth.users
  username TEXT NOT NULL UNIQUE,                   -- Username untuk login alternatif
  full_name TEXT,                                  -- Nama lengkap pengguna
  role TEXT NOT NULL DEFAULT 'viewer',             -- Role: admin, commentator, viewer
  email TEXT,                                      -- Email pengguna
  created_at TIMESTAMP DEFAULT NOW(),              -- Waktu pembuatan
  updated_at TIMESTAMP DEFAULT NOW(),              -- Waktu update terakhir
  CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'viewer', 'commentator'))
);

-- Index untuk performa
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
```

---

## 🔐 Fitur Login

### Cara Kerja:

1. **Input Fleksibel**: User bisa login pakai **email** atau **username**
2. **Lookup Username**: Jika input adalah username, sistem mencari email dari table profiles
3. **Validasi Supabase**: Email+password divalidasi melalui `supabase.auth.signInWithPassword()`
4. **Load Profile**: Profile data dimuat ke `AuthContext` untuk digunakan di aplikasi

### Contoh Flow:

```
Input: "admin"
   ↓
Cek table profiles → ambil email (admin@email.com)
   ↓
signInWithPassword(email: "admin@email.com", password: "admin123")
   ↓
Login berhasil → Load profile data
   ↓
Redirect ke Dashboard
```

---

## 📝 Fitur Register

### Validasi Input:

- ✅ Semua field required (nama, username, email, password)
- ✅ Password minimal 6 karakter
- ✅ Username: 3+ karakter, alphanumeric + underscore only
- ✅ Email: format valid (contains @ dan .)
- ✅ Password confirmation harus match
- ✅ Username unik (check di database)
- ✅ Email unik (enforced by auth.users)

### Cara Kerja Register:

1. **Check Username Duplication**: Query profiles table untuk cek username unik
2. **Supabase Sign Up**: Buat auth user dengan `supabase.auth.signUp()`
3. **Create Profile**: Insert/upsert data ke table profiles
4. **Email Confirmation**: Supabase kirim confirmation email
5. **Auto Logout**: Logout setelah register, user perlu login di tab Login

### Error Handling:

```
Username sudah dipakai
  ↓ Error: "Username sudah dipakai. Silakan pilih username lain."

Email sudah terdaftar
  ↓ Error: "Email sudah terdaftar. Silakan gunakan email lain atau login."

Rate limit
  ↓ Error: "Terlalu banyak percobaan. Silakan tunggu beberapa menit..."

Password tidak match
  ↓ Error: "Password dan konfirmasi password harus sama."
```

---

## 🔄 Data Flow Diagram

### Login Flow:

```
LoginRegister.tsx
    ↓
handleLogin()
    ├─ Input: username atau email
    ├─ If username: Query profiles → ambil email
    ├─ signInWithPassword(email, password)
    ├─ Login success: call AuthContext.login()
    └─ Redirect ke /dashboard
```

### Register Flow:

```
LoginRegister.tsx
    ↓
handleRegister()
    ├─ Validasi input
    ├─ Check username di profiles
    ├─ supabase.auth.signUp()
    ├─ Insert/Upsert ke profiles table
    ├─ Sign out
    ├─ Show success message
    └─ Switch ke tab Login
```

---

## 📦 File yang Dimodifikasi

### [LoginRegister.tsx](src/pages/LoginRegister.tsx)

**Perubahan:**

- ✅ Refactor `handleLogin()`: support email/username lookup
- ✅ Refactor `handleRegister()`: validasi username unik + email confirmation
- ✅ Tambah state: `emailConfirmationSent`
- ✅ Tambah validasi: username format, min length
- ✅ Improve UI: info Supabase active, better error messages
- ✅ Support disabled state saat loading

### Dependencies yang Digunakan:

- `supabase.from('profiles')`: Query/insert profiles data
- `supabase.auth.signInWithPassword()`: Login dengan email+password
- `supabase.auth.signUp()`: Register user baru
- `supabase.auth.signOut()`: Logout setelah register
- `useAuth()` from AuthContext: Manage user state

---

## 🧪 Testing

### Test Case: Login

#### ✅ Login dengan Email:

```
1. Klik tab Login
2. Input: admin@email.com
3. Password: admin123
4. Klik Login
5. Expected: Redirect ke Dashboard ✓
```

#### ✅ Login dengan Username:

```
1. Klik tab Login
2. Input: admin
3. Password: admin123
4. Klik Login
5. Expected: Lookup email → Login berhasil → Redirect ke Dashboard ✓
```

#### ❌ Login Gagal (Invalid):

```
1. Input: invalid_username
2. Password: wrong123
3. Klik Login
4. Expected: Error message "Username atau password salah." ✓
```

---

### Test Case: Register

#### ✅ Register Sukses:

```
1. Klik tab Daftar
2. Isi form:
   - Nama: John Doe
   - Username: john_doe
   - Email: john@email.com
   - Password: password123
   - Confirm: password123
   - Role: Viewer
3. Klik Daftar
4. Expected: Success message → Switch ke tab Login ✓
5. Bisa login dengan email: john@email.com atau username: john_doe
```

#### ❌ Register Gagal (Username Duplikat):

```
1. Isi form dengan username yang sudah ada
2. Klik Daftar
3. Expected: Error "Username sudah dipakai..." ✓
```

#### ❌ Register Gagal (Email Invalid):

```
1. Isi email: invalidemail
2. Klik Daftar
3. Expected: Error "Email tidak valid..." ✓
```

#### ❌ Register Gagal (Password Pendek):

```
1. Isi password: 123
2. Klik Daftar
3. Expected: Error "Password harus minimal 6 karakter." ✓
```

---

## 🔧 Konfigurasi Supabase

### Environment Variables (harus ada di .env):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### RLS Policies (Row Level Security):

Untuk production, pastikan ada policies yang tepat:

```sql
-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public dapat read semua profiles
CREATE POLICY "Public read profiles"
  ON profiles FOR SELECT
  USING (true);

-- User dapat update profile sendiri
CREATE POLICY "User update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only auth users dapat insert
CREATE POLICY "Auth users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## 🚨 Troubleshooting

### Error: "infinite recursion detected in policy for relation 'profiles'"

**Penyebab:**

- RLS (Row Level Security) policy tidak dikonfigurasi dengan benar
- Ada policy yang circular/recursive saat check table lain
- Policy terlalu kompleks dengan nested SELECT

**Solusi:**

#### **Option 1: Quick Fix (Development)**

Disable RLS sementara untuk testing:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Kemudian test register - jika berhasil, berarti masalah ada di policy.

#### **Option 2: Proper Fix (Production)**

1. **Jalankan SQL migration:**

   ```bash
   # Copy file SQL ke Supabase
   supabase\migrations\fix_profiles_rls_policies.sql
   ```

   Atau manual di Supabase Console → SQL Editor:
   - Copy semua isi dari file `fix_profiles_rls_policies.sql`
   - Paste dan execute

2. **Verify policies:**

   ```sql
   -- Cek policies yang aktif
   SELECT * FROM pg_policies
   WHERE tablename = 'profiles';
   ```

3. **Test register:**
   - Buka aplikasi
   - Klik tab Daftar
   - Isi form dan klik Daftar
   - Seharusnya sekarang berhasil ✓

**Policy Explanation:**

| Policy                  | Action | Condition                               |
| ----------------------- | ------ | --------------------------------------- |
| Public read profiles    | SELECT | `true` (everyone bisa baca)             |
| Auth users can insert   | INSERT | `auth.uid() = id` (hanya insert own)    |
| User update own profile | UPDATE | `auth.uid() = id` (hanya update own)    |
| Admin can update any    | UPDATE | User is admin (admin bisa update semua) |
| Admin can delete any    | DELETE | User is admin (admin bisa delete semua) |

---

### 1. Demo Mode

File [AuthContext.tsx](src/contexts/AuthContext.tsx) masih memiliki **DEMO_MODE = true**

- Set ke `false` untuk production
- Demo mode bypass Supabase auth

### 2. Email Confirmation

- Supabase akan kirim confirmation email ke user baru
- Sebelum confirm, user tidak bisa login (tergantung konfigurasi)
- Configure di Supabase Console → Authentication → Email Templates

### 3. Password Requirements

- Supabase default: minimum 6 characters
- Dapat diubah di project settings

### 4. Unique Constraints

- **Username**: Unique di table profiles (checked manual + DB constraint)
- **Email**: Unique di auth.users (enforced by Supabase)

---

## 🚀 Next Steps

### Production Checklist:

- [ ] Set `DEMO_MODE = false` di AuthContext.tsx
- [ ] Configure email provider di Supabase
- [ ] Setup RLS policies untuk security
- [ ] Enable 2FA jika diperlukan
- [ ] Setup password reset flow
- [ ] Configure email templates
- [ ] Test dengan real Supabase account
- [ ] Setup domain whitelist untuk security

### Optional Enhancements:

- [ ] Social login (Google, GitHub, etc)
- [ ] Password reset via email
- [ ] Email verification before login
- [ ] Account deactivation
- [ ] Admin panel untuk manage users

---

## 📞 Support

Untuk error atau masalah:

1. Check Supabase Console logs
2. Verify environment variables
3. Check RLS policies
4. Review browser console untuk error details
