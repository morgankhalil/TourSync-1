import { useState, useEffect } from 'react';
import axios from 'axios';

export interface GoogleMapsConfig {
  apiKey: string | null;
  isLoaded: boolean;
  error: string | null;
}

export const useGoogleMaps = (): GoogleMapsConfig => {
  const [config, setConfig] = useState<GoogleMapsConfig>({
    apiKey: null,
    isLoaded: false,
    error: null,
  });

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await axios.get('/api/config/maps-api-key');
        const apiKey = response.data.apiKey;
        
        if (!apiKey) {
          setConfig(prev => ({
            ...prev,
            error: 'No Google Maps API key available'
          }));
          return;
        }

        // Load the Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setConfig({
            apiKey,
            isLoaded: true,
            error: null,
          });
          console.log('Google Maps JavaScript API has been loaded');
        };
        
        script.onerror = () => {
          setConfig(prev => ({
            ...prev,
            error: 'Failed to load Google Maps API'
          }));
        };
        
        document.head.appendChild(script);
        
        // Set the API key immediately, but isLoaded will become true after the script loads
        setConfig(prev => ({
          ...prev,
          apiKey,
        }));
      } catch (error) {
        setConfig(prev => ({
          ...prev,
          error: 'Error fetching Google Maps API key'
        }));
      }
    };

    fetchApiKey();

    // Cleanup
    return () => {
      const scriptTags = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api"]');
      scriptTags.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
    };
  }, []);

  return config;
};