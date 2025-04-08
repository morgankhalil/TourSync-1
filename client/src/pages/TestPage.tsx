import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info, Server } from 'lucide-react';

function TestPage() {
  const [serverStatus, setServerStatus] = useState<'loading'|'online'|'error'>('loading');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Test basic API endpoint to check if server is running and handling requests
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Test the server connection by fetching a simple endpoint
        const response = await fetch('/api/env-vars');
        if (response.ok) {
          const data = await response.json();
          setApiResponse(data);
          setServerStatus('online');
        } else {
          setApiError(`Server responded with status ${response.status}`);
          setServerStatus('error');
        }
      } catch (error) {
        console.error('Error checking server:', error);
        setApiError(error instanceof Error ? error.message : 'Unknown error');
        setServerStatus('error');
      }
    };
    
    checkServer();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Connection Test Page</CardTitle>
          <CardDescription>
            This page is outside the authentication protected route
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Server Connection Status</h3>
              {serverStatus === 'loading' && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Checking...</Badge>
              )}
              {serverStatus === 'online' && (
                <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>
              )}
              {serverStatus === 'error' && (
                <Badge variant="outline" className="bg-red-100 text-red-800">Connection Error</Badge>
              )}
            </div>
            
            <p>This page can be used to test connectivity without authentication</p>
            
            <Separator className="my-2" />
            
            {serverStatus === 'online' && (
              <div className="mt-2 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">API Server is responding</p>
                  <p className="text-sm text-muted-foreground">
                    We successfully connected to the backend API
                  </p>
                </div>
              </div>
            )}
            
            {serverStatus === 'error' && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  {apiError || "Couldn't connect to the API server"}
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground mt-4 flex items-center">
              <Info className="h-4 w-4 mr-1 inline" />
              If you can see this page while getting authentication errors elsewhere, it indicates 
              an issue with the authentication flow rather than the basic application setup.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Environment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Base URL: </span>
                {window.location.origin}
              </div>
              <div>
                <span className="font-medium">Environment: </span>
                {import.meta.env.MODE}
              </div>
              <div>
                <span className="font-medium">API Response: </span>
                {apiResponse ? (
                  <pre className="bg-slate-100 p-2 rounded mt-1 overflow-auto text-xs">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted-foreground">No data yet</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button asChild variant="outline" className="mr-2">
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Go to Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestPage;