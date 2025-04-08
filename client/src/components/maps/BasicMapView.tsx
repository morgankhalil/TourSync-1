import React, { useEffect, useRef } from 'react';

interface SimpleLocation {
  lat: number;
  lng: number;
  name: string;
}

interface BasicMapViewProps {
  locations: SimpleLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function BasicMapView({
  locations,
  center,
  zoom = 6
}: BasicMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check if we have the map container and locations
    if (!mapRef.current || locations.length === 0) return;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return;
    }
    
    // If we have a center specified, use it, otherwise use the first location
    const mapCenter = center || locations[0];
    
    // Create a direct Static Maps image that shows all markers
    const img = document.createElement('img');
    
    // Create different colored markers by location index
    const markers = locations.map((loc, index) => {
      // Different colors for venue (first marker) vs bands
      const color = index === 0 ? 'blue' : 'red';
      // Use first letter of name as label
      const label = loc.name.charAt(0);
      return `markers=color:${color}%7Clabel:${label}%7C${loc.lat},${loc.lng}`;
    }).join('&');
    
    // Build the static map URL with all markers
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=${zoom}&size=800x600&scale=2&${markers}&key=${apiKey}`;
    
    img.src = staticMapUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.alt = 'Map of tour locations';
    
    // Clear existing content
    while (mapRef.current.firstChild) {
      mapRef.current.removeChild(mapRef.current.firstChild);
    }
    
    // Add the map image
    mapRef.current.appendChild(img);
    
    // Add a legend below the map
    if (locations.length > 1) {
      const legend = document.createElement('div');
      legend.className = 'bg-white p-2 rounded-md shadow-md mt-2';
      legend.style.position = 'absolute';
      legend.style.bottom = '10px';
      legend.style.left = '10px';
      legend.style.zIndex = '1000';
      
      // First location (venue)
      const venueItem = document.createElement('div');
      venueItem.className = 'flex items-center mb-1';
      venueItem.innerHTML = `
        <div class="h-3 w-3 bg-blue-600 rounded-full mr-2"></div>
        <span class="text-xs">${locations[0].name} (Venue)</span>
      `;
      legend.appendChild(venueItem);
      
      // Band locations (limit to 5 to prevent overcrowding)
      const displayLimit = Math.min(locations.length, 6);
      for (let i = 1; i < displayLimit; i++) {
        const bandItem = document.createElement('div');
        bandItem.className = 'flex items-center mb-1';
        bandItem.innerHTML = `
          <div class="h-3 w-3 bg-red-600 rounded-full mr-2"></div>
          <span class="text-xs">${locations[i].name}</span>
        `;
        legend.appendChild(bandItem);
      }
      
      // If there are more than 5 additional locations, add a count
      if (locations.length > 6) {
        const moreItem = document.createElement('div');
        moreItem.className = 'text-xs text-gray-500 mt-1';
        moreItem.innerText = `+ ${locations.length - 6} more locations`;
        legend.appendChild(moreItem);
      }
      
      mapRef.current.appendChild(legend);
    }
    
  }, [locations, center, zoom]);
  
  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="flex items-center justify-center h-full">
        {locations.length === 0 ? 
          'No locations to display' : 
          'Loading map...'}
      </div>
    </div>
  );
}