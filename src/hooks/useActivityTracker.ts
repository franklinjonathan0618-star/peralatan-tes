import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * useActivityTracker
 * Memperbarui last_activity user setiap kali berpindah halaman.
 * Pasang di komponen layout utama agar aktif di semua halaman.
 */
export const useActivityTracker = () => {
  const { updateActivity, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    updateActivity();
  }, [location.pathname, user]);
};

export default useActivityTracker;
