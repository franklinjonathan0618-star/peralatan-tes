import { UserRole } from '@/utils/rolePermissions';
import { useAuth } from '@/contexts/AuthContext';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

// Hook yang membaca user dari AuthContext (bukan localStorage)
export const useCurrentUser = () => {
  const { user: authUser, loading } = useAuth();

  const user: User | null = authUser ? {
    id: authUser.id,
    username: authUser.username,
    email: authUser.email || '',
    full_name: authUser.name,
    role: authUser.role,
  } : null;

  return { user, isLoading: loading };
};

// Fungsi sinkron - untuk komponen yang butuh user tanpa hook
// Catatan: ini tidak reaktif, gunakan useCurrentUser() jika memungkinkan
export const getCurrentUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (err) {
      return null;
    }
  }
  return null;
};

