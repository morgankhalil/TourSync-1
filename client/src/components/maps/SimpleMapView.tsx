import React, { useRef, useEffect, useState } from 'react';

// Add the necessary type definitions for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: typeof google.maps.Map;
        Marker: typeof google.maps.Marker;
        InfoWindow: typeof google.maps.InfoWindow;
        LatLngBounds: typeof google.maps.LatLngBounds;
        places: any;
      }
    }
  }
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface SimpleLocation {
  lat: number;
  lng: number;
  name: string;
}

interface SimpleMapViewProps {
  locations: SimpleLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function SimpleMapView({ 
  locations, 
  center, 
  zoom = 6 
}: SimpleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  
  const mapCenter = center || (locations.length > 0 ? locations[0] : { lat: 40, lng: -74 });

  // Init map
  useEffect(() => {
    if (!mapRef.current) return;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return;
    }
    
    // Check if Maps API is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load the Google Maps script if it's not loaded yet
      const googleMapScript = document.createElement('script');
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      googleMapScript.onload = initMap;
      document.head.appendChild(googleMapScript);
    }

    return () => {
      // Clean up markers
      markers.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Function to initialize the map
  const initMap = () => {
    if (!mapRef.current) return;
    
    const mapOptions = {
      center: mapCenter,
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    };

    const newMap = new google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);
    
    // Create info window once
    const newInfoWindow = new google.maps.InfoWindow();
    setInfoWindow(newInfoWindow);
    
    // Add markers
    const newMarkers: google.maps.Marker[] = [];
    
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: newMap,
        title: location.name
      });
      
      marker.addListener('click', () => {
        newInfoWindow.setContent(`<div><strong>${location.name}</strong></div>`);
        newInfoWindow.open(newMap, marker);
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // Fit bounds to markers if there are multiple locations
    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      newMap.fitBounds(bounds);
    }
  };

  // Update markers when locations change
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Add new markers
    const newMarkers: google.maps.Marker[] = [];
    
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name
      });
      
      if (infoWindow) {
        marker.addListener('click', () => {
          infoWindow.setContent(`<div><strong>${location.name}</strong></div>`);
          infoWindow.open(map, marker);
        });
      }
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // Fit bounds to markers if there are multiple locations
    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      map.fitBounds(bounds);
    }
  }, [locations, map, infoWindow]);

  return (
    <div style={containerStyle} ref={mapRef}>
      {!map && <div className="flex items-center justify-center h-full">Loading map...</div>}
    </div>
  );
}