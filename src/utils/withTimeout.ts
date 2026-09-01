/**
 * Utility untuk menambahkan timeout ke Promise
 * Jika timeout tercapai, Promise akan reject dengan "TIMEOUT" error
 * Ini memastikan fast-fail ke mock data
 */

type TimeoutPromise<T> = Promise<T>;

export const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = 3000, // Default 3 detik
  label: string = 'Operation'
): TimeoutPromise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
};

/**
 * Fetch dengan timeout otomatis
 * Berguna untuk Supabase queries yang lambat
 */
export const fetchWithTimeout = async <T,>(
  fetchFn: () => Promise<T>,
  timeoutMs: number = 3000,
  label: string = 'Fetch'
): Promise<T> => {
  try {
    const result = await withTimeout(fetchFn(), timeoutMs, label);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`⏱️ ${label} encountered timeout or error:`, errorMsg);
    throw error;
  }
};

/**
 * Abort controller untuk fetch operations
 * Lebih reliable daripada Promise.race untuk fetch
 */
export const createFetchWithAbort = (timeoutMs: number = 3000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  };
};
