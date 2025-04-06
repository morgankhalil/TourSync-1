import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import BandDetailModal from "@/components/band/BandDetailModal";
import TourDiscoveryPanel from "@/components/tour/TourDiscoveryPanel";
import { Band, Tour, TourDate } from "@/types";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const BandMapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [isBandDetailOpen, setIsBandDetailOpen] = useState(false);
  const [isDiscoveryPanelOpen, setIsDiscoveryPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bands, setBands] = useState<Map<number, Band>>(new Map());
  
  const { activeVenue } = useActiveVenue();

  // Define handler functions
  const handleOpenDiscoveryPanel = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsDiscoveryPanelOpen(true);
  }, []);
  
  const handleBandSelect = useCallback((band: Band) => {
    setSelectedBand(band);
    setIsBandDetailOpen(true);
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

  // Fetch all tour dates to display on the map
  const { data: allTourDates } = useQuery<TourDate[]>({
    queryKey: ['/api/tours/all-dates'],
  });

  // Fetch bands
  const { data: bandsList } = useQuery<Band[]>({
    queryKey: ['/api/bands'],
  });

  // Fetch tours to associate with bands and dates
  const { data: toursList } = useQuery<Tour[]>({
    queryKey: ['/api/tours'],
  });

  // Fetch Google Maps API key from server
  const { data: mapsApiData, isLoading: isLoadingApiKey } = useQuery<{ apiKey: string }>({
    queryKey: ['/api/maps/api-key'],
  });

  // Process bands into a map for quick lookup
  useEffect(() => {
    if (bandsList) {
      const bandMap = new Map<number, Band>();
      bandsList.forEach(band => {
        bandMap.set(band.id, band);
      });
      setBands(bandMap);
    }
  }, [bandsList]);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google && mapsApiData?.apiKey && !isLoadingApiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiData.apiKey}&libraries=places&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
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

  // Draw tours on map
  useEffect(() => {
    if (map && allTourDates && allTourDates.length > 0 && toursList && toursList.length > 0 && bands.size > 0) {
      // Clear previous markers and routes
      if (window.google && window.google.maps) {
        const allMarkers = document.querySelectorAll('.gm-style img[src*="data:image/svg"]');
        allMarkers.forEach(marker => marker.remove());
      }
      
      // Group tour dates by tour
      const tourDatesByTour = new Map<number, TourDate[]>();
      allTourDates.forEach(td => {
        if (!tourDatesByTour.has(td.tourId)) {
          tourDatesByTour.set(td.tourId, []);
        }
        tourDatesByTour.get(td.tourId)?.push(td);
      });
      
      // Draw each tour as a separate path with its own color
      const colors = ['#4A154B', '#2EB67D', '#ECB22E', '#E01E5A', '#36C5F0'];
      
      toursList.forEach((tour, index) => {
        const tourDates = tourDatesByTour.get(tour.id) || [];
        
        // Filter tour dates to those with cities/states
        const validTourDates = tourDates.filter(td => td.city && td.state);
        
        if (validTourDates.length === 0) return;
        
        // Get band information
        const band = bands.get(tour.bandId);
        if (!band) return;
        
        // Use a color based on the tour index
        const tourColor = colors[index % colors.length];
        
        // Create arrays for plotting
        const pathCoordinates: {lat: number, lng: number}[] = [];
        
        // Create a mapping of cities to coordinates for the US
        const cityCoordinates: Record<string, {lat: number, lng: number}> = {
          'New York': { lat: 40.7128, lng: -74.0060 },
          'Boston': { lat: 42.3601, lng: -71.0589 },
          'Chicago': { lat: 41.8781, lng: -87.6298 },
          'Detroit': { lat: 42.3314, lng: -83.0458 },
          'Cleveland': { lat: 41.4993, lng: -81.6944 },
          'Minneapolis': { lat: 44.9778, lng: -93.2650 },
          'Columbus': { lat: 39.9612, lng: -82.9988 },
          'Nashville': { lat: 36.1627, lng: -86.7816 },
          'Austin': { lat: 30.2672, lng: -97.7431 },
          'Denver': { lat: 39.7392, lng: -104.9903 },
          'Seattle': { lat: 47.6062, lng: -122.3321 },
          'Portland': { lat: 45.5051, lng: -122.6750 },
          'San Francisco': { lat: 37.7749, lng: -122.4194 },
          'Los Angeles': { lat: 34.0522, lng: -118.2437 },
          'San Diego': { lat: 32.7157, lng: -117.1611 },
          'Phoenix': { lat: 33.4484, lng: -112.0740 },
          'Las Vegas': { lat: 36.1699, lng: -115.1398 },
          'Dallas': { lat: 32.7767, lng: -96.7970 },
          'Houston': { lat: 29.7604, lng: -95.3698 },
          'Miami': { lat: 25.7617, lng: -80.1918 },
          'Atlanta': { lat: 33.7490, lng: -84.3880 },
          'Philadelphia': { lat: 39.9526, lng: -75.1652 },
          'Washington': { lat: 38.9072, lng: -77.0369 }
        };
        
        // Add markers for each tour date location
        validTourDates.forEach(td => {
          // Get coordinates for the city (or use a default if not found)
          const coords = cityCoordinates[td.city] || { 
            lat: parseFloat(activeVenue?.latitude || "41.0") + (Math.random() - 0.5) * 10, 
            lng: parseFloat(activeVenue?.longitude || "-87.0") + (Math.random() - 0.5) * 10 
          };
          
          pathCoordinates.push(coords);
          
          // Get status-specific border color
          let borderColor = '#ECB22E'; // Yellow for pending
          if (td.status === 'confirmed') {
            borderColor = '#2EB67D'; // Green for confirmed
          } else if (td.status === 'open') {
            borderColor = '#E01E5A'; // Red for open dates
          }
          
          // Create base64 encoded profile image for the band 
          // We'll use their initials with the tour color as background
          const initials = band.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
            
          const marker = new window.google.maps.Marker({
            position: coords,
            map,
            title: `${band.name} - ${td.city}, ${td.state} (${new Date(td.date).toLocaleDateString()})`,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
                  <!-- Main circle with tour color -->
                  <circle cx="21" cy="21" r="17" fill="${tourColor}" />
                  
                  <!-- Text for initials -->
                  <text x="21" y="26" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                  
                  <!-- Status border -->
                  <circle cx="21" cy="21" r="19" fill="none" stroke="${borderColor}" stroke-width="4" />
                  
                  <!-- Pointer at bottom -->
                  <path d="M21 38 L17 44 L25 44 Z" fill="${borderColor}" />
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(42, 48),
              anchor: new window.google.maps.Point(21, 44) // Anchor at the bottom pointer tip
            }
          });
          
          // Add click listener to show band details
          marker.addListener('click', () => {
            handleBandSelect(band);
          });
        });
        
        // Only create path if we have multiple points
        if (pathCoordinates.length >= 2) {
          const tourPath = new window.google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: tourColor,
            strokeOpacity: 1.0,
            strokeWeight: 3
          });
          
          tourPath.setMap(map);
        }
      });
      
      // Add marker for the active venue
      if (activeVenue) {
        const venuePosition = {
          lat: parseFloat(activeVenue.latitude),
          lng: parseFloat(activeVenue.longitude)
        };
        
        new window.google.maps.Marker({
          position: venuePosition,
          map,
          title: activeVenue.name,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(40, 40)
          },
          zIndex: 1000 // Ensure venue marker is above tour markers
        });
        
        // Center map on active venue with some offset to account for sidebar
        map.setCenter({ 
          lat: venuePosition.lat, 
          lng: venuePosition.lng + 0.5 // Offset to account for sidebar
        });
        map.setZoom(8);
      }
    }
  }, [map, allTourDates, toursList, bands, activeVenue, handleBandSelect]);

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
        <div ref={mapRef} className="h-full w-full"></div>
        
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
        
        {/* Band Detail Modal */}
        <BandDetailModal 
          band={selectedBand}
          isOpen={isBandDetailOpen}
          onClose={() => setIsBandDetailOpen(false)}
        />
        
        {/* Tour Discovery Panel */}
        <TourDiscoveryPanel 
          isOpen={isDiscoveryPanelOpen}
          onClose={() => setIsDiscoveryPanelOpen(false)}
          date={selectedDate}
          venueId={activeVenue?.id}
        />
      </div>
    </div>
  );
};

export default BandMapView;