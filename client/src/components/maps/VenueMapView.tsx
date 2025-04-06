import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Venue, Tour, TourDate } from "@/types";
import { Loader2 } from "lucide-react";

// Extend the window object with Google Maps properties
declare global {
  interface Window {
    google: any;
    initMap?: (() => void) | undefined;
  }
}

interface VenueMapViewProps {
  venue: Venue;
  onTourClick: (tour: Tour) => void;
}

const VenueMapView = ({ venue, onTourClick }: VenueMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const infoWindowRef = useRef<any>(null);
  const mapMarkersRef = useRef<any[]>([]);
  
  const [map, setMap] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Fetch nearby tours
  const { data: nearbyTours, isLoading: toursLoading } = useQuery<Tour[]>({
    queryKey: ['/api/venues', venue.id, 'nearby-tours'],
  });
  
  // Fetch all tour dates for the tours
  const { data: allTourDates } = useQuery<TourDate[]>({
    queryKey: ['/api/tours/all-dates'],
    enabled: !!nearbyTours && nearbyTours.length > 0,
  });
  
  // Get API key from server
  const { data: apiKeyData } = useQuery<{apiKey: string}>({
    queryKey: ['/api/maps/api-key'],
  });
  
  // Load Google Maps API
  useEffect(() => {
    if (!apiKeyData || !apiKeyData.apiKey) return;
    
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyData.apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = () => {
        setMapLoaded(true);
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
        // Make window.initMap optional for TypeScript
        if (window.initMap) {
          delete window.initMap;
        }
      };
    } else {
      setMapLoaded(true);
    }
  }, [apiKeyData]);
  
  // Initialize map once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    // Create map centered on the venue
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { 
        lat: parseFloat(venue.latitude), 
        lng: parseFloat(venue.longitude) 
      },
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
    });
    
    setMap(mapInstance);
    
    // Create info window for markers
    infoWindowRef.current = new window.google.maps.InfoWindow();
    
    // Add a marker for the venue
    new window.google.maps.Marker({
      position: { 
        lat: parseFloat(venue.latitude), 
        lng: parseFloat(venue.longitude) 
      },
      map: mapInstance,
      title: venue.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#4A154B", // primary color
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 1000, // Keep venue on top
    });
    
  }, [mapLoaded, venue]);
  
  // Update markers when tour data changes
  useEffect(() => {
    if (!map || !nearbyTours || !allTourDates) return;
    
    // Clear existing markers
    mapMarkersRef.current.forEach(marker => marker.setMap(null));
    mapMarkersRef.current = [];
    
    // Group tour dates by tour
    const tourDatesByTour = new Map<number, TourDate[]>();
    allTourDates.forEach(date => {
      if (!tourDatesByTour.has(date.tourId)) {
        tourDatesByTour.set(date.tourId, []);
      }
      tourDatesByTour.get(date.tourId)?.push(date);
    });
    
    // Create markers for each nearby tour
    nearbyTours.forEach(tour => {
      const tourDates = tourDatesByTour.get(tour.id) || [];
      
      // Only process tours with dates
      if (tourDates.length === 0) return;
      
      // Add markers for confirmed and pending dates
      tourDates
        .filter(date => date.venueId && !date.isOpenDate)
        .forEach(date => {
          // Find the tour this date belongs to
          const tourForDate = nearbyTours.find(t => t.id === date.tourId);
          if (!tourForDate) return;
          
          // Determine marker color based on status
          let markerColor = "#4A154B"; // Default purple
          if (date.status === "confirmed") {
            markerColor = "#2EB67D"; // Green
          } else if (date.status === "pending") {
            markerColor = "#ECB22E"; // Yellow
          }
          
          // Create the marker
          const marker = new window.google.maps.Marker({
            position: { 
              lat: parseFloat(venue.latitude), 
              lng: parseFloat(venue.longitude) 
            }, // We'll need to get venue coordinates for this date
            map,
            title: `${tourForDate.name} @ ${date.city}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });
          
          // Add click listener to show info
          marker.addListener("click", () => {
            const contentString = `
              <div class="p-2">
                <h5 class="font-bold">${tourForDate.name}</h5>
                <p>${date.city}, ${date.state}</p>
                <p>Date: ${new Date(date.date).toLocaleDateString()}</p>
                <p>Status: ${date.status}</p>
              </div>
            `;
            
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(map, marker);
            
            // Option to view tour details
            // This would be cleaner with an actual button in the info window,
            // but for simplicity we'll just set up this handler
            marker.addListener("dblclick", () => {
              onTourClick(tourForDate);
            });
          });
          
          mapMarkersRef.current.push(marker);
        });
    });
    
  }, [map, nearbyTours, allTourDates, venue, onTourClick]);
  
  return (
    <div className="h-full relative">
      {toursLoading && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-80 p-2 text-center">
          <Loader2 className="animate-spin inline-block mr-2" size={16} />
          <span>Loading nearby tours...</span>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
};

export default VenueMapView;