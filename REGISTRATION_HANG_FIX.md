# 🔧 Fix: Pendaftaran Hang & Email Tidak Terkirim

## 🎯 Masalah

- Proses daftar terus berputar tanpa selesai
- Tidak ada error message yang muncul
- Email konfirmasi tidak terkirim

## 🔍 Root Cause Analysis

### 1. **Email Provider Tidak Dikonfigurasi**

Supabase memerlukan email provider untuk mengirim confirmation email. Tanpa konfigurasi, `signUp()` akan hang mencoba mengirim email yang gagal.

### 2. **Timeout Tidak Ada pada signUp() Call**

Fungsi `signUp()` di LoginRegister.tsx tidak memiliki timeout, jadi akan hang selamanya.

### 3. **Infinite Loop di loadUserProfile()**

Ada retry logic yang bisa menyebabkan hang jika profile tidak ditemukan.

---

## ✅ Solusi Lengkap

### OPSI 1: Nonaktifkan Email Verification (CEPAT - untuk Development)

**Langkah di Supabase Dashboard:**

1. Buka https://app.supabase.com
2. Select project Anda
3. Go to **Authentication** → **Providers** → **Email**
4. Scroll ke **Confirm email**
5. **Uncheck: "Confirm email"** checkbox
6. Click **Save**

**Hasil:**

- Akun langsung aktif tanpa perlu email confirmation
- Proses daftar akan cepat selesai
- User bisa langsung login setelah register

---

### OPSI 2: Setup Email Provider (untuk Production)

Pilih salah satu:

#### A. Gunakan Supabase Email (LIMITED - 4 email/jam saja)

1. Auth → Providers → Email
2. Pilih **"Supabase"** di Email Provider
3. Ini sudah enable otomatis, tapi limited

#### B. Setup SendGrid (RECOMMENDED)

1. Buat account di https://sendgrid.com
2. Buat API Key
3. Di Supabase: Auth → Providers → Email
4. Select **"SendGrid"**
5. Paste API Key Anda
6. Click Save

#### C. Setup Custom SMTP

1. Di Supabase: Auth → Providers → Email
2. Select **"SMTP"**
3. Fill in your SMTP details:
   - Host
   - Port (587 atau 465)
   - Username
   - Password
4. Click Save

---

### OPSI 3: Add Timeout ke signUp() (Untuk Mencegah Hang)

Edit file [src/pages/LoginRegister.tsx](src/pages/LoginRegister.tsx):

**Tambahkan timeout handler:**

```typescript
// Tempat ini di dalam function handleRegister, sebelum signUp call:

// Step 2: Sign up user with Supabase Auth
// TAMBAHKAN TIMEOUT PROTECTION
const signUpPromise = supabase.auth.signUp({
  email: registerEmail,
  password: registerPassword,
  options: {
    data: {
      username: registerUsername.toLowerCase(),
      full_name: registerFullName,
    },
    emailRedirectTo: `${window.location.origin}/dashboard`,
  },
});

// Timeout wrapper - 30 detik
const signUpWithTimeout = Promise.race([
  signUpPromise,
  new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Signup timeout - email provider mungkin tidak dikonfigurasi",
          ),
        ),
      30000,
    ),
  ),
]);

const { data: authData, error: signUpError } = (await signUpWithTimeout) as any;
```

---

## 🚀 Rekomendasi Langsung

### Untuk Development Cepat:

1. ✅ **Nonaktifkan email verification** (Opsi 1)
2. ✅ Lalu test daftar akun baru
3. ✅ Akan langsung bisa login

### Untuk Production:

1. ✅ Setup SendGrid atau SMTP
2. ✅ Add timeout protection (Opsi 3)
3. ✅ Cek status email yang dikirim

---

## 🧪 Testing Steps

### 1. Cek Config Email saat ini:

```bash
# Buka browser console (F12) saat daftar, lihat network tab
# POST ke https://jkqkywrckwkppfoezyes.supabase.co/auth/v1/signup

# Response time > 30 detik = timeout/hang
```

### 2. Test di Supabase SQL Editor:

```sql
-- Cek apakah akun sudah dibuat meski email gagal
SELECT id, email, email_confirmed_at, created_at FROM auth.users LIMIT 10;

-- Jika ada akun tapi email_confirmed_at NULL = email tidak terkirim
```

### 3. Setelah fix, test daftar:

```
1. Fill form: nama, username, email, password
2. Click daftar
3. Cek apakah loading selesai dalam 5 detik
4. Jika email diperlukan, cek inbox email Anda
```

---

## 📋 Checklist Solusi

- [ ] Cek apakah email verification aktif/nonaktif di Supabase
- [ ] Jika development: Nonaktifkan email verification
- [ ] Jika production: Setup email provider (SendGrid/SMTP)
- [ ] Add timeout ke signUp() call
- [ ] Test daftar akun baru
- [ ] Verify bisa langsung login
- [ ] Cek network tab - tidak ada request yang hang

---

## 🆘 Jika Masih Bermasalah

Beri tahu:

1. Apakah setelah disable email verification berhasil?
2. Lihat browser console - ada error apa?
3. Check network tab - ada request yang fail?
4. Lihat server logs jika tersedia
