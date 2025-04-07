import React, { useEffect, useState } from 'react';
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

interface StaticMapViewProps {
  locations: EnhancedLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  showPaths?: boolean; // Whether to draw paths connecting tour points
}

// Generate a deterministic color based on a string (tourId)
function generateTourColor(tourId: string | number | undefined): string {
  if (!tourId) return 'red'; // Default color
  
  // Simple hash function to generate consistent colors from tour IDs
  const stringId = String(tourId);
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // List of distinguishable colors for tours
  const colors = [
    'red', 'green', 'purple', 'orange', 'brown',
    'yellow', 'pink', 'black', 'gray', 'white'
  ];
  
  // Use hash to select a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function StaticMapView({
  locations,
  center,
  zoom = 6,
  showPaths = true
}: StaticMapViewProps) {
  const { data: envVars, isLoading: envLoading, error: envError } = useEnvVars();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  
  useEffect(() => {
    // Don't proceed until we have environment variables
    if (envLoading || envError || !envVars?.GOOGLE_MAPS_API_KEY) {
      return;
    }
    
    try {
      if (locations.length === 0) {
        setErrorMsg("No locations to display");
        return;
      }
      
      // If we have a center specified, use it, otherwise use the first location
      const mapCenter = center || locations[0];
      
      // Use the API key from our environment variables service
      const apiKey = envVars.GOOGLE_MAPS_API_KEY;
      
      // For debugging
      console.log("Using maps API key from environment service:", apiKey ? "Key available" : "Key missing");
      
      if (!apiKey) {
        setErrorMsg("Google Maps API key is missing");
        return;
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
        tourGroups.get(tourId)?.push(location);
      });
      
      // Create venue markers with blue color
      const venueMarkers = venueLocations.map((venue, idx) => {
        return `markers=color:blue%7Clabel:V%7C${venue.lat},${venue.lng}`;
      }).join('&');
      
      // Create tour-specific markers with different colors
      let tourMarkers = '';
      let pathParams = '';
      
      Array.from(tourGroups.entries()).forEach(([tourId, tourLocations], groupIndex) => {
        // Sort locations by date if available
        const sortedLocations = [...tourLocations].sort((a, b) => {
          if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return 0;
        });
        
        // Get color for this tour
        const color = generateTourColor(tourId);
        
        // Create markers for this tour using custom icons if available
        const markerParams = sortedLocations.map((loc, idx) => {
          const label = String.fromCharCode(65 + idx);
          
          // If image URL is available, we could use it as a custom marker
          // But for simplicity with Static Maps API, we'll use standard markers with tour-specific colors
          return `markers=color:${color}%7Clabel:${label}%7C${loc.lat},${loc.lng}`;
        }).join('&');
        
        tourMarkers += markerParams + '&';
        
        // Create path connecting tour points if enabled
        if (showPaths && sortedLocations.length > 1) {
          const pathCoords = sortedLocations.map(loc => `${loc.lat},${loc.lng}`).join('|');
          pathParams += `path=color:${color}%7Cweight:2%7C${pathCoords}&`;
        }
      });
      
      // Build the static map URL with all markers and paths
      const markerParams = `${venueMarkers ? venueMarkers + '&' : ''}${tourMarkers}${pathParams}`;
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=${zoom}&size=640x400&scale=2&${markerParams}key=${apiKey}`;
      
      console.log("Generated map URL (truncated):", url.substring(0, 100) + "...");
      setMapUrl(url);
      
    } catch (err) {
      console.error("Error generating map URL:", err);
      setErrorMsg("Error generating map");
    }
  }, [locations, center, zoom, showPaths, envVars, envLoading, envError]);
  
  if (envLoading) {
    return <div className="flex items-center justify-center h-full">Loading environment variables...</div>;
  }
  
  if (envError || !envVars) {
    return <div className="flex items-center justify-center h-full text-red-500">
      Error loading environment variables. Maps cannot be displayed.
    </div>;
  }
  
  if (errorMsg) {
    return <div className="flex items-center justify-center h-full text-amber-500">{errorMsg}</div>;
  }
  
  // Group locations by tour for the legend
  const tourGroups = new Map<string | number | undefined, EnhancedLocation[]>();
  locations.filter(loc => !loc.isVenue).forEach(location => {
    const tourId = location.tourId || 'unknown';
    if (!tourGroups.has(tourId)) {
      tourGroups.set(tourId, []);
    }
    tourGroups.get(tourId)?.push(location);
  });
  
  return (
    <div className="relative h-full w-full flex flex-col">
      {mapUrl ? (
        <>
          <img 
            src={mapUrl} 
            alt="Map of tour locations" 
            className="w-full h-full object-contain border border-gray-200 rounded-md"
            onError={(e) => {
              console.error("Map image failed to load");
              setErrorMsg("Failed to load map image");
            }}
          />
          
          {/* Enhanced Legend with Tour Grouping */}
          <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md z-10 max-h-[300px] overflow-y-auto">
            {/* Venue locations */}
            {locations.filter(loc => loc.isVenue).map((venue, i) => (
              <div key={`venue-${i}`} className="flex items-center mb-2">
                <div className="h-3 w-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-xs font-semibold">{venue.name}</span>
              </div>
            ))}
            
            {/* Divider if we have both venues and bands */}
            {locations.some(loc => loc.isVenue) && Array.from(tourGroups.keys()).length > 0 && (
              <div className="border-t border-gray-200 my-2"></div>
            )}
            
            {/* Tour groups - limited to 5 to prevent overcrowding */}
            {Array.from(tourGroups.entries()).slice(0, 5).map(([tourId, locations], groupIndex) => {
              const color = generateTourColor(tourId);
              const bandName = locations[0]?.bandName || `Tour ${groupIndex + 1}`;
              
              return (
                <div key={`tour-${tourId}`} className="mb-2">
                  <div className="flex items-center mb-1">
                    {locations[0]?.imageUrl ? (
                      <img 
                        src={locations[0].imageUrl} 
                        alt={bandName}
                        className="h-4 w-4 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div 
                        className="h-4 w-4 rounded-full mr-2" 
                        style={{backgroundColor: color}}
                      ></div>
                    )}
                    <span className="text-xs font-semibold">{bandName}</span>
                  </div>
                  
                  {/* Show first 2 locations for this tour */}
                  <div className="pl-6">
                    {locations.slice(0, 2).map((loc, locIndex) => (
                      <div key={`loc-${locIndex}`} className="text-xs text-gray-600 flex items-center">
                        <span className="mr-1">{String.fromCharCode(65 + locIndex)}:</span>
                        <span>{loc.name}</span>
                      </div>
                    ))}
                    
                    {/* Show count if more locations */}
                    {locations.length > 2 && (
                      <div className="text-xs text-gray-500">
                        + {locations.length - 2} more stops
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Show count if more than 5 tours */}
            {Array.from(tourGroups.keys()).length > 5 && (
              <div className="text-xs text-gray-500 mt-1">
                + {Array.from(tourGroups.keys()).length - 5} more tours
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          Loading map...
        </div>
      )}
    </div>
  );
}