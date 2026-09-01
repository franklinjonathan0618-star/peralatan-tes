import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const adminEmail = 'admin@example.com';
const adminPassword = 'admin123';
const adminUsername = 'admin';

async function createNewAdmin() {
  console.log('Creating new admin user...');
  
  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Delete existing user if exists
    console.log('Checking for existing user...');
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .or(`username.eq.${adminUsername},email.eq.${adminEmail}`)
      .maybeSingle();

    if (existingUser) {
      console.log('Deleting existing user...');
      // First delete from auth.users
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteAuthError) throw deleteAuthError;
      
      // Then delete from profiles
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', existingUser.id);
      
      if (deleteProfileError) throw deleteProfileError;
    }

    // Create new user
    console.log('Creating new user...');
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: 'Admin User',
        username: adminUsername
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user data returned');

    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: adminUsername,
        email: adminEmail,
        name: 'Admin User',
        role: 'admin'
      });

    if (profileError) throw profileError;

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\nYou can now log in with these credentials.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createNewAdmin();
