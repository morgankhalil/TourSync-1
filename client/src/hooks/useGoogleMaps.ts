import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Define interfaces for the Google Maps API
interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types?: string[];
}

interface GoogleMapsApiResponse {
  success: boolean;
  apiKeyValid: boolean;
  message?: string;
}

export function useGoogleMaps() {
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'valid' | 'invalid' | 'unavailable'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function checkApiKey() {
      try {
        const response = await apiRequest<GoogleMapsApiResponse>('/api/config/googlemaps');
        if (response.success && response.apiKeyValid) {
          setApiKeyStatus('valid');
        } else {
          setApiKeyStatus('invalid');
          setError(response.message || 'Google Maps API key is invalid');
        }
      } catch (err) {
        setApiKeyStatus('unavailable');
        setError('Could not verify Google Maps API key');
      }
    }
    
    checkApiKey();
  }, []);
  
  // Geocode an address to get coordinates
  async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (apiKeyStatus !== 'valid') {
      setError('Google Maps API key is not valid');
      return null;
    }
    
    try {
      const result = await apiRequest<GeocodeResult>('/api/geocode', {
        method: 'POST',
        body: { address }
      });
      
      return result;
    } catch (err) {
      setError('Failed to geocode address');
      return null;
    }
  }
  
  // Search for places by query
  async function searchPlaces(query: string, radius: number = 50000, location?: { lat: number, lng: number }): Promise<PlaceResult[]> {
    if (apiKeyStatus !== 'valid') {
      setError('Google Maps API key is not valid');
      return [];
    }
    
    try {
      const params: Record<string, string> = { query };
      if (location) {
        params.lat = location.lat.toString();
        params.lng = location.lng.toString();
        params.radius = radius.toString();
      }
      
      const results = await apiRequest<PlaceResult[]>('/api/places/search', {
        queryParams: params
      });
      
      return results;
    } catch (err) {
      setError('Failed to search places');
      return [];
    }
  }
  
  // Get details for a specific place
  async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (apiKeyStatus !== 'valid') {
      setError('Google Maps API key is not valid');
      return null;
    }
    
    try {
      const result = await apiRequest<PlaceResult>('/api/places/details', {
        queryParams: { placeId }
      });
      
      return result;
    } catch (err) {
      setError('Failed to get place details');
      return null;
    }
  }
  
  return {
    apiKeyStatus,
    error,
    geocodeAddress,
    searchPlaces,
    getPlaceDetails
  };
}