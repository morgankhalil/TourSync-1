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
  if (!tourId) return '0xff0000'; // Default color red
  
  // Simple hash function to generate consistent colors from tour IDs
  const stringId = String(tourId);
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use a predefined high-contrast color palette for better visibility
  // These are optimized for Google Maps and designed to be visually distinct
  const colorPalette = [
    '0xD81B60', // Pink
    '0x1E88E5', // Blue
    '0x43A047', // Green
    '0x8E24AA', // Purple
    '0xE53935', // Red
    '0xFF8F00', // Orange
    '0x3949AB', // Indigo
    '0x039BE5', // Light Blue
    '0x00ACC1', // Cyan
    '0x00897B', // Teal
    '0x7CB342', // Light Green
    '0xC0CA33', // Lime
    '0xFDD835', // Yellow
    '0xFFB300', // Amber
    '0xF4511E', // Deep Orange
    '0x6D4C41', // Brown
    '0x757575', // Grey
    '0x546E7A'  // Blue Grey
  ];
  
  // Use hash to select a color
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
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
      
      // Create venue markers with larger, more prominent markers
      const venueMarkers = venueLocations.map((venue, idx) => {
        return `markers=size:mid%7Ccolor:blue%7Clabel:V%7C${venue.lat},${venue.lng}`;
      }).join('&');
      
      // Create tour-specific markers with different colors and sizes
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
          // Use custom label for better identification
          // First letter of band name plus index for multiple locations
          const bandInitial = loc.bandName ? loc.bandName.charAt(0).toUpperCase() : String.fromCharCode(65 + groupIndex);
          const label = bandInitial; // Could also add numbers like: + (idx + 1)
          
          // If image URL is available, we could use it as a custom marker
          // But for simplicity with Static Maps API, we'll use standard markers with tour-specific colors
          return `markers=size:mid%7Ccolor:${color}%7Clabel:${label}%7C${loc.lat},${loc.lng}`;
        }).join('&');
        
        tourMarkers += markerParams + '&';
        
        // Create path connecting tour points if enabled - use thicker lines
        if (showPaths && sortedLocations.length > 1) {
          const pathCoords = sortedLocations.map(loc => `${loc.lat},${loc.lng}`).join('|');
          pathParams += `path=color:${color}%7Cweight:3%7C${pathCoords}&`;
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
          
          {/* Enhanced Legend with Tour Grouping - Larger and more prominent */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-lg z-10 max-h-[320px] overflow-y-auto min-w-[200px] border border-gray-200">
            <h3 className="text-sm font-bold mb-2 border-b pb-1">Map Legend</h3>
            
            {/* Venue locations */}
            {locations.filter(loc => loc.isVenue).map((venue, i) => (
              <div key={`venue-${i}`} className="flex items-center mb-3">
                <div className="h-4 w-4 bg-blue-600 rounded-full mr-2 flex-shrink-0"></div>
                <span className="text-sm font-semibold">{venue.name}</span>
              </div>
            ))}
            
            {/* Divider if we have both venues and bands */}
            {locations.some(loc => loc.isVenue) && Array.from(tourGroups.keys()).length > 0 && (
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
              
              // Convert the hex color format to CSS-compatible format
              const hexColor = color.replace('0x', '#');
              
              return (
                <div key={`tour-${tourId}`} className="mb-3 p-2 rounded-md" style={{backgroundColor: `${hexColor}20`}}>
                  <div className="flex items-center mb-1">
                    {locations[0]?.imageUrl ? (
                      <img 
                        src={locations[0].imageUrl} 
                        alt={bandName}
                        className="h-6 w-6 rounded-full mr-2 object-cover border-2"
                        style={{borderColor: hexColor}}
                      />
                    ) : (
                      <div 
                        className="h-6 w-6 rounded-full mr-2 flex-shrink-0" 
                        style={{backgroundColor: hexColor}}
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
                            style={{backgroundColor: hexColor}}
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
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          Loading map...
        </div>
      )}
    </div>
  );
}