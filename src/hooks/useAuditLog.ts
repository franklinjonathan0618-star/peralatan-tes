import { useState, useCallback } from 'react';
import { supabase } from '../integrations/api/client';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Maksimum data yang ditarik per fetch (hindari loading ribuan baris)
const FETCH_LIMIT = 500;

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  module: string;
  activity: string;
  detail: string;
  created_at: string;
}

export interface AuditLogFilters {
  username?: string;
  module?: string;
  activity?: string;
}

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = useCallback(async (filters?: AuditLogFilters) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);

      if (filters?.username) {
        query = query.ilike('username', `%${filters.username}%`);
      }
      if (filters?.module) {
        query = query.ilike('module', `%${filters.module}%`);
      }
      if (filters?.activity) {
        query = query.ilike('activity', `%${filters.activity}%`);
      }

      const { data, error: err } = await query;
      if (err) throw new Error(err.message);
      const rows = (data as AuditLog[]) || [];
      setLogs(rows);
      setTotalCount(rows.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hapus audit log yang lebih lama dari `olderThanDays` hari.
   * Default: 90 hari.
   */
  const cleanupOldLogs = useCallback(async (olderThanDays = 90) => {
    try {
      const res = await fetch(`${API_URL}/api/system/cleanup-audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ older_than_days: olderThanDays }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data?.deleted ?? 0;
    } catch (e: any) {
      console.error('cleanupOldLogs error:', e.message);
      return 0;
    }
  }, []);

  return { logs, loading, error, totalCount, fetchAuditLogs, cleanupOldLogs };
};

export default useAuditLog;
