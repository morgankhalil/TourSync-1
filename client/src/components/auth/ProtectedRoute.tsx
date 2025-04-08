import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && requiredRole) {
      // Check for required role if specified
      const userRole = user?.role || 'user';
      if (userRole !== requiredRole) {
        // Redirect to dashboard if user doesn't have the required role
        setLocation('/');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If auth is checked and user is authenticated (and has required role if specified)
  if (isAuthenticated && (!requiredRole || (user?.role === requiredRole))) {
    return <>{children}</>;
  }

  // Don't render anything during redirect to login
  return null;
}