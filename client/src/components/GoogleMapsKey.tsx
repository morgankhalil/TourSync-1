import React, { useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapsKeyProps {
  onSuccess?: () => void;
}

export function GoogleMapsKey({ onSuccess }: GoogleMapsKeyProps) {
  const { apiKeyStatus, error } = useGoogleMaps();
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Google Maps API key',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('/api/config/googlemaps', {
        method: 'POST',
        body: { apiKey },
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Google Maps API key has been set successfully',
          duration: 3000,
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Force reload to apply the new API key
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to set Google Maps API key',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (apiKeyStatus === 'valid') {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Google Maps API</CardTitle>
          <CardDescription>Your Google Maps API key is valid and working correctly.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setApiKey('');
              toast({
                title: 'Update API Key',
                description: 'Enter a new API key below to update.',
              });
            }}
          >
            Update API Key
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Google Maps API Setup</CardTitle>
        <CardDescription>
          {apiKeyStatus === 'loading' 
            ? 'Checking Google Maps API key status...' 
            : apiKeyStatus === 'invalid' 
              ? 'Your Google Maps API key is invalid or missing.' 
              : 'We need a Google Maps API key to enable mapping features.'}
        </CardDescription>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                Google Maps API Key
              </label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Maps API key"
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Key'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can get a Google Maps API key from the{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Cloud Console
              </a>
              . Make sure to enable Maps JavaScript API, Geocoding API, and Places API.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}