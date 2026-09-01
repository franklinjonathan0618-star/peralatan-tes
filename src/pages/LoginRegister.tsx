import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";
import { Eye, EyeOff, Check } from "lucide-react";
import { UserRole } from "@/utils/rolePermissions";
import { supabase } from "../integrations/api/client";
import { useAuth } from "../contexts/AuthContext";
import { loginRateLimiter, registerRateLimiter } from "@/utils/rateLimiter";

const USERNAME_EMAIL_CACHE_KEY = "mwt_username_email_cache_v1";

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

const hashPassword = async (rawPassword: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawPassword));
    const bytes = Array.from(new Uint8Array(buffer));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    const res = await fetch(`${API_URL}/api/system/hash-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: rawPassword }),
    });
    const result = await res.json();
    if (!result?.data?.hash) throw new Error('Gagal melakukan hash password');
    return result.data.hash;
  }
};

const cacheUsernameEmail = (username: string, email: string) => {
  if (!username || !email) return;
  try {
    const raw = localStorage.getItem(USERNAME_EMAIL_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[username.trim().toLowerCase()] = email.trim().toLowerCase();
    localStorage.setItem(USERNAME_EMAIL_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // noop
  }
};

export default function LoginRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, skipAuthChangeRef } = useAuth();
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("viewer");
  const [registerFullName, setRegisterFullName] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const input = loginUsername.trim();
      console.log("📝 Login form submitted with username:", input);

      if (!input || !loginPassword) {
        console.warn("⚠️ Form tidak lengkap");
        toast({
          variant: "destructive",
          title: "Form Tidak Lengkap",
          description: "Username/Email dan password harus diisi.",
        });
        setIsLoading(false);
        return;
      }

      // Check client-side rate limiting
      const rateLimitResult = loginRateLimiter.isAllowed("login");

      if (!rateLimitResult.allowed) {
        console.warn("⚠️ Rate limit exceeded");
        const remainingMinutes = Math.ceil(
          rateLimitResult.blockedUntil! / 1000 / 60,
        );
        toast({
          variant: "destructive",
          title: "Terlalu Banyak Percobaan",
          description: `Anda telah melakukan terlalu banyak percobaan login. Silakan tunggu ${remainingMinutes} menit sebelum mencoba lagi. Atau gunakan akun demo (admin/admin123).`,
        });
        setIsLoading(false);
        return;
      }

      // Jalankan login langsung: timeout sudah ditangani detail di AuthContext
      // (lookup username, sign-in, dan profile loading punya timeout sendiri).
      console.log("⏳ Calling AuthContext.login...");
      await login({ username: input, password: loginPassword });

      console.log("✅ Login successful");

      // Reset rate limit on successful login
      loginRateLimiter.reset("login");

      toast({
        title: "Login Berhasil",
        description: "Anda akan diarahkan ke dashboard.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
      });

      let errorMessage = error.message || "Terjadi kesalahan saat login.";
      let errorTitle = "Login Gagal";

      // Check if it's a rate limit error from server
      if (
        errorMessage.includes("RATE_LIMIT_LOGIN") ||
        errorMessage.includes("terlalu banyak percobaan")
      ) {
        // Show remaining attempts from client-side limiter
        const rateLimitResult = loginRateLimiter.isAllowed("login");
        const remainingAttempts = rateLimitResult.allowed
          ? rateLimitResult.remainingAttempts
          : 0;

        errorTitle = "Perhatian - Rate Limit";
        errorMessage =
          remainingAttempts > 0
            ? `Percobaan login tersisa: ${remainingAttempts}. Jika gagal terus, Anda akan diblokir sementara.`
            : "Anda telah mencapai batas percobaan login. Silakan tunggu 15 menit atau gunakan akun demo.";
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !registerUsername ||
      !registerEmail ||
      !registerPassword ||
      !registerFullName
    ) {
      toast({
        variant: "destructive",
        title: "Form Tidak Lengkap",
        description: "Silakan isi semua field yang tersedia.",
      });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Tidak Cocok",
        description: "Password dan konfirmasi password harus sama.",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Terlalu Pendek",
        description: "Password harus minimal 6 karakter.",
      });
      return;
    }

    if (!registerEmail.includes("@") || !registerEmail.includes(".")) {
      toast({
        variant: "destructive",
        title: "Email Tidak Valid",
        description:
          "Silakan masukkan email yang valid (contoh: user@email.com).",
      });
      return;
    }

    // Username validation - alphanumeric and underscore only
    if (!/^[a-zA-Z0-9_]+$/.test(registerUsername)) {
      toast({
        variant: "destructive",
        title: "Username Tidak Valid",
        description:
          "Username hanya boleh mengandung huruf, angka, dan underscore.",
      });
      return;
    }

    if (registerUsername.length < 3) {
      toast({
        variant: "destructive",
        title: "Username Terlalu Pendek",
        description: "Username minimal 3 karakter.",
      });
      return;
    }

    setIsLoading(true);

    try {
      setIsLoading(true);
      skipAuthChangeRef.current = true;

      // Check client-side rate limiting for registration
      const rateLimitResult = registerRateLimiter.isAllowed("register");

      if (!rateLimitResult.allowed) {
        const remainingMinutes = Math.ceil(
          rateLimitResult.blockedUntil! / 1000 / 60,
        );
        toast({
          variant: "destructive",
          title: "Terlalu Banyak Percobaan Daftar",
          description: `Anda telah melakukan terlalu banyak percobaan pendaftaran. Silakan tunggu ${remainingMinutes} menit sebelum mencoba lagi.`,
        });
        setIsLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(registerPassword);
      const newUserId = crypto.randomUUID();
      cacheUsernameEmail(registerUsername, registerEmail);

      const { error: registerError } = await supabase.from("profiles").insert({
        id: newUserId,
        username: registerUsername.toLowerCase(),
        email: registerEmail.toLowerCase(),
        full_name: registerFullName,
        role: registerRole,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (registerError) {
        if (
          registerError.message?.includes("profiles_username_key") ||
          registerError.code === "23505"
        ) {
          throw new Error("Username sudah digunakan. Silakan pilih username lain.");
        }

        if (registerError.message?.includes("email") || registerError.message?.includes("profiles_email")) {
          throw new Error("Email sudah digunakan. Silakan gunakan email lain.");
        }

        if (registerError.code === "42501") {
          throw new Error("Tidak punya izin menambah profile. Cek RLS policy tabel profiles.");
        }

        throw new Error(registerError.message || "Gagal menyimpan akun.");
      }

      skipAuthChangeRef.current = false;
      console.log("✅ Register profile-only berhasil");

      // Reset rate limit on successful registration
      registerRateLimiter.reset("register");

      setEmailConfirmationSent(true);

      console.log("✅ Registrasi berhasil! Menampilkan toast...");

      toast({
        title: "Pendaftaran Berhasil",
        description: `Akun ${registerUsername} telah dibuat. Silakan login dengan username dan password Anda.`,
      });

      // Reset form and switch to login tab after 2 seconds
      setTimeout(() => {
        setRegisterUsername("");
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setRegisterFullName("");
        setRegisterRole("viewer");
        setEmailConfirmationSent(false);
        setLoginUsername(registerUsername);
      }, 1500);
    } catch (error: any) {
      skipAuthChangeRef.current = false;
      console.error("Registration error:", error);

      let errorMessage = error.message || "Terjadi kesalahan saat mendaftar.";
      let errorTitle = "Pendaftaran Gagal";

      // Log exact error for debugging
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
      });

      if (
        error.message?.includes("profiles_username_key") ||
        error.message?.includes("23505")
      ) {
        errorTitle = "Username Sudah Dipakai";
        errorMessage = "Username sudah digunakan. Silakan pilih username lain.";
      } else if (error.message === "RATE_LIMIT_TOO_MANY_REQUESTS") {
        // Show remaining attempts from client-side limiter
        const rateLimitResult = registerRateLimiter.isAllowed("register");
        const remainingAttempts = rateLimitResult.allowed
          ? rateLimitResult.remainingAttempts
          : 0;

        errorTitle = "Perhatian - Rate Limit Pendaftaran";
        errorMessage =
          remainingAttempts > 0
            ? `Percobaan pendaftaran tersisa: ${remainingAttempts}. Jika gagal terus, Anda akan diblokir sementara.`
            : "Anda telah mencapai batas percobaan pendaftaran. Silakan tunggu 30 menit sebelum mencoba lagi.";
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        {/* Tab Navigator */}
        <CardHeader className="space-y-1 pb-4 border-b">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Divisi Peralatan</h1>
            <p className="text-sm text-gray-500 mt-1">Cabang Papua</p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* LOGIN FORM */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Login</h2>
              <p className="text-sm text-gray-600 mt-2">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username atau Email</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Masukkan username atau email Anda"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </div>

          {/* REGISTER hidden — penambahan user hanya melalui Manajemen User oleh admin */}
          {false && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Daftar Akun Baru</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Buat akun baru untuk bergabung dengan sistem
                </p>
              </div>

              {/* Success Message */}
              {emailConfirmationSent && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
                  <p className="text-sm font-bold text-green-900 flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4" />
                    Pendaftaran Berhasil!
                  </p>
                  <p className="text-xs text-green-800">
                    Akun Anda telah dibuat. Silakan login dengan username atau
                    email yang baru didaftarkan.
                  </p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Nama Lengkap *</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="Contoh: John Doe"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Username *</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Contoh: john_doe (3+ karakter, alphanumeric & underscore)"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Username unik untuk login alternatif
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email *</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Contoh: john@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Email unik untuk login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-role">Tipe Akun *</Label>
                  <Select
                    value={registerRole}
                    onValueChange={(value) => setRegisterRole(value as UserRole)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="register-role">
                      <SelectValue placeholder="Pilih Tipe Akun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">
                    Konfirmasi Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-confirm-password"
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      placeholder="Ulang password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {showRegisterConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || emailConfirmationSent}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mendaftar...
                    </>
                  ) : emailConfirmationSent ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Pendaftaran Berhasil
                    </>
                  ) : (
                    "Daftar"
                  )}
                </Button>
              </form>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
