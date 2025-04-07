import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { Band, RouteAnalysis, Venue, TourDate, MapMarker, MapPolyline } from '@/types';
import { getLocationLabel } from '@/lib/utils';
import { useActiveVenue } from '@/hooks/useActiveVenue';

// Define the type for the map container
const containerStyle = {
  width: '100%',
  height: '400px'
};

interface BandMapViewProps {
  band?: Band;
  tourDates?: TourDate[];
  route?: RouteAnalysis;
  venueId?: number;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const BandMapView: React.FC<BandMapViewProps> = ({
  band,
  tourDates = [],
  route,
  venueId,
  center = { lat: 39.8283, lng: -98.5795 }, // Center of US by default
  zoom = 4
}) => {
  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script'
  });

  const venue = useActiveVenue();
  const activeVenue = venue.activeVenue;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [polylines, setPolylines] = useState<MapPolyline[]>([]);

  // Prepare markers and polylines from tour dates and routes
  useEffect(() => {
    if (!isLoaded) return;

    const newMarkers: MapMarker[] = [];
    let pathCoordinates: {lat: number, lng: number}[] = [];
    
    // Add venue marker if activeVenue is available
    if (activeVenue) {
      // Convert string coordinates to numbers if needed
      const venueLat = typeof activeVenue.lat === 'string' ? parseFloat(activeVenue.lat) : (activeVenue.lat || 0);
      const venueLng = typeof activeVenue.lng === 'string' ? parseFloat(activeVenue.lng) : (activeVenue.lng || 0);
      
      if (venueLat && venueLng) {
        newMarkers.push({
          id: `venue-${activeVenue.id}`,
          position: { lat: venueLat, lng: venueLng },
          title: activeVenue.name,
          type: 'venue',
          venue: activeVenue
        });
      }
    }

    // Add tour date markers
    tourDates.forEach((date, index) => {
      const lat = typeof date.latitude === 'number' ? date.latitude : parseFloat(date.latitude as string || '0'); 
      const lng = typeof date.longitude === 'number' ? date.longitude : parseFloat(date.longitude as string || '0');
      
      if (lat && lng) {
        newMarkers.push({
          id: `date-${date.id}`,
          position: { lat, lng },
          title: date.venueName || getLocationLabel(date.city, date.state),
          type: 'tourDate',
          tourDate: date
        });
        
        // Add to path coordinates for polyline
        pathCoordinates.push({ lat, lng });
      }
    });

    // Add route analysis markers
    if (route) {
      if (route.origin && route.origin.lat && route.origin.lng) {
        newMarkers.push({
          id: 'origin',
          position: { 
            lat: route.origin.lat, 
            lng: route.origin.lng 
          },
          title: getLocationLabel(route.origin.city, route.origin.state),
          type: 'origin'
        });
        
        // Add to path coordinates for polyline
        pathCoordinates.push({ 
          lat: route.origin.lat, 
          lng: route.origin.lng 
        });
      }
      
      if (route.destination && route.destination.lat && route.destination.lng) {
        newMarkers.push({
          id: 'destination',
          position: { 
            lat: route.destination.lat, 
            lng: route.destination.lng 
          },
          title: getLocationLabel(route.destination.city, route.destination.state),
          type: 'destination'
        });
        
        // Add to path coordinates for polyline
        pathCoordinates.push({ 
          lat: route.destination.lat, 
          lng: route.destination.lng 
        });
      }
    }

    // Create polylines for the routes
    const newPolylines: MapPolyline[] = [];
    if (pathCoordinates.length > 1) {
      newPolylines.push({
        id: 'tour-route',
        path: pathCoordinates.map(coord => ({
          lat: typeof coord.lat === 'string' ? parseFloat(coord.lat) : coord.lat,
          lng: typeof coord.lng === 'string' ? parseFloat(coord.lng) : coord.lng,
        })),
        options: {
          strokeColor: '#4285F4',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          geodesic: true
        }
      });
    }

    setMarkers(newMarkers);
    setPolylines(newPolylines);
  }, [isLoaded, activeVenue, tourDates, route]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle loading and error cases
  if (loadError) {
    return <div className="p-4 bg-red-50 text-red-600 rounded">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="p-4 text-center">Loading maps...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true
        }}
      >
        {/* Render markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() => setSelectedMarker(marker)}
            icon={marker.type === 'venue' ? {
              url: '/venue-marker.svg',
              scaledSize: new google.maps.Size(36, 36)
            } : undefined}
          />
        ))}

        {/* Render polylines */}
        {polylines.map((polyline) => (
          <Polyline
            key={polyline.id}
            path={polyline.path as google.maps.LatLngLiteral[]}
            options={polyline.options}
          />
        ))}

        {/* Render info window for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-sm">{selectedMarker.title}</h3>
              {selectedMarker.type === 'tourDate' && selectedMarker.tourDate && (
                <div className="text-xs mt-1">
                  <p>Date: {new Date(selectedMarker.tourDate.date).toLocaleDateString()}</p>
                  <p>Status: {selectedMarker.tourDate.status || 'Not set'}</p>
                </div>
              )}
              {selectedMarker.type === 'venue' && selectedMarker.venue && (
                <div className="text-xs mt-1">
                  <p>{selectedMarker.venue.address}</p>
                  <p>{getLocationLabel(selectedMarker.venue.city, selectedMarker.venue.state)}</p>
                  <p>Capacity: {selectedMarker.venue.capacity || 'Unknown'}</p>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default BandMapView;