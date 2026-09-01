import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://jkqkywrckwkppfoezyes.supabase.co';
const SUPABASE_KEY = 'YOUR_NEW_SERVICE_ROLE_KEY'; // TODO: Replace with service role key from new Supabase project

// User details
const USER_EMAIL = 'admin@example.com';
const USER_PASSWORD = 'admin123';
const USER_USERNAME = 'admin';
const USER_NAME = 'Admin User';

async function createAdminUser() {
  console.log('Creating admin user...');
  
  // Create admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Sign up new user
    console.log('Creating auth user...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: USER_EMAIL,
      password: USER_PASSWORD,
      options: {
        data: {
          username: USER_USERNAME,
          name: USER_NAME,
        },
        emailRedirectTo: 'http://localhost:3000/dashboard',
      },
    });

    if (signUpError) throw signUpError;
    
    if (!authData.user) {
      throw new Error('No user data returned from sign up');
    }

    console.log('Auth user created:', authData.user.id);
    
    // Create profile
    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username: USER_USERNAME,
        email: USER_EMAIL,
        name: USER_NAME,
        role: 'admin',
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;
    
    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', USER_EMAIL);
    console.log('Password:', USER_PASSWORD);
    console.log('\nYou can now log in with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error);
    
    // If user exists, try to update password
    if (error.message.includes('already registered')) {
      console.log('\nUser already exists. Attempting to update password...');
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: USER_EMAIL,
          password: USER_PASSWORD,
        });
        
        if (signInError) {
          console.log('Password update required. Please check your email for a password reset link.');
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(USER_EMAIL, {
            redirectTo: 'http://localhost:3000/update-password',
          });
          
          if (resetError) throw resetError;
          console.log('Password reset email sent. Please check your email.');
        } else {
          console.log('Login successful with provided credentials!');
          console.log('User ID:', data.user.id);
        }
      } catch (nestedError) {
        console.error('Error during password update:', nestedError);
      }
    }
  }
}

createAdminUser();
