/**
 * Diagnostic utility untuk troubleshooting
 */

type DiagnosticResult = {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
};

/**
 * Check network connectivity
 */
export async function checkNetworkConnectivity(): Promise<DiagnosticResult> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      mode: 'no-cors',
      cache: 'no-store'
    });
    return {
      status: 'success',
      message: 'Network connectivity: OK',
      details: { statusCode: response.status }
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Network connectivity: FAILED',
      details: { error: String(error) }
    };
  }
}

/**
 * Check Supabase connectivity
 */
export async function checkSupabaseConnectivity(): Promise<DiagnosticResult> {
  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        status: 'error',
        message: 'Supabase URL not configured',
        details: { url: supabaseUrl }
      };
    }

    // Check DNS resolution
    try {
      const urlObj = new URL(supabaseUrl);
      const hostname = urlObj.hostname;
      
      // Try to fetch from Supabase
      const response = await fetch(supabaseUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${(import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''}`,
        }
      });
      
      return {
        status: 'success',
        message: 'Supabase connection: OK',
        details: { 
          url: supabaseUrl,
          hostname: hostname,
          statusCode: response.status 
        }
      };
    } catch (fetchError) {
      // Check if it's a DNS error
      const errorMsg = String(fetchError);
      const isDnsError = errorMsg.includes('Failed to fetch') || errorMsg.includes('ERR_NAME_NOT_RESOLVED');
      
      return {
        status: 'error',
        message: `Supabase connection failed: ${isDnsError ? 'DNS Resolution Error' : 'Network Error'}`,
        details: { 
          error: errorMsg,
          isDnsError,
          url: supabaseUrl
        }
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Check Supabase connection failed',
      details: { error: String(error) }
    };
  }
}

/**
 * Run all diagnostics
 */
export async function runDiagnostics(): Promise<DiagnosticResult[]> {
  console.log('🔍 Running diagnostics...');
  
  const results: DiagnosticResult[] = [];
  
  // Check network
  console.log('📡 Checking network connectivity...');
  const networkResult = await checkNetworkConnectivity();
  results.push(networkResult);
  console.log(`  ${networkResult.status}: ${networkResult.message}`);
  
  // Check Supabase
  console.log('🔌 Checking Supabase connectivity...');
  const supabaseResult = await checkSupabaseConnectivity();
  results.push(supabaseResult);
  console.log(`  ${supabaseResult.status}: ${supabaseResult.message}`);
  
  // Log summary
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(`\n📊 Diagnostics Summary:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  return results;
}

/**
 * Format diagnostic results for display
 */
export function formatDiagnosticsForDisplay(results: DiagnosticResult[]): string {
  return results
    .map(r => `${r.status === 'success' ? '✅' : '❌'} ${r.message}`)
    .join('\n');
}
