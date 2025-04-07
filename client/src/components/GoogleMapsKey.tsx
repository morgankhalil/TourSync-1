import React, { useEffect } from 'react';
import { useEnvVars } from '../services/env-service';

export function GoogleMapsKey() {
  const { data: envVars, isLoading, error } = useEnvVars();
  
  useEffect(() => {
    if (isLoading || error || !envVars?.GOOGLE_MAPS_API_KEY) {
      return;
    }
    
    // Add the API key to window object so it's accessible
    if (envVars.GOOGLE_MAPS_API_KEY) {
      (window as any).VITE_GOOGLE_MAPS_API_KEY = envVars.GOOGLE_MAPS_API_KEY;
      
      // Also add it as a meta tag for easier access
      const existingMetaTag = document.querySelector('meta[name="google-maps-key"]');
      if (existingMetaTag) {
        existingMetaTag.setAttribute('content', envVars.GOOGLE_MAPS_API_KEY);
      } else {
        const metaTag = document.createElement('meta');
        metaTag.name = 'google-maps-key';
        metaTag.content = envVars.GOOGLE_MAPS_API_KEY;
        document.head.appendChild(metaTag);
      }
      
      console.log("Google Maps API key added to document head and window object");
    } else {
      console.error("Google Maps API key is not available");
    }
  }, [envVars, isLoading, error]);

  if (isLoading) {
    return null;
  }
  
  if (error) {
    console.error("Error fetching environment variables:", error);
    return null;
  }
  
  return null; // This component doesn't render anything
}