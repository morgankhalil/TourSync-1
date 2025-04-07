import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader, MarkerClusterer } from '@react-google-maps/api';
import { useEnvVars } from '../../services/env-service';

// Enhanced location interface to support tour grouping and band images
interface EnhancedLocation {
  lat: number;
  lng: number;
  name: string;
  tourId?: string | number; // Identifier to group locations by tour
  bandName?: string; // Name of the band for this location
  imageUrl?: string; // Profile picture URL for the band
  isVenue?: boolean; // Flag to identify venue locations
  date?: string; // Date of the event for ordering in path
}

interface InteractiveMapViewProps {
  locations: EnhancedLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  showPaths?: boolean; // Whether to draw paths connecting tour points
}

// Generate a deterministic color based on a string (tourId)
function generateTourColor(tourId: string | number | undefined): string {
  if (!tourId) return '#ff0000'; // Default color red
  
  // Simple hash function to generate consistent colors from tour IDs
  const stringId = String(tourId);
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use a predefined high-contrast color palette for better visibility
  // These are optimized for Google Maps and designed to be visually distinct
  const colorPalette = [
    '#D81B60', // Pink
    '#1E88E5', // Blue
    '#43A047', // Green
    '#8E24AA', // Purple
    '#E53935', // Red
    '#FF8F00', // Orange
    '#3949AB', // Indigo
    '#039BE5', // Light Blue
    '#00ACC1', // Cyan
    '#00897B', // Teal
    '#7CB342', // Light Green
    '#C0CA33', // Lime
    '#FDD835', // Yellow
    '#FFB300', // Amber
    '#F4511E', // Deep Orange
    '#6D4C41', // Brown
    '#757575', // Grey
    '#546E7A'  // Blue Grey
  ];
  
  // Use hash to select a color
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

export function InteractiveMapView({
  locations,
  center,
  zoom = 6,
  showPaths = true
}: InteractiveMapViewProps) {
  const { data: envVars, isLoading: envLoading, error: envError } = useEnvVars();
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Reference to track selected marker
  const markerRefs = useRef<Record<string, google.maps.Marker>>({});
  
  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: envVars?.GOOGLE_MAPS_API_KEY || '',
  });
  
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);
  
  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && locations.length > 0) {
      // If we have locations, fit bounds to show all markers
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
      
      // Adjust zoom if it's too high (e.g., when only one location)
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom() > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, locations]);
  
  // Handle marker click - open info window
  const handleMarkerClick = (markerId: string) => {
    if (activeMarker === markerId) {
      setActiveMarker(null);
    } else {
      setActiveMarker(markerId);
    }
  };
  
  if (envLoading) {
    return <div className="flex items-center justify-center h-full">Loading environment variables...</div>;
  }
  
  if (envError || !envVars) {
    return <div className="flex items-center justify-center h-full text-red-500">
      Error loading environment variables. Maps cannot be displayed.
    </div>;
  }
  
  if (loadError) {
    return <div className="flex items-center justify-center h-full text-red-500">
      Error loading Google Maps. Please check your internet connection.
    </div>;
  }
  
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading maps...</div>;
  }
  
  if (errorMsg) {
    return <div className="flex items-center justify-center h-full text-amber-500">{errorMsg}</div>;
  }
  
  if (locations.length === 0) {
    return <div className="flex items-center justify-center h-full text-amber-500">No locations to display</div>;
  }
  
  // Separate venues from other locations
  const venueLocations = locations.filter(loc => loc.isVenue);
  const bandLocations = locations.filter(loc => !loc.isVenue);
  
  // Group locations by tour
  const tourGroups = new Map<string | number | undefined, EnhancedLocation[]>();
  
  bandLocations.forEach(location => {
    const tourId = location.tourId || 'unknown';
    if (!tourGroups.has(tourId)) {
      tourGroups.set(tourId, []);
    }
    const locationGroup = tourGroups.get(tourId);
    if (locationGroup) {
      locationGroup.push(location);
    }
  });
  
  // Default center if not provided
  const mapCenter = center || (locations.length > 0 ? locations[0] : { lat: 37.0902, lng: -95.7129 });
  
  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* Venue markers */}
        {venueLocations.map((venue, index) => {
          const markerId = `venue-${index}`;
          return (
            <React.Fragment key={markerId}>
              <Marker
                position={{ lat: venue.lat, lng: venue.lng }}
                label={{ text: "V", color: "white", fontWeight: "bold" }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#1E88E5",
                  fillOpacity: 1,
                  strokeWeight: 0,
                  scale: 12
                }}
                onClick={() => handleMarkerClick(markerId)}
              />
              {activeMarker === markerId && (
                <InfoWindow
                  position={{ lat: venue.lat, lng: venue.lng }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="min-w-[150px]">
                    <h3 className="font-bold mb-1">{venue.name}</h3>
                    <p className="text-sm text-gray-600">Venue</p>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })}
        
        {/* Tour groups */}
        {Array.from(tourGroups.entries()).map(([tourId, tourLocations], groupIndex) => {
          // Sort locations by date if available
          const sortedLocations = [...tourLocations].sort((a, b) => {
            if (a.date && b.date) {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            return 0;
          });
          
          // Get color for this tour
          const tourColor = generateTourColor(tourId);
          
          return (
            <React.Fragment key={`tour-${tourId}`}>
              {/* Path connecting tour points if enabled */}
              {showPaths && sortedLocations.length > 1 && (
                <Polyline
                  path={sortedLocations.map(loc => ({ lat: loc.lat, lng: loc.lng }))}
                  options={{
                    strokeColor: tourColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                  }}
                />
              )}
              
              {/* Markers for each location on this tour */}
              {sortedLocations.map((loc, locIndex) => {
                const markerId = `tour-${tourId}-loc-${locIndex}`;
                const bandInitial = loc.bandName ? loc.bandName.charAt(0).toUpperCase() : String.fromCharCode(65 + groupIndex);
                
                return (
                  <React.Fragment key={markerId}>
                    <Marker
                      position={{ lat: loc.lat, lng: loc.lng }}
                      label={{ text: bandInitial, color: "white", fontWeight: "bold" }}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: tourColor,
                        fillOpacity: 1,
                        strokeWeight: 0,
                        scale: 10
                      }}
                      onClick={() => handleMarkerClick(markerId)}
                    />
                    {activeMarker === markerId && (
                      <InfoWindow
                        position={{ lat: loc.lat, lng: loc.lng }}
                        onCloseClick={() => setActiveMarker(null)}
                      >
                        <div className="min-w-[150px]">
                          {loc.imageUrl && (
                            <img 
                              src={loc.imageUrl} 
                              alt={loc.bandName || "Band"} 
                              className="w-12 h-12 object-cover rounded-full mb-2 mx-auto"
                            />
                          )}
                          <h3 className="font-bold mb-1">{loc.name}</h3>
                          {loc.bandName && <p className="text-sm">{loc.bandName}</p>}
                          {loc.date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(loc.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </GoogleMap>
      
      {/* Enhanced Legend with Tour Grouping - Now positioned on top of the interactive map */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-lg z-10 max-h-[320px] overflow-y-auto min-w-[200px] border border-gray-200">
        <h3 className="text-sm font-bold mb-2 border-b pb-1">Map Legend</h3>
        
        {/* Venue locations */}
        {venueLocations.map((venue, i) => (
          <div key={`venue-${i}`} className="flex items-center mb-3">
            <div className="h-4 w-4 bg-blue-600 rounded-full mr-2 flex-shrink-0"></div>
            <span className="text-sm font-semibold">{venue.name}</span>
          </div>
        ))}
        
        {/* Divider if we have both venues and bands */}
        {venueLocations.length > 0 && Array.from(tourGroups.keys()).length > 0 && (
          <div className="border-t border-gray-200 my-2"></div>
        )}
        
        {/* Label for bands section */}
        {Array.from(tourGroups.keys()).length > 0 && (
          <h4 className="text-xs font-semibold text-gray-500 mb-2">BANDS ON TOUR</h4>
        )}
        
        {/* Tour groups - each with a distinct color-coded block */}
        {Array.from(tourGroups.entries()).map(([tourId, locations], groupIndex) => {
          const color = generateTourColor(tourId);
          const bandName = locations[0]?.bandName || `Tour ${groupIndex + 1}`;
          
          return (
            <div key={`tour-${tourId}`} className="mb-3 p-2 rounded-md" style={{backgroundColor: `${color}20`}}>
              <div className="flex items-center mb-1">
                {locations[0]?.imageUrl ? (
                  <img 
                    src={locations[0].imageUrl} 
                    alt={bandName}
                    className="h-6 w-6 rounded-full mr-2 object-cover border-2"
                    style={{borderColor: color}}
                  />
                ) : (
                  <div 
                    className="h-6 w-6 rounded-full mr-2 flex-shrink-0" 
                    style={{backgroundColor: color}}
                  ></div>
                )}
                <span className="text-sm font-bold">{bandName}</span>
              </div>
              
              {/* Show locations for this tour with better labeling */}
              <div className="pl-8 mt-1">
                {locations.map((loc, locIndex) => {
                  // Get the same label we use on the map
                  const bandInitial = loc.bandName ? loc.bandName.charAt(0).toUpperCase() : String.fromCharCode(65 + groupIndex);
                  
                  return (
                    <div key={`loc-${locIndex}`} className="text-xs text-gray-700 flex items-start mb-1">
                      <span 
                        className="mr-1 w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold" 
                        style={{backgroundColor: color}}
                      >{bandInitial}</span>
                      <span>{loc.name}</span>
                      {loc.date && <span className="text-gray-500 ml-1">({new Date(loc.date).toLocaleDateString()})</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}