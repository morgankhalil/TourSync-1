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
            <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
      
      {/* Image or branding section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <h2 className="text-4xl font-bold mb-6">Connect & Collaborate</h2>
            <p className="text-xl">
              Access your network, manage your touring schedule, and discover new opportunities for collaboration.
            </p>
            <ul className="mt-8 space-y-3">
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Intelligent venue matching based on your tour needs</span>
              </li>
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Real-time collaboration with venues and artists</span>
              </li>
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Advanced analytics on audience demographics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}