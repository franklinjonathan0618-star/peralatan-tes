// Client-side rate limiting untuk menghindari rate limit dari Supabase

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // dalam milliseconds
  blockDurationMs: number;
}

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private storage = new Map<string, AttemptRecord>();
  
  constructor(private config: RateLimitConfig) {}

  isAllowed(action: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: number } {
    const now = Date.now();
    const record = this.storage.get(action) || { count: 0, lastAttempt: 0 };

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: record.blockedUntil
      };
    }

    // Reset window if expired
    if (now - record.lastAttempt > this.config.windowMs) {
      record.count = 0;
      record.lastAttempt = now;
    }

    // Check if exceeded limit
    if (record.count >= this.config.maxAttempts) {
      record.blockedUntil = now + this.config.blockDurationMs;
      this.storage.set(action, record);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: record.blockedUntil
      };
    }

    // Increment counter
    record.count++;
    record.lastAttempt = now;
    this.storage.set(action, record);

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - record.count
    };
  }

  getRemainingTime(action: string): number {
    const record = this.storage.get(action);
    if (!record?.blockedUntil) return 0;
    
    const now = Date.now();
    return Math.max(0, record.blockedUntil - now);
  }

  reset(action: string): void {
    this.storage.delete(action);
  }
}

// Export instances untuk different actions
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5, // Max 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 menit
  blockDurationMs: 15 * 60 * 1000 // Block 15 menit
});

export const registerRateLimiter = new RateLimiter({
  maxAttempts: 3, // Max 3 registration attempts
  windowMs: 30 * 60 * 1000, // per 30 menit
  blockDurationMs: 30 * 60 * 1000 // Block 30 menit
});

export const getUsernameRateLimiter = new RateLimiter({
  maxAttempts: 10, // Max 10 username checks
  windowMs: 5 * 60 * 1000, // per 5 menit
  blockDurationMs: 5 * 60 * 1000 // Block 5 menit
});
