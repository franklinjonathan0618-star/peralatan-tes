import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function testAdminLogin() {
  console.log('Testing admin login...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Try to sign in with email/password
  try {
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (error) {
      console.error('Login error:', error);
      return;
    }

    console.log('Login successful!');
    console.log('User:', data.user);
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    console.log('User profile:', profile);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAdminLogin();
