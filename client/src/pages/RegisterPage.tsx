import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Music, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

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
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Form Section */}
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <Link href="/" className="flex items-center space-x-2">
              <Music className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">TourSync</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground">
              Join our platform to start collaborating and discovering new opportunities
            </p>
          </div>
          
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign up</CardTitle>
              <CardDescription className="text-center">
                Enter your information to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Branding Section */}
      <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        <div className="flex flex-col justify-center h-full px-8 lg:px-12 text-white relative z-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Build Your Network</h2>
            <p className="text-lg opacity-90 mb-8">
              Connect with artists who share your vision, venues looking for talent, and fans who want to discover your music.
            </p>
            <ul className="space-y-5">
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                <span className="text-lg">Find compatible collaborators based on genre</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                <span className="text-lg">Plan efficient tours and fill schedule gaps</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                <span className="text-lg">Discover venues with matching audience demographics</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
      </div>
    </div>
  );
}