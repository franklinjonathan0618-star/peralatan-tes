import { useState, useCallback } from 'react';
import { supabase } from '../integrations/api/client';
import { useToast } from './use-toast';
import { invalidateUserPermissionCache } from './useCurrentUserPermissions';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface SystemUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'viewer' | 'commentator';
  is_active: number;
  last_login: string | null;
  last_activity: string | null;
  created_at: string;
  isOnline?: boolean;
}

export interface CreateUserData {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'viewer' | 'commentator';
  is_active: number;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'viewer' | 'commentator';
  is_active?: number;
}

const ONLINE_THRESHOLD_MINUTES = 5;

function computeOnlineStatus(users: SystemUser[]): SystemUser[] {
  const now = new Date().getTime();
  return users.map(u => {
    if (!u.last_activity) return { ...u, isOnline: false };
    const lastActive = new Date(u.last_activity).getTime();
    const diffMinutes = (now - lastActive) / 1000 / 60;
    return { ...u, isOnline: diffMinutes <= ONLINE_THRESHOLD_MINUTES };
  });
}

async function hashPassword(password: string): Promise<string> {
  // SHA-256 via WebCrypto API (hanya tersedia di HTTPS/localhost)
  // Fallback ke backend API jika tidak tersedia
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const bytes = Array.from(new Uint8Array(buffer));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    const res = await fetch(`${API_URL}/api/system/hash-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await res.json();
    if (!result?.data?.hash) throw new Error('Gagal melakukan hash password');
    return result.data.hash;
  }
}

export const useSystemUsers = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, role, is_active, last_login, last_activity, created_at')
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      const withStatus = computeOnlineStatus((data as SystemUser[]) || []);
      setUsers(withStatus);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserData) => {
    setLoading(true);
    try {
      const hashedPassword = await hashPassword(data.password);
      const { v4: uuidv4 } = await import('uuid');
      const newUser = {
        id: uuidv4(),
        username: data.username.trim().toLowerCase(),
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        role: data.role,
        is_active: data.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await supabase.from('profiles').insert(newUser);
      if (err) throw new Error(err.message);

      // Log audit
      await logAudit('Manajemen User', 'Create', `Membuat user baru: ${data.username}`);

      toast({ title: 'Berhasil', description: `User ${data.username} berhasil dibuat.` });
      await fetchUsers();
      return true;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  const updateUser = useCallback(async (id: string, data: UpdateUserData) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw new Error(err.message);

      // Invalidate permission cache sehingga perubahan role langsung berlaku
      invalidateUserPermissionCache(id);

      await logAudit('Manajemen User', 'Update', `Update user id: ${id}`);
      toast({ title: 'Berhasil', description: 'Data user berhasil diperbarui.' });
      await fetchUsers();
      return true;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  const resetPassword = useCallback(async (id: string, newPassword: string) => {
    setLoading(true);
    try {
      const hashedPassword = await hashPassword(newPassword);
      const { error: err } = await supabase
        .from('profiles')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw new Error(err.message);

      await logAudit('Manajemen User', 'Reset Password', `Reset password user id: ${id}`);
      toast({ title: 'Berhasil', description: 'Password berhasil direset.' });
      return true;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleUserStatus = useCallback(async (id: string, isActive: boolean) => {
    return updateUser(id, { is_active: isActive ? 1 : 0 });
  }, [updateUser]);

  const deleteUser = useCallback(async (id: string, username: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/system/delete-user-complete?user_id=${id}&username=${username}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      await logAudit('Manajemen User', 'Delete Permanen', `Menghapus user dan seluruh aktivitasnya: ${username}`);
      toast({ title: 'Berhasil', description: `User ${username} dan seluruh aktivitasnya berhasil dihapus.` });
      await fetchUsers();
      return true;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  return { users, loading, error, fetchUsers, createUser, updateUser, resetPassword, toggleUserStatus, deleteUser };
};

// Helper: log audit dari dalam hook
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
