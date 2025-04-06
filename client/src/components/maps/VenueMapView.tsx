import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tour, Venue } from '../../types';
import { Spinner } from '../ui/spinner';

// Define global google maps type
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface VenueMapViewProps {
  venue: Venue;
  onTourClick: (tour: Tour) => void;
}

const VenueMapView = ({ venue, onTourClick }: VenueMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  
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

  // Load the Google Maps API
  useEffect(() => {
    async function loadGoogleMapsApi() {
      try {
        if (!window.google) {
          setIsLoading(true);
          
          // Fetch API key from backend
          const response = await fetch('/api/maps/api-key');
          const data = await response.json();
          
          if (!data.apiKey) {
            console.error('No Google Maps API key available');
            setIsLoading(false);
            throw new Error('Google Maps API key not found. Please add GOOGLE_MAPS_API_KEY to your secrets.');
          }
          console.log('Maps API key loaded successfully');
          
          // Set up the callback for when the API loads
          window.initMap = () => {
            setIsLoading(false);
            initializeMap();
          };
          
          // Create and append the script tag
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initMap&libraries=places&loading=async`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
          
          return () => {
            // Clean up
            window.initMap = () => {}; // Assign empty function instead of undefined
            if (document.head.contains(script)) {
              document.head.removeChild(script);
            }
          };
        } else {
          // Google Maps is already loaded
          setIsLoading(false);
          initializeMap();
        }
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        setIsLoading(false);
      }
    }
    
    loadGoogleMapsApi();
  }, []);

  // Fetch nearby tours for the venue
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

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    
    try {
      // Check if venue has valid coordinates
      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid venue coordinates:', venue);
        return;
      }
      
      const venuePosition = { lat, lng };
      
      const mapOptions = {
        center: venuePosition,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      };
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // Add marker for the venue
      new window.google.maps.Marker({
        position: venuePosition,
        map: newMap,
        title: venue.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4A154B', // Purple marker for venue
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
      });
      
      // Add info window for the venue
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin-top: 0;">${venue.name}</h3>
            <p>${venue.address}, ${venue.city}, ${venue.state} ${venue.zipCode}</p>
            <p>Capacity: ${venue.capacity || 'Unknown'}</p>
          </div>
        `,
      });
      
      // Open the info window by default
      infoWindow.open(newMap, newMap.markers?.[0]);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [venue]);

  // Update map when tours change
  useEffect(() => {
    if (!map || !tours.length) return;
    
    // Display nearby tours on the map
    tours.forEach(async (tour) => {
      try {
        // Fetch tour dates for this tour
        const response = await fetch(`/api/tours/${tour.id}/dates`);
        const tourDates = await response.json();
        
        // Add markers for tour dates with venues
        tourDates.forEach((date: any) => {
          if (!date.venueId) return;
          
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

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

export default VenueMapView;