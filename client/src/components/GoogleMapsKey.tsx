import React, { useEffect } from 'react';

export function GoogleMapsKey() {
  useEffect(() => {
    // Add the API key to window object so it's accessible
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      (window as any).VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // Also add it as a meta tag for easier access
      const metaTag = document.createElement('meta');
      metaTag.name = 'google-maps-key';
      metaTag.content = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      document.head.appendChild(metaTag);
      
      console.log("Google Maps API key added to document head and window object");
    } else {
      console.error("VITE_GOOGLE_MAPS_API_KEY is not defined in environment variables");
    }
  }, []);

  return null; // This component doesn't render anything
}