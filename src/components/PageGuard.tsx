import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePagePermission } from '@/hooks/usePagePermission';

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
}

/**
 * PageGuard - Membungkus halaman dan redirect ke /dashboard
 * jika user tidak punya akses can_view untuk halaman ini.
 */
const PageGuard: React.FC<PageGuardProps> = ({ pageKey, children }) => {
  const { can_view, loading } = usePagePermission(pageKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!can_view) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PageGuard;
