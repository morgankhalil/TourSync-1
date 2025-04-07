import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SimpleLocation | null>(null);

  const mapCenter = center || (locations.length > 0 ? locations[0] : { lat: 40, lng: -74 });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      }}
    >
      {locations.map((location, index) => (
        <Marker
          key={`location-${index}`}
          position={{ lat: location.lat, lng: location.lng }}
          onClick={() => setSelectedMarker(location)}
        />
      ))}
      
      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2">
            <p className="font-semibold">{selectedMarker.name}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}