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
    // Check if we have the map container
    if (!mapRef.current) return;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    const iframe = document.createElement('iframe');
    
    // Use Static Maps API instead
    const locationsStr = locations.map(loc => `&markers=color:red%7Clabel:${encodeURIComponent(loc.name.charAt(0))}%7C${loc.lat},${loc.lng}`).join('');
    
    // If we have a center specified, use it, otherwise use the first location
    const mapCenter = center || (locations.length > 0 ? locations[0] : { lat: 40, lng: -74 });
    
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter.lat},${mapCenter.lng}&zoom=${zoom}&size=600x600&scale=2${locationsStr}&key=${apiKey}`;
    
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.src = `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${zoom}&output=embed`;
    
    // Clear any existing content
    while (mapRef.current.firstChild) {
      mapRef.current.removeChild(mapRef.current.firstChild);
    }
    
    mapRef.current.appendChild(iframe);

    // Also add the static map as an image below the iframe for backup
    const img = document.createElement('img');
    img.src = staticMapUrl;
    img.style.display = 'none'; // Hide it by default, show only if iframe fails
    img.style.width = '100%';
    img.style.height = 'auto';
    img.alt = 'Map of locations';
    
    iframe.onerror = () => {
      img.style.display = 'block';
    };
    
    mapRef.current.appendChild(img);
    
  }, [locations, center, zoom]);
  
  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
      <div className="flex items-center justify-center h-full">Loading map...</div>
    </div>
  );
}