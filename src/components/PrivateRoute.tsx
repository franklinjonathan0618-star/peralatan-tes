import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout'; // Import the Layout component

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'viewer' | 'commentator')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAdmin, isViewer, isCommentator } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const hasPermission = allowedRoles.some(role => {
      switch (role) {
        case 'admin':
          return isAdmin();
        case 'viewer':
          return isViewer();
        case 'commentator':
          return isCommentator();
        default:
          return false;
      }
    });

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and authorized, render children within the Layout
  return <Layout>{children}</Layout>;
};

export default PrivateRoute;
