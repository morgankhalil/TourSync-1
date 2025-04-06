import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTours } from "@/hooks/useTours";
import VenueDiscoveryPanel from "../venue/VenueDiscoveryPanel";
import VenueDetailModal from "../venue/VenueDetailModal";
import { Venue, TourDate } from "@/types";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isVenueDetailOpen, setIsVenueDetailOpen] = useState(false);
  const [isDiscoveryPanelOpen, setIsDiscoveryPanelOpen] = useState(false);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDate | null>(null);
  const [venues, setVenues] = useState<Map<number, Venue>>(new Map());

  const { activeTour } = useTours();

  // Define handler functions
  const handleOpenDiscoveryPanel = useCallback((tourDate: TourDate) => {
    setSelectedTourDate(tourDate);
    setIsDiscoveryPanelOpen(true);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setIsVenueDetailOpen(true);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  }, [map]);

  // Fetch tour dates
  const { data: tourDates } = useQuery<TourDate[]>({
    queryKey: activeTour ? [`/api/tours/${activeTour.id}/dates`] : [],
    enabled: !!activeTour,
  });

  // Fetch venues
  const { data: venuesList } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // Fetch Google Maps API key from server
  const { data: mapsApiData, isLoading: isLoadingApiKey } = useQuery<{ apiKey: string }>({
    queryKey: ['/api/maps/api-key'],
  });

  // Process venues into a map for quick lookup
  useEffect(() => {
    if (venuesList) {
      const venueMap = new Map<number, Venue>();
      venuesList.forEach(venue => {
        venueMap.set(venue.id, venue);
      });
      setVenues(venueMap);
    }
  }, [venuesList]);

  // Find an open date to show in the discovery panel
  const openDate = tourDates?.find(td => td.isOpenDate);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google && mapsApiData?.apiKey && !isLoadingApiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiData.apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      window.initMap = () => {
        if (mapRef.current) {
          const newMap = new window.google.maps.Map(mapRef.current, {
            center: { lat: 41.0, lng: -87.0 },
            zoom: 5,
            disableDefaultUI: true,
            zoomControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });
          setMap(newMap);
        }
      };
      document.head.appendChild(script);
    } else if (mapRef.current && !map && window.google) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 41.0, lng: -87.0 },
        zoom: 5,
        disableDefaultUI: true,
        zoomControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(newMap);
    }

    return () => {
      window.initMap = () => {};
    };
  }, [mapsApiData, isLoadingApiKey, map]);

  // Draw route on map when tour dates are loaded
  useEffect(() => {
    if (map && tourDates && tourDates.length > 0 && venues.size > 0) {
      // Clear previous markers and routes
      // First, remove any existing markers
      if (window.google && window.google.maps) {
        const allMarkers = document.querySelectorAll('.gm-style img[src*="data:image/svg"]');
        allMarkers.forEach(marker => marker.remove());
      }

      // Filter out tour dates with venues
      const locationsWithVenues = tourDates.filter(td => td.venueId && venues.has(td.venueId));

      if (locationsWithVenues.length === 0) return;

      const pathCoordinates: {lat: number, lng: number}[] = [];

      // Add markers for each location
      locationsWithVenues.forEach(td => {
        if (!td.venueId) return;

        const venue = venues.get(td.venueId);
        if (!venue) return;

        // Convert latitude and longitude from string to number
        const lat = parseFloat(venue.latitude);
        const lng = parseFloat(venue.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const position = { lat, lng };
        pathCoordinates.push(position);

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: `${venue.name} - ${td.city}, ${td.state}`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${td.status === 'confirmed' ? '#2EB67D' : td.status === 'pending' ? '#ECB22E' : '#4A154B'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="10" r="8"/>
                <path d="M12 18l-6 6"/>
                <path d="M18 24l-6-6"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(30, 30)
          }
        });

        marker.addListener('click', () => {
          // Show venue details when marker is clicked
          handleVenueSelect(venue);
        });
      });

      // Add markers for open dates (no venue)
      const openDates = tourDates.filter(td => td.isOpenDate);
      openDates.forEach(td => {
        // For open dates, place them roughly at geographic center based on city/state
        // Here, we'd normally use geocoding, but for this demo we'll use a simple approximation

        // Use a predefined mapping for common US cities
        const cityCoordinates: Record<string, {lat: number, lng: number}> = {
          'New York': { lat: 40.7128, lng: -74.0060 },
          'Boston': { lat: 42.3601, lng: -71.0589 },
          'Chicago': { lat: 41.8781, lng: -87.6298 },
          'Detroit': { lat: 42.3314, lng: -83.0458 },
          'Cleveland': { lat: 41.4993, lng: -81.6944 },
          'Minneapolis': { lat: 44.9778, lng: -93.2650 }
        };

        const coords = cityCoordinates[td.city] || { lat: 40.0, lng: -85.0 }; // Default if city not found

        const marker = new window.google.maps.Marker({
          position: coords,
          map,
          title: `Open Date: ${td.city}, ${td.state}`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A154B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="10" r="8" stroke-dasharray="4"/>
                <path d="M12 18l-6 6"/>
                <path d="M18 24l-6-6"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(30, 30)
          }
        });

        marker.addListener('click', () => {
          handleOpenDiscoveryPanel(td);
        });
      });

      // Only create path if we have multiple points
      if (pathCoordinates.length >= 2) {
        const tourPath = new window.google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: '#4A154B',
          strokeOpacity: 1.0,
          strokeWeight: 3
        });

        tourPath.setMap(map);

        // Fit bounds to show all markers
        const bounds = new window.google.maps.LatLngBounds();
        pathCoordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds);
      } else if (pathCoordinates.length === 1) {
        // If only one point, center on it with a reasonable zoom level
        map.setCenter(pathCoordinates[0]);
        map.setZoom(10);
      }
    }
  }, [map, tourDates, venues, handleOpenDiscoveryPanel, handleVenueSelect]);

  // Handle loading and error states
  const isLoading = isLoadingApiKey;
  const hasError = !mapsApiData?.apiKey && !isLoadingApiKey;

  return (
    <div className="flex-1 relative">
      <div className="map-container w-full h-full relative">
        {!isLoading && !hasError && (
          <div className="absolute top-4 left-4 z-10 bg-white rounded-md shadow-card p-2">
            <button className="p-1 text-gray-500 hover:text-gray-700" onClick={handleZoomIn}>
              <ZoomIn size={20} />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700" onClick={handleZoomOut}>
              <ZoomOut size={20} />
            </button>
          </div>
        )}

        {/* The map container */}
        <div ref={mapRef} className="h-[300px] md:h-[500px] w-full"></div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary font-medium">Loading Map...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center max-w-md p-6">
              <p className="text-red-500 font-medium mb-4">Unable to load Google Maps</p>
              <p className="text-gray-600 mb-4">
                We're having trouble loading the map. Please ensure you have a valid Google Maps API key configured.
              </p>
            </div>
          </div>
        )}

        {/* Show discovery panel when an open date is clicked */}
        {openDate && !isLoading && !hasError && (
          <button 
            onClick={() => handleOpenDiscoveryPanel(openDate)}
            className="absolute top-4 right-4 z-10 bg-white rounded-md shadow-card p-2 text-primary font-medium"
          >
            Find Venues for Open Date
          </button>
        )}

        {/* Venue Discovery Panel */}
        <VenueDiscoveryPanel 
          isOpen={isDiscoveryPanelOpen}
          onClose={() => setIsDiscoveryPanelOpen(false)}
          date={selectedTourDate?.date}
          fromCity="Chicago"
          toCity="Minneapolis"
          onVenueSelect={handleVenueSelect}
        />

        {/* Venue Detail Modal */}
        <VenueDetailModal 
          venue={selectedVenue}
          isOpen={isVenueDetailOpen}
          onClose={() => setIsVenueDetailOpen(false)}
        />
      </div>
    </div>
  );
};

export default MapView;