import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tour, TourDate } from '@shared/schema';
import AnimatedTourPath from '@/components/maps/AnimatedTourPath';
import { ChevronLeft, ChevronRight, Play, Pause, ZoomIn, ZoomOut, Truck, RotateCcw } from 'lucide-react';

const TourRouteVisualization = () => {
  // State for the map and UI elements
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [pathCoordinates, setPathCoordinates] = useState<{lat: number, lng: number}[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(5);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(true);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch Google Maps API key
  const { data: mapsApiData, isLoading: isLoadingApiKey } = useQuery({
    queryKey: ['/api/config/maps-api-key'],
  });

  // Fetch tours data
  const { data: toursData, isLoading: isLoadingTours } = useQuery({
    queryKey: ['/api/tours'],
    enabled: !!mapsApiData?.apiKey
  });

  // Function to initialize Google Maps
  const initializeMap = () => {
    if (!mapRef.current || !mapsApiData?.apiKey) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: zoomLevel,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(newMap);
  };

  // Load Google Maps script
  useEffect(() => {
    if (!window.google && mapsApiData?.apiKey) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiData.apiKey}&libraries=geometry,places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = () => {
        console.log('Google Maps API loaded');
        initializeMap();
      };
      
      document.head.appendChild(script);
      
      return () => {
        window.initMap = () => {};
        document.head.removeChild(script);
      };
    } else if (window.google && !map) {
      initializeMap();
    }
  }, [mapsApiData, map]);

  // Effect to update zoom level on the map
  useEffect(() => {
    if (map) {
      map.setZoom(zoomLevel);
    }
  }, [zoomLevel, map]);

  // Fetch tour dates when a tour is selected
  useEffect(() => {
    if (!selectedTour) return;
    
    const fetchTourDates = async () => {
      try {
        const response = await fetch(`/api/tours/${selectedTour}/dates`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Sort by date
          const sortedDates = [...data].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setTourDates(sortedDates);
        } else {
          console.error('Invalid tour dates data format:', data);
          setTourDates([]);
        }
      } catch (error) {
        console.error('Error fetching tour dates:', error);
        setTourDates([]);
      }
    };
    
    fetchTourDates();
  }, [selectedTour]);

  // Fetch venue coordinates for each tour date
  useEffect(() => {
    if (!tourDates.length || !map) return;
    
    const fetchVenueCoordinates = async () => {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
      
      const newMarkers: google.maps.Marker[] = [];
      const coordinates: {lat: number, lng: number}[] = [];
      const newBounds = new google.maps.LatLngBounds();
      
      for (const date of tourDates) {
        // If the date has a venueId, fetch venue data
        if (date.venueId) {
          try {
            const response = await fetch(`/api/venues-direct/${date.venueId}`);
            const venue = await response.json();
            
            if (venue && venue.latitude && venue.longitude) {
              const lat = parseFloat(venue.latitude);
              const lng = parseFloat(venue.longitude);
              
              if (!isNaN(lat) && !isNaN(lng)) {
                const position = { lat, lng };
                coordinates.push(position);
                newBounds.extend(position);
                
                // Create marker for this venue
                const marker = new google.maps.Marker({
                  position,
                  map,
                  title: venue.name,
                  label: {
                    text: String(coordinates.length),
                    color: 'white'
                  },
                  animation: google.maps.Animation.DROP,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                    scale: 10,
                  }
                });
                
                // Add info window for this marker
                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div class="p-2">
                      <h3 class="font-bold">${venue.name}</h3>
                      <p>${venue.city}, ${venue.state}</p>
                      <p class="text-sm">Date: ${new Date(date.date).toLocaleDateString()}</p>
                      ${date.notes ? `<p class="text-sm mt-1">${date.notes}</p>` : ''}
                    </div>
                  `
                });
                
                marker.addListener('click', () => {
                  infoWindow.open(map, marker);
                });
                
                newMarkers.push(marker);
              }
            }
          } catch (error) {
            console.error(`Error fetching venue ${date.venueId}:`, error);
          }
        } else if (date.city && date.state) {
          // If no venue but we have city/state, use geocoding to get coordinates
          try {
            const geocoder = new google.maps.Geocoder();
            const address = `${date.city}, ${date.state}`;
            
            await new Promise<void>((resolve) => {
              geocoder.geocode({ address }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                  const location = results[0].geometry.location;
                  const position = { lat: location.lat(), lng: location.lng() };
                  coordinates.push(position);
                  newBounds.extend(position);
                  
                  // Create marker for this location
                  const marker = new google.maps.Marker({
                    position,
                    map,
                    title: address,
                    label: {
                      text: String(coordinates.length),
                      color: 'white'
                    },
                    animation: google.maps.Animation.DROP,
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: '#EA4335', // Red for no venue
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: '#FFFFFF',
                      scale: 10,
                    }
                  });
                  
                  // Add info window
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div class="p-2">
                        <h3 class="font-bold">${date.venueName || 'Open Date'}</h3>
                        <p>${address}</p>
                        <p class="text-sm">Date: ${new Date(date.date).toLocaleDateString()}</p>
                        ${date.notes ? `<p class="text-sm mt-1">${date.notes}</p>` : ''}
                        <p class="text-sm text-red-500">No venue selected</p>
                      </div>
                    `
                  });
                  
                  marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                  });
                  
                  newMarkers.push(marker);
                }
                resolve();
              });
            });
          } catch (error) {
            console.error(`Error geocoding ${date.city}, ${date.state}:`, error);
          }
        }
      }
      
      if (coordinates.length > 0) {
        setPathCoordinates(coordinates);
        setMarkers(newMarkers);
        setBounds(newBounds);
        
        // Fit the map to the bounds
        map.fitBounds(newBounds);
      }
    };
    
    fetchVenueCoordinates();
  }, [tourDates, map]);

  // Function to go to the next tour date
  const goToNext = () => {
    if (tourDates.length === 0) return;
    
    const newIndex = (currentIndex + 1) % tourDates.length;
    setCurrentIndex(newIndex);
    
    // Center the map on the selected marker
    if (map && markers[newIndex]) {
      map.panTo(markers[newIndex].getPosition()!);
      map.setZoom(10); // Zoom in to see venue details
      
      // Open the info window for this marker
      google.maps.event.trigger(markers[newIndex], 'click');
    }
  };

  // Function to go to the previous tour date
  const goToPrevious = () => {
    if (tourDates.length === 0) return;
    
    const newIndex = (currentIndex - 1 + tourDates.length) % tourDates.length;
    setCurrentIndex(newIndex);
    
    // Center the map on the selected marker
    if (map && markers[newIndex]) {
      map.panTo(markers[newIndex].getPosition()!);
      map.setZoom(10); // Zoom in to see venue details
      
      // Open the info window for this marker
      google.maps.event.trigger(markers[newIndex], 'click');
    }
  };

  // Function to toggle animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Function to reset the map view
  const resetView = () => {
    if (map && bounds) {
      map.fitBounds(bounds);
    }
  };

  // Render loading state
  if (isLoadingApiKey || isLoadingTours) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left sidebar with controls */}
        <div className="lg:col-span-1">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Tour Route Visualization</CardTitle>
              <CardDescription>Visualize and animate tour routes between venues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tour-select">Select Tour</Label>
                  <Select
                    value={selectedTour || ''}
                    onValueChange={(value) => setSelectedTour(value)}
                  >
                    <SelectTrigger id="tour-select">
                      <SelectValue placeholder="Select a tour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(toursData) && toursData.map((tour: Tour) => (
                        <SelectItem key={tour.id} value={tour.id.toString()}>
                          {tour.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="animation-speed">Animation Speed</Label>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <Slider
                      id="animation-speed"
                      min={1}
                      max={20}
                      step={1}
                      value={[animationSpeed]}
                      onValueChange={(value) => setAnimationSpeed(value[0])}
                      disabled={!selectedTour}
                    />
                    <Truck className="h-6 w-6 text-blue-500" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-info">Show Information</Label>
                  <Switch
                    id="show-info"
                    checked={showInfo}
                    onCheckedChange={setShowInfo}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={!tourDates.length}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAnimation}
                  disabled={!tourDates.length}
                >
                  {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={!tourDates.length}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 20))}
                  disabled={!tourDates.length}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 1))}
                  disabled={!tourDates.length}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetView}
                  disabled={!tourDates.length}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {showInfo && tourDates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tour Information</CardTitle>
                <CardDescription>
                  {tourDates.length} stops from {' '}
                  {new Date(tourDates[0]?.date).toLocaleDateString()} to {' '}
                  {new Date(tourDates[tourDates.length - 1]?.date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Current Stop</h3>
                    <p className="text-lg font-bold">
                      {tourDates[currentIndex]?.venueName || `${tourDates[currentIndex]?.city}, ${tourDates[currentIndex]?.state}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tourDates[currentIndex]?.date).toLocaleDateString()}
                    </p>
                    {tourDates[currentIndex]?.notes && (
                      <p className="text-sm mt-2">{tourDates[currentIndex].notes}</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Tour Dates</h3>
                    <div className="overflow-y-auto max-h-60 pr-2">
                      {tourDates.map((date, index) => (
                        <div 
                          key={date.id}
                          className={`p-2 mt-1 rounded cursor-pointer flex items-center ${
                            index === currentIndex ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => {
                            setCurrentIndex(index);
                            if (map && markers[index]) {
                              map.panTo(markers[index].getPosition()!);
                              map.setZoom(10);
                              google.maps.event.trigger(markers[index], 'click');
                            }
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2 flex-shrink-0">
                            <span className="text-white text-xs">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{date.venueName || `${date.city}, ${date.state}`}</p>
                            <p className="text-xs text-gray-500">{new Date(date.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Map container */}
        <div className="lg:col-span-2">
          <div 
            ref={mapRef} 
            className="h-[calc(100vh-120px)] w-full rounded-lg shadow-lg border"
          ></div>
          
          {/* Render the animated path component */}
          {map && pathCoordinates.length > 1 && (
            <AnimatedTourPath
              map={map}
              coordinates={pathCoordinates}
              color="#4285F4"
              speed={animationSpeed}
              animate={isAnimating}
              pathWidth={4}
              onComplete={() => console.log('Animation cycle completed')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TourRouteVisualization;