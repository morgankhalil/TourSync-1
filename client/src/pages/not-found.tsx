import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <FileQuestion className="w-20 h-20 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link href="/">
            Return to Dashboard
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/artists/discovery">
            Discover Artists
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;