import React from 'react';

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
  if (locations.length === 0) {
    return <div className="flex items-center justify-center h-full">No locations to display</div>;
  }
  
  // If we have a center specified, use it, otherwise use the first location
  const mapCenter = center || locations[0];
  
  // Create different colored markers by location index
  const markers = locations.map((loc, index) => {
    // Different colors for venue (first marker) vs bands
    const color = index === 0 ? 'blue' : 'red';
    // Use first letter of name as label
    const label = loc.name.charAt(0);
    return `markers=color:${color}%7Clabel:${label}%7C${loc.lat},${loc.lng}`;
  }).join('&');
  
  // Build the static map URL with all markers
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=${zoom}&size=800x600&scale=2&${markers}&key=${apiKey}`;
  
  return (
    <div className="relative h-full w-full flex flex-col">
      <img 
        src={staticMapUrl} 
        alt="Map of tour locations" 
        className="w-full h-full object-contain"
      />
      
      {/* Legend */}
      {locations.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md z-10">
          {/* Venue */}
          <div className="flex items-center mb-1">
            <div className="h-3 w-3 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-xs">{locations[0].name} (Venue)</span>
          </div>
          
          {/* Band locations (limit to 5 to prevent overcrowding) */}
          {locations.slice(1, 6).map((location, i) => (
            <div key={i} className="flex items-center mb-1">
              <div className="h-3 w-3 bg-red-600 rounded-full mr-2"></div>
              <span className="text-xs">{location.name}</span>
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
    </div>
  );
}