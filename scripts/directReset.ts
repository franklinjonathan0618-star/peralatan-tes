import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jkqkywrckwkppfoezyes.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l-IEWUDE98cLkwr0QPwXJw_i868wU-o';

async function resetPassword() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Try to sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (error) {
      console.log('Current credentials are invalid. Resetting password...');
      
      // Reset password
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail('admin@example.com', {
        redirectTo: 'http://localhost:3000/update-password',
      });
      
      if (resetError) throw resetError;
      
      console.log('Password reset email sent! Please check your email.');
      return;
    }
    
    console.log('Login successful!');
    console.log('User:', data.user);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();
