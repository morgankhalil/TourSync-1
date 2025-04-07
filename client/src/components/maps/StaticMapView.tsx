import React, { useEffect, useState } from 'react';

interface SimpleLocation {
  lat: number;
  lng: number;
  name: string;
}

interface StaticMapViewProps {
  locations: SimpleLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function StaticMapView({
  locations,
  center,
  zoom = 6
}: StaticMapViewProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  
  useEffect(() => {
    try {
      if (locations.length === 0) {
        setErrorMsg("No locations to display");
        return;
      }
      
      // If we have a center specified, use it, otherwise use the first location
      const mapCenter = center || locations[0];
      
      // This is the direct API key from the environment (not from import.meta which might not work)
      // We'll pass it directly, avoiding any issues with Vite's import.meta.env
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
                     (window as any).VITE_GOOGLE_MAPS_API_KEY || 
                     document.querySelector('meta[name="google-maps-key"]')?.getAttribute('content');
      
      // For debugging
      console.log("Using maps API key:", apiKey ? "Key available" : "Key missing");
      
      if (!apiKey) {
        setErrorMsg("Google Maps API key is missing");
        return;
      }
      
      // Create separate marker strings with specific colors
      const venueMarker = `markers=color:blue%7Clabel:V%7C${locations[0].lat},${locations[0].lng}`;
      
      // Create markers for other locations
      const otherMarkers = locations.slice(1).map((loc, idx) => {
        return `markers=color:red%7Clabel:${String.fromCharCode(65 + idx)}%7C${loc.lat},${loc.lng}`;
      }).join('&');
      
      // Build the static map URL with all markers
      const markerParams = `${venueMarker}&${otherMarkers}`;
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=${zoom}&size=640x400&scale=2&${markerParams}&key=${apiKey}`;
      
      console.log("Generated map URL (truncated):", url.substring(0, 100) + "...");
      setMapUrl(url);
      
    } catch (err) {
      console.error("Error generating map URL:", err);
      setErrorMsg("Error generating map");
    }
  }, [locations, center, zoom]);
  
  if (errorMsg) {
    return <div className="flex items-center justify-center h-full">{errorMsg}</div>;
  }
  
  return (
    <div className="relative h-full w-full flex flex-col">
      {mapUrl ? (
        <>
          <img 
            src={mapUrl} 
            alt="Map of tour locations" 
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error("Map image failed to load");
              setErrorMsg("Failed to load map image");
            }}
          />
          
          {/* Legend */}
          {locations.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md z-10">
              {/* Venue */}
              <div className="flex items-center mb-1">
                <div className="h-3 w-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-xs">{locations[0].name} (V)</span>
              </div>
              
              {/* Band locations (limit to 5 to prevent overcrowding) */}
              {locations.slice(1, 6).map((location, i) => (
                <div key={i} className="flex items-center mb-1">
                  <div className="h-3 w-3 bg-red-600 rounded-full mr-2"></div>
                  <span className="text-xs">{location.name} ({String.fromCharCode(65 + i)})</span>
                </div>
              ))}
              
              {/* Show count if more than 5 additional locations */}
              {locations.length > 6 && (
                <div className="text-xs text-gray-500 mt-1">
                  + {locations.length - 6} more locations
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">Loading map...</div>
      )}
    </div>
  );
}