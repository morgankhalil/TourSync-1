import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-gray-600">Log in to your account to access the platform</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
      
      {/* Image or branding section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <h2 className="text-4xl font-bold mb-6">Connect. Collaborate. Tour.</h2>
            <p className="text-xl">
              Discover new collaboration opportunities and simplify your touring experience with our innovative platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}