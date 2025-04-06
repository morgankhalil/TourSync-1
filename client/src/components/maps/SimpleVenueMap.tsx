import React from 'react';
import { Spinner } from '../ui/spinner';
import { useQuery } from '@tanstack/react-query';

interface SimpleVenueMapProps {
  venue: {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    address?: string;
    city?: string;
    state?: string;
    [key: string]: any; // Allow additional properties
  };
}

interface MapsApiResponse {
  apiKey: string;
}

const SimpleVenueMap = ({ venue }: SimpleVenueMapProps) => {
  // Fetch Google Maps API key
  const { data: mapsApiData, isLoading, isError } = useQuery<MapsApiResponse>({
    queryKey: ['/api/config/maps-api-key'],
    retry: 2,
    queryFn: async () => {
      const response = await fetch('/api/config/maps-api-key');
      if (!response.ok) {
        throw new Error('Failed to fetch Maps API key');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !mapsApiData?.apiKey) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-500 mb-2">Failed to load map</p>
        <p className="text-sm text-muted-foreground">Please check your API key configuration</p>
      </div>
    );
  }

  // Format full address for search
  const fullAddress = [
    venue.address,
    venue.city,
    venue.state,
    venue.zipCode
  ].filter(Boolean).join(', ');

  // Use either coordinates or the formatted address as search parameter
  const searchParam = encodeURIComponent(
    venue.latitude && venue.longitude
      ? `${venue.latitude},${venue.longitude}`
      : `${venue.name}, ${fullAddress}`
  );

  // Create the map URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${mapsApiData.apiKey}&q=${searchParam}&zoom=14`;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="relative flex-grow">
        <iframe 
          className="absolute inset-0 w-full h-full border-0 rounded-md"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title={`Map of ${venue.name}`}
          allowFullScreen>
        </iframe>
      </div>
      <div className="text-center text-sm text-muted-foreground mt-2 bg-muted p-2 rounded-md">
        <strong>{venue.name}</strong> - {fullAddress}
      </div>
    </div>
  );
};

export default SimpleVenueMap;