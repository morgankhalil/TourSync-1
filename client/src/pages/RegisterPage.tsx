import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

export function RegisterPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Join our platform</h1>
            <p className="mt-2 text-gray-600">Create an account to start collaborating and discovering new opportunities</p>
          </div>
          
          <RegistrationForm />
        </div>
      </div>
      
      {/* Image or branding section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <h2 className="text-4xl font-bold mb-6">Build Your Network</h2>
            <p className="text-xl">
              Connect with artists who share your vision, venues looking for talent, and fans who want to discover your music.
            </p>
            <ul className="mt-8 space-y-3">
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Find compatible collaborators based on genre</span>
              </li>
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Plan efficient tours and fill schedule gaps</span>
              </li>
              <li className="flex items-center">
                <span className="inline-flex justify-center items-center mr-2 h-5 w-5 rounded-full bg-white text-primary">✓</span>
                <span>Discover venues with matching audience demographics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}