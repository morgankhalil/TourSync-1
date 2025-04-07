import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useActiveVenue } from '../../hooks/useActiveVenue';

interface Location {
  lat: number;
  lng: number;
  label: string;
  date: string;
}

interface Artist {
  name: string;
  origin: Location | null;
  destination: Location | null;
}

interface EnhancedBandMapViewProps {
  venueLocation: { lat: number; lng: number };
  artists: Artist[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Define the type for the map container
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Hardcoded colors for polylines
const colors = [
  '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
  '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E',
  '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC'
];

export function EnhancedBandMapView({ 
  venueLocation,
  artists,
  center,
  zoom = 6
}: EnhancedBandMapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    position: google.maps.LatLngLiteral;
    info: string;
  } | null>(null);

  // If no center is provided, use the venue location
  const mapCenter = center || venueLocation;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Format the date in a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

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
      {/* Venue marker */}
      <Marker
        position={venueLocation}
        icon={{
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        }}
        onClick={() => {
          setSelectedMarker({
            position: venueLocation,
            info: "Your Venue"
          });
        }}
      />

      {/* Artist routes and markers */}
      {artists.map((artist, index) => {
        const color = colors[index % colors.length];
        const path: google.maps.LatLngLiteral[] = [];
        
        // Add the origin point if it exists
        if (artist.origin) {
          path.push({
            lat: artist.origin.lat,
            lng: artist.origin.lng
          });
          
          // Draw a line to the venue
          path.push({
            lat: venueLocation.lat,
            lng: venueLocation.lng
          });
        }
        
        // If there's a destination, add a line from the venue to the destination
        if (artist.destination) {
          // If there's no origin, start the line at the venue
          if (path.length === 0) {
            path.push({
              lat: venueLocation.lat,
              lng: venueLocation.lng
            });
          }
          
          // Add the destination point
          path.push({
            lat: artist.destination.lat,
            lng: artist.destination.lng
          });
        }
        
        return (
          <React.Fragment key={`route-${artist.name}-${index}`}>
            {/* Origin marker */}
            {artist.origin && (
              <Marker
                position={{
                  lat: artist.origin.lat,
                  lng: artist.origin.lng
                }}
                label={{
                  text: (index + 1).toString(),
                  color: 'white'
                }}
                onClick={() => {
                  setSelectedMarker({
                    position: {
                      lat: artist.origin!.lat,
                      lng: artist.origin!.lng
                    },
                    info: `${artist.name} @ ${artist.origin!.label} (${formatDate(artist.origin!.date)})`
                  });
                }}
              />
            )}
            
            {/* Destination marker */}
            {artist.destination && (
              <Marker
                position={{
                  lat: artist.destination.lat,
                  lng: artist.destination.lng
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: color,
                  fillOpacity: 0.7,
                  strokeWeight: 1,
                  strokeColor: '#ffffff'
                }}
                onClick={() => {
                  setSelectedMarker({
                    position: {
                      lat: artist.destination!.lat,
                      lng: artist.destination!.lng
                    },
                    info: `${artist.name} @ ${artist.destination!.label} (${formatDate(artist.destination!.date)})`
                  });
                }}
              />
            )}
            
            {/* Route polyline */}
            {path.length > 1 && (
              <Polyline
                path={path}
                options={{
                  strokeColor: color,
                  strokeOpacity: 0.7,
                  strokeWeight: 3,
                  icons: [{
                    icon: {
                      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                    },
                    offset: '50%'
                  }]
                }}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Info window for selected marker */}
      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => {
            setSelectedMarker(null);
          }}
        >
          <div className="p-2">
            <p className="font-semibold">{selectedMarker.info}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}