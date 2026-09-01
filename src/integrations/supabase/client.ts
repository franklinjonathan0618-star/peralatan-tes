import { createClient } from '@supabase/supabase-js';

// Debug log environment variables
console.log('Environment Variables:', {
  VITE_SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
  VITE_SUPABASE_ANON_KEY: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
});

// Get environment variables with proper type checking
const getEnvVar = (key: string, defaultValue?: string): string => {
  try {
    const value = (import.meta as any).env?.[key];
    if (!value && typeof defaultValue === 'undefined') {
      const errorMsg = `Missing required environment variable: ${key}`;
      console.warn(errorMsg);
      return '';
    }
    return value || defaultValue || '';
  } catch (error) {
    console.error(`Error reading environment variable ${key}:`, error);
    return defaultValue || '';
  }
};

// Get Supabase URL and key from environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate URL and Key format
let supabaseClient = null as any;

try {
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }
  
  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured');
  }

  if (!supabaseUrl.startsWith('http')) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    throw new Error('Invalid Supabase URL format. It should start with http:// or https://');
  }

  if (supabaseKey.length < 30) {
    console.error('❌ Invalid Supabase Anon Key');
    throw new Error('Invalid Supabase Anon Key format');
  }

  console.log('🔌 Initializing Supabase client with URL:', supabaseUrl);

  // Create Supabase client
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  // Create a dummy/fallback client that returns empty results
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
    } catch (fallbackError) {
      console.error('Failed to create fallback Supabase client:', fallbackError);
    }
  }
}

if (!supabaseClient) {
  console.error('⚠️ Supabase is not properly configured. Some features may not work.');
}

export const supabase = supabaseClient || ({
  from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
  auth: {
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
}) as any;

// Test connection
(async () => {
  try {
    if (supabaseClient) {
      const { error } = await supabase.from('profiles').select('*').limit(1);
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
      } else {
        console.log('✅ Successfully connected to Supabase');
      }
    }
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
  }
})();

export default supabase;