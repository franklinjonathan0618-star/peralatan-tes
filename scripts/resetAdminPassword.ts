import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = 'admin@example.com';
const newPassword = 'admin123';

async function resetAdminPassword() {
  console.log('Resetting admin password...');
  
  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Sign in as admin to reset password
    const { data, error } = await supabase.auth.admin.updateUserById(
      '00000000-0000-0000-0000-000000000000', // This will be replaced with actual user ID
      { password: newPassword }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return;
    }

    console.log('Password reset successful!');
    console.log('Email:', adminEmail);
    console.log('New Password:', newPassword);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();
