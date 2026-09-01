import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
  console.log('Checking admin user status...');
  
  try {
    // Check in auth.users
    console.log('\nChecking auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .ilike('email', '%admin%');

    if (authError) throw authError;
    
    console.log('\nAuth users found:');
    console.log(JSON.stringify(authUsers, null, 2));
    
    // Check in profiles table
    console.log('\nChecking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', 'admin');
      
    if (profilesError) throw profilesError;
    
    console.log('\nProfiles found:');
    console.log(JSON.stringify(profiles, null, 2));
    
  } catch (error) {
    console.error('Error checking admin user:', error);
  }
}

checkAdminUser();
