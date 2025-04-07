import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface MapViewProps {
  center: { lat: number; lng: number };
  markers?: Array<{ lat: number; lng: number; label?: string }>;
  zoom?: number;
  interactive?: boolean;
  height?: string;
  width?: string;
  onMarkerClick?: (index: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  markers = [],
  zoom = 12,
  interactive = true,
  height = "400px",
  width = "100%",
  onMarkerClick
}) => {
  const { isLoaded } = useGoogleMaps();

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ height, width }}
      center={center}
      zoom={zoom}
      options={{ 
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        scrollwheel: interactive
      }}
    >
      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          position={{ lat: marker.lat, lng: marker.lng }}
          label={marker.label}
          onClick={() => onMarkerClick?.(idx)}
        />
      ))}
    </GoogleMap>
  );
};

export default MapView;