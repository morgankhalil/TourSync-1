import { useState, useEffect, useRef } from "react";
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
  
  const { activeTour } = useTours();

  // Fetch tour dates
  const { data: tourDates } = useQuery<TourDate[]>({
    queryKey: activeTour ? [`/api/tours/${activeTour.id}/dates`] : [],
    enabled: !!activeTour,
  });

  // Find an open date to show in the discovery panel
  const openDate = tourDates?.find(td => td.isOpenDate);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
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
    } else if (mapRef.current && !map) {
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
  }, []);

  // Draw route on map when tour dates are loaded
  useEffect(() => {
    if (map && tourDates && tourDates.length > 0) {
      // Clear previous markers and routes
      map.data?.forEach((feature: any) => {
        map.data.remove(feature);
      });
      
      // Filter out tour dates with venues
      const locationsWithVenues = tourDates.filter(td => !td.isOpenDate && td.venueId);
      
      if (locationsWithVenues.length < 2) return;

      // Add markers for each location
      locationsWithVenues.forEach(td => {
        // In a real app, we would use proper geocoding or stored coordinates
        // For demo, we're just creating markers at estimated coordinates
        const lat = 35 + Math.random() * 10;
        const lng = -90 + Math.random() * 10;
        
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: `${td.city}, ${td.state}`,
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
          // Open venue details when marker is clicked
          // In a real app, we would get the venue data and show it
        });
      });

      // Create a simple line between locations
      // In a real app, we would use the DirectionsService to get the actual route
      const pathCoordinates = locationsWithVenues.map(td => {
        const lat = 35 + Math.random() * 10;
        const lng = -90 + Math.random() * 10;
        return { lat, lng };
      });
      
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
    }
  }, [map, tourDates]);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleOpenDiscoveryPanel = (tourDate: TourDate) => {
    setSelectedTourDate(tourDate);
    setIsDiscoveryPanelOpen(true);
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsVenueDetailOpen(true);
  };

  return (
    <div className="flex-1 relative">
      <div className="map-container w-full relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-md shadow-card p-2">
          <button className="p-1 text-gray-500 hover:text-gray-700" onClick={handleZoomIn}>
            <ZoomIn size={20} />
          </button>
          <button className="p-1 text-gray-500 hover:text-gray-700" onClick={handleZoomOut}>
            <ZoomOut size={20} />
          </button>
        </div>
        
        {/* The map container */}
        <div ref={mapRef} className="h-full w-full"></div>
        
        {/* Show discovery panel when an open date is clicked */}
        {openDate && (
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
