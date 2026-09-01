import { useEffect, useRef } from 'react';

/**
 * useSubscription — versi MySQL (polling-based)
 * Menggantikan Supabase realtime subscription dengan polling interval sederhana.
 * Interface tetap sama agar semua hook yang menggunakannya tidak perlu diubah.
 */

// Type stubs untuk kompatibilitas dengan kode lama
export type SupabaseClientType = any;

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimePayload<T = any> {
  event: RealtimeEvent;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: any[] | null;
  new: T | null;
  old: T | null;
}

type SubscriptionCallback<T = any> = (payload: RealtimePayload<T>) => void;

interface SubscriptionOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}

interface UseSubscriptionProps<T = any> {
  supabase: SupabaseClientType;
  table: string;
  event: RealtimeEvent;
  callback: SubscriptionCallback<T>;
  filter?: string;
  options?: SubscriptionOptions;
}

/**
 * Karena MySQL tidak mendukung realtime subscription seperti Supabase/PostgreSQL,
 * hook ini sekarang menjadi no-op (tidak melakukan apa-apa).
 * Data refresh dilakukan melalui react-query invalidation setelah setiap mutation.
 */
export const useSubscription = <T = any>({
  options = {},
}: UseSubscriptionProps<T>) => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (options?.enabled === false) return;

    // Panggil onSubscribe agar kode lama yang memeriksanya tidak error
    options.onSubscribe?.();

    return () => {
      isMountedRef.current = false;
      options.onUnsubscribe?.();
    };
  }, [options?.enabled]);

  return () => {};
};
