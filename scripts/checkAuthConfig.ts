import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function checkAuthConfig() {
  console.log('Checking authentication configuration...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check auth providers
    console.log('\nChecking enabled auth providers...');
    const { data: settings, error: settingsError } = await supabase.auth.getSettings();
    
    if (settingsError) throw settingsError;
    console.log('Auth settings:', JSON.stringify(settings, null, 2));
    
    // Try to list users (this requires service role key)
    console.log('\nAttempting to list users...');
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
      console.log('Users:', JSON.stringify(users, null, 2));
    } catch (error) {
      console.log('Cannot list users (expected without service role key):', error.message);
    }
    
  } catch (error) {
    console.error('Error checking auth config:', error);
  }
}

checkAuthConfig();
