// Exponential backoff untuk retry operations

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 detik
  maxDelay: 30000, // 30 detik
  backoffFactor: 2
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffFactor } = { ...defaultConfig, ...config };
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (shouldNotRetry(error as Error)) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Gagal setelah ${maxRetries + 1} percobaan. Error terakhir: ${lastError.message}`);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      
      console.warn(`Percobaan ${attempt + 1} gagal, mencoba lagi dalam ${delay}ms...`, error);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

function shouldNotRetry(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry on authentication errors
  if (message.includes('invalid credentials') || 
      message.includes('unauthorized') ||
      message.includes('forbidden')) {
    return true;
  }
  
  // Don't retry on validation errors
  if (message.includes('invalid email') ||
      message.includes('password too short') ||
      message.includes('username already exists')) {
    return true;
  }
  
  // Don't retry on rate limit errors (we handle these separately)
  if (message.includes('rate limit') ||
      message.includes('too many requests')) {
    return true;
  }
  
  return false;
}

// Untuk Supabase operations
export async function safeSupabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await retryWithBackoff(operation, {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000
    });
  } catch (error) {
    console.error(`Supabase operation failed: ${operationName}`, error);
    throw error;
  }
}
