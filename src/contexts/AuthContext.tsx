import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../integrations/api/client';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

type UserRole = 'admin' | 'viewer' | 'commentator';

interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string | null;
  lastChecked?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: ({ username, password }: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateActivity: () => Promise<void>;
  isAdmin: () => boolean;
  isViewer: () => boolean;
  isCommentator: () => boolean;
  skipAuthChangeRef: React.MutableRefObject<boolean>;
}

export const DEMO_MODE = false;

const USERNAME_EMAIL_CACHE_KEY = 'mwt_username_email_cache_v1';
const LOCAL_AUTH_USER_KEY = 'mwt_local_auth_user_v1';

const hashPassword = async (rawPassword: string): Promise<string> => {
  // crypto.subtle hanya tersedia di HTTPS/localhost
  // Fallback ke backend API jika tidak tersedia (HTTP / browser lama)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawPassword));
    const bytes = Array.from(new Uint8Array(buffer));
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback: hash via backend API
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

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutErrorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMessage)), timeoutMs)),
  ]);
};



const cacheUsernameEmail = (username: string, email: string): void => {
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async (): Promise<void> => Promise.resolve(),
  logout: async (): Promise<void> => Promise.resolve(),
  updateActivity: async (): Promise<void> => Promise.resolve(),
  isAdmin: () => false,
  isViewer: () => false,
  isCommentator: () => false,
  skipAuthChangeRef: { current: false },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipAuthChangeRef = useRef(false);

  const setUserState = useCallback((userData: User | null) => {
    if (userData) {
      setUser({ ...userData, lastChecked: Date.now() });
    } else {
      setUser(null);
    }
  }, []);



  const persistUserSession = useCallback((userData: User | null) => {
    if (!userData) {
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const login = async ({ username, password }: { username: string; password: string }): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const normalizedInput = username.trim();
      const isEmail = normalizedInput.includes('@');
      const normalizedUsername = normalizedInput.toLowerCase();
      const hashedPassword = await hashPassword(password);

      const baseQuery = supabase
        .from('profiles')
        .select('id, username, full_name, role, email, password, is_active')
        .limit(1);

      const query = isEmail
        ? baseQuery.ilike('email', normalizedInput).maybeSingle()
        : baseQuery.ilike('username', normalizedUsername).maybeSingle();

      const { data, error: profileError } = (await withTimeout(
        Promise.resolve(query),
        10000,
        'PROFILE_LOGIN_TIMEOUT',
      )) as any;

      if (profileError) {
        throw new Error(`Gagal membaca data profile: ${profileError.message}`);
      }

      if (!data || !data.password) {
        throw new Error('Username/email atau password salah.');
      }

      if (data.password !== hashedPassword) {
        throw new Error('Username/email atau password salah.');
      }

      // Cek apakah akun aktif (is_active = 1 / true)
      if (data.is_active === false || data.is_active === 0) {
        throw new Error('Akun Anda telah dinonaktifkan oleh administrator. Hubungi admin untuk informasi lebih lanjut.');
      }

      const authenticatedUser: User = {
        id: data.id,
        username: data.username,
        role: (data.role || 'viewer') as UserRole,
        name: data.full_name || data.username || 'User',
        email: data.email || '',
      };

      setUserState(authenticatedUser);
      persistUserSession(authenticatedUser);
      cacheUsernameEmail(data.username, data.email || '');

      // Update last_login & last_activity di profiles
      try {
        await fetch(`${API_URL}/api/system/update-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: data.id }),
        });
      } catch { /* non-critical */ }

      // Insert ke login_histories
      try {
        const ip = await fetch('https://api.ipify.org?format=json')
          .then(r => r.json()).then(r => r.ip).catch(() => 'unknown');
        const { v4: historyId } = await import('uuid');
        const hId = historyId();
        localStorage.setItem('mwt_login_history_id', hId);
        await fetch(`${API_URL}/api/login_histories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: hId,
            user_id: data.id,
            username: data.username,
            ip_address: ip,
            login_at: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' '),
          }),
        });
      } catch { /* non-critical */ }

    } catch (err) {
      skipAuthChangeRef.current = false;
      let errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login';
      
      // Handle rate limit with specific guidance
      if (errorMessage === 'RATE_LIMIT_LOGIN') {
        errorMessage = 'Terlalu banyak percobaan login. Untuk keamanan, silakan tunggu 15-30 menit sebelum mencoba lagi. Atau gunakan akun demo yang tersedia (admin/admin123, commentator/commentator123, viewer/viewer123).';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      const currentUser = user; // simpan sebelum di-clear

      // Reset last_activity ke NULL agar status online langsung hilang
      try {
        if (currentUser?.id) {
          await fetch(`${API_URL}/api/system/clear-activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id }),
          });
        }
      } catch { /* non-critical */ }

      // Update logout time di login_histories
      try {
        const historyId = localStorage.getItem('mwt_login_history_id');
        if (historyId) {
          await fetch(`${API_URL}/api/system/logout-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history_id: historyId }),
          });
          localStorage.removeItem('mwt_login_history_id');
        }
      } catch { /* non-critical */ }
      setUserState(null);
      persistUserSession(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Gagal logout');
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = useCallback(async (): Promise<void> => {
    try {
      const rawSession = localStorage.getItem('mwt_local_auth_user_v1') || localStorage.getItem('user');
      if (!rawSession) return;
      const u = JSON.parse(rawSession);
      if (!u?.id) return;
      await fetch(`${API_URL}/api/system/update-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: u.id }),
      });
    } catch { /* non-critical */ }
  }, []);

  const isAdmin = (): boolean => user?.role === 'admin';
  const isViewer = (): boolean => user?.role === 'viewer';
  const isCommentator = (): boolean => user?.role === 'commentator';

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const rawSession = localStorage.getItem(LOCAL_AUTH_USER_KEY) || localStorage.getItem('user');
        if (!rawSession) {
          setUserState(null);
          return;
        }

        const parsedUser = JSON.parse(rawSession) as User;
        if (!parsedUser?.id || !parsedUser?.username) {
          setUserState(null);
          persistUserSession(null);
          return;
        }

        // Re-validasi status aktif dari database setiap kali session di-restore
        try {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('is_active')
            .eq('id', parsedUser.id)
            .maybeSingle();

          if (profileErr) throw profileErr;

          if (!profile || profile.is_active === false || profile.is_active === 0) {
            // Akun dinonaktifkan — hapus session & paksa logout
            setUserState(null);
            persistUserSession(null);
            return;
          }
        } catch {
          // Jika gagal cek (offline/error), izinkan session sementara
          setUserState(parsedUser);
          return;
        }

        setUserState(parsedUser);
      } catch {
        setUserState(null);
        persistUserSession(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [persistUserSession, setUserState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateActivity,
        isAdmin,
        isViewer,
        isCommentator,
        skipAuthChangeRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
