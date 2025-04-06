import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tour, Venue } from '../../types';
import { Spinner } from '../ui/spinner';
import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface VenueMapViewProps {
  venue: Venue;
  onTourClick: (tour: Tour) => void;
  selectedDate?: Date;
}

const VenueMapView = ({ venue, onTourClick }: VenueMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch Google Maps API key
  const { data: mapsApiData, isLoading: isLoadingApiKey, isError } = useQuery<{ apiKey: string }>({
    queryKey: ['/api/maps/api-key'],
    retry: 2,
    onError: () => setError("Failed to load Maps API key"),
  });

  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error('Map reference not found');
      setError('Unable to initialize map - container not ready');
      return;
    }

    if (!venue) {
      console.error('No venue data provided');
      setError('Unable to initialize map - venue data missing');
      return;
    }

    if (!venue.latitude || !venue.longitude) {
      console.error('Venue coordinates missing:', venue);
      setError('Unable to initialize map - venue coordinates missing');
      return;
    }

    const lat = parseFloat(venue.latitude);
    const lng = parseFloat(venue.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates');
      setError('Unable to initialize map - invalid coordinates');
      return;
    }

    try {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      setMap(newMap);
      setIsLoading(false);
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [venue]);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google && mapsApiData?.apiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiData.apiKey}&libraries=places&callback=initMap&loading=async`;
      script.async = true;
      window.initMap = () => {
        initializeMap();
        delete window.initMap;
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (window.google) {
      initializeMap();
    }
  }, [mapsApiData, initializeMap]);

  // Fetch nearby tours
  useEffect(() => {
    async function fetchNearbyTours() {
      try {
        const response = await fetch(`/api/venues/${venue.id}/nearby-tours`);
        const data = await response.json();
        setTours(data);
      } catch (error) {
        console.error('Error fetching nearby tours:', error);
      }
    }

    if (venue?.id) {
      fetchNearbyTours();
    }
  }, [venue]);

  // Safely parse the date
  const parseDateSafe = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date(); // Return current date as fallback
      }
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date(); // Return current date as fallback
    }
  };

  // Update map when tours or selected date changes
  useEffect(() => {
    if (!map || !tours.length) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.gm-style img[src*="data:image/svg"]');
    markers.forEach(marker => marker.remove());

    // Filter tours by selected date if provided
    const selectedDateStr = selectedDate?.toISOString().split('T')[0];
    
    tours.forEach(async (tour) => {
      try {
        // Fetch tour dates for this tour
        const response = await fetch(`/api/tours/${tour.id}/dates`);
        const tourDates = await response.json();

        // Add markers for tour dates with venues
        tourDates.forEach((date: any) => {
          if (!date.venueId) return;
          
          // Skip if date doesn't match selected date
          const tourDateStr = new Date(date.date).toISOString().split('T')[0];
          if (selectedDate && tourDateStr !== selectedDateStr) return;

          // Fetch venue details
          fetch(`/api/venues/${date.venueId}`)
            .then(res => res.json())
            .then(venue => {
              if (!venue) return;

              const lat = parseFloat(venue.latitude);
              const lng = parseFloat(venue.longitude);

              if (isNaN(lat) || isNaN(lng)) return;

              // Determine marker color based on status
              let markerColor = '#ECB22E'; // Yellow for pending
              if (date.status === 'confirmed') {
                markerColor = '#2EB67D'; // Green for confirmed
              } else if (date.status === 'open') {
                markerColor = '#E01E5A'; // Red for open dates
              }

              // Add marker
              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map,
                title: `${tour.name} - ${parseDateSafe(date.date).toLocaleDateString()}`,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: markerColor,
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                },
              });

              // Add click handler
              marker.addListener('click', () => {
                onTourClick(tour);
              });
            })
            .catch(err => console.error('Error fetching venue:', err));
        });
      } catch (error) {
        console.error('Error fetching tour dates:', error);
      }
    });
  }, [map, tours, onTourClick]);

  if (error || isError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-500 mb-2">Failed to load map</p>
        <p className="text-sm text-muted-foreground">Please check your API key configuration</p>
      </div>
    );
  }

  if (isLoading || isLoadingApiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full relative">
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  );
};

export default VenueMapView;