// Debounce utility untuk mengurangi requests berlebihan

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Untuk async functions
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout;
  let lastResolve: ((value: any) => void) | null = null;
  let lastReject: ((reason: any) => void) | null = null;
  
  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      // Cancel previous pending request
      if (timeout) {
        clearTimeout(timeout);
        if (lastReject) {
          lastReject(new Error('Debounced'));
        }
      }
      
      lastResolve = resolve;
      lastReject = reject;
      
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (lastResolve) {
            lastResolve(result);
          }
        } catch (error) {
          if (lastReject) {
            lastReject(error);
          }
        }
      }, wait);
    });
  };
}

// Cache untuk username validation
const usernameCache = new Map<string, { exists: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export function checkUsernameCache(username: string): boolean | null {
  const cached = usernameCache.get(username.toLowerCase());
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    usernameCache.delete(username.toLowerCase());
    return null;
  }
  
  return cached.exists;
}

export function setUsernameCache(username: string, exists: boolean): void {
  usernameCache.set(username.toLowerCase(), {
    exists,
    timestamp: Date.now()
  });
}
