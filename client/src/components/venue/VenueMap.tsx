import React, { useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Venue } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VenueMapProps {
  venues: Venue[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onVenueClick?: (venue: Venue) => void;
  highlightedVenueId?: number;
}

export default function VenueMap({ 
  venues, 
  center, 
  zoom = 10,
  onVenueClick,
  highlightedVenueId
}: VenueMapProps) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // Get Google Maps API key from backend
  const { data: apiKey } = useQuery({
    queryKey: ['/api/config/maps-api-key'],
    queryFn: async () => {
      const result = await apiRequest('/api/config/maps-api-key');
      return result as { key: string };
    },
    staleTime: Infinity, // This doesn't change often
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey?.key || '',
    // Only load the API once we have the key
    googleMapsClientId: '',
    preventGoogleFontsLoading: true,
  });

  const mapCenter = center || (venues.length > 0 
    ? { lat: parseFloat(venues[0].latitude), lng: parseFloat(venues[0].longitude) }
    : { lat: 40.7128, lng: -74.0060 }); // Default to NYC if no venues or center

  if (loadError) {
    return <div className="p-4 text-red-500">Error loading maps</div>;
  }

  if (!isLoaded || !apiKey?.key) {
    return <div className="p-4">Loading maps...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={mapCenter}
      zoom={zoom}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          position={{
            lat: parseFloat(venue.latitude),
            lng: parseFloat(venue.longitude),
          }}
          onClick={() => {
            setSelectedVenue(venue);
            if (onVenueClick) {
              onVenueClick(venue);
            }
          }}
          animation={venue.id === highlightedVenueId ? google.maps.Animation.BOUNCE : undefined}
          icon={venue.id === highlightedVenueId 
            ? {
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40)
              } 
            : undefined
          }
        />
      ))}

      {selectedVenue && (
        <InfoWindow
          position={{
            lat: parseFloat(selectedVenue.latitude),
            lng: parseFloat(selectedVenue.longitude),
          }}
          onCloseClick={() => setSelectedVenue(null)}
        >
          <div className="p-2 max-w-sm">
            <h3 className="font-bold text-gray-800">{selectedVenue.name}</h3>
            <p className="text-sm text-gray-600">{selectedVenue.address}</p>
            <p className="text-sm text-gray-600">
              {selectedVenue.city}, {selectedVenue.state} {selectedVenue.zipCode}
            </p>
            {selectedVenue.capacity && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Capacity:</span> {selectedVenue.capacity}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}