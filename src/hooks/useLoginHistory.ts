import { useState, useCallback } from 'react';
import { supabase } from '../integrations/api/client';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Maksimum data yang ditarik per fetch
const FETCH_LIMIT = 500;

export interface LoginHistory {
  id: string;
  user_id: string;
  username: string;
  ip_address: string;
  login_at: string;
  logout_at: string | null;
}

export const useLoginHistory = () => {
  const [histories, setHistories] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLoginHistory = useCallback(async (filters?: { username?: string }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('login_histories')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(FETCH_LIMIT);

      if (filters?.username) {
        query = query.ilike('username', `%${filters.username}%`);
      }

      const { data, error: err } = await query;
      if (err) throw new Error(err.message);
      const rows = (data as LoginHistory[]) || [];
      setHistories(rows);
      setTotalCount(rows.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hapus riwayat login yang lebih lama dari `olderThanDays` hari.
   * Default: 90 hari.
   */
  const cleanupOldHistories = useCallback(async (olderThanDays = 90) => {
    try {
      const res = await fetch(`${API_URL}/api/system/cleanup-login-histories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ older_than_days: olderThanDays }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data?.deleted ?? 0;
    } catch (e: any) {
      console.error('cleanupOldHistories error:', e.message);
      return 0;
    }
  }, []);

  return { histories, loading, error, totalCount, fetchLoginHistory, cleanupOldHistories };
};

export default useLoginHistory;

