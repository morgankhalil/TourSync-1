/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  
  // Convert degrees to radians
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Find nearby venues based on a set of coordinates and radius
 * @param targetLat Target latitude
 * @param targetLon Target longitude
 * @param venues Array of venues with latitude and longitude properties
 * @param radiusKm Search radius in kilometers
 * @returns Array of venues within the specified radius
 */
export function findNearbyVenues(
  targetLat: number, 
  targetLon: number, 
  venues: Array<{ latitude: string; longitude: string; [key: string]: any }>,
  radiusKm: number
): Array<{ venue: any; distanceKm: number }> {
  return venues
    .map(venue => {
      const venueLat = parseFloat(venue.latitude);
      const venueLon = parseFloat(venue.longitude);
      
      if (isNaN(venueLat) || isNaN(venueLon)) {
        return null;
      }
      
      const distanceKm = calculateDistance(targetLat, targetLon, venueLat, venueLon);
      
      return {
        venue,
        distanceKm
      };
    })
    .filter((item): item is { venue: any; distanceKm: number } => {
      return item !== null && item.distanceKm <= radiusKm;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Calculate a bounding box around a point for efficient database queries
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Object with min/max latitude and longitude
 */
export function calculateBoundingBox(centerLat: number, centerLon: number, radiusKm: number): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const earthRadiusKm = 6371;
  
  // Latitude: 1 deg = 110.574 km
  const latDelta = radiusKm / 110.574;
  
  // Longitude: 1 deg = 111.320*cos(lat) km
  const lonDelta = radiusKm / (111.320 * Math.cos(deg2rad(centerLat)));
  
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta
  };
}

/**
 * Find optimal routing between a set of venues
 * @param venues Array of venues with latitude and longitude properties
 * @returns Array of venues in optimal routing order
 */
export function findOptimalRouting(
  venues: Array<{ id: number; latitude: string; longitude: string; [key: string]: any }>
): Array<typeof venues[0]> {
  if (venues.length <= 2) {
    return venues; // No optimization needed for 0, 1, or 2 venues
  }
  
  // Nearest neighbor algorithm for simplicity
  // For a production app, you'd want a more sophisticated algorithm like simulated annealing
  const result: typeof venues[0][] = [];
  const unvisited = [...venues];
  
  // Start with the first venue
  let current = unvisited.shift();
  if (!current) return [];
  
  result.push(current);
  
  // Find nearest unvisited venue until all are visited
  while (unvisited.length > 0) {
    const currentLat = parseFloat(current.latitude);
    const currentLon = parseFloat(current.longitude);
    
    // Find nearest unvisited venue
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < unvisited.length; i++) {
      const venueLat = parseFloat(unvisited[i].latitude);
      const venueLon = parseFloat(unvisited[i].longitude);
      
      if (isNaN(venueLat) || isNaN(venueLon)) {
        continue;
      }
      
      const distance = calculateDistance(currentLat, currentLon, venueLat, venueLon);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    // Move to the nearest venue
    current = unvisited.splice(nearestIndex, 1)[0];
    result.push(current);
  }
  
  return result;
}

/**
 * Calculate the total distance of a route
 * @param venues Array of venues with latitude and longitude properties in route order
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
  venues: Array<{ latitude: string; longitude: string; [key: string]: any }>
): number {
  if (venues.length <= 1) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < venues.length - 1; i++) {
    const venueLat1 = parseFloat(venues[i].latitude);
    const venueLon1 = parseFloat(venues[i].longitude);
    const venueLat2 = parseFloat(venues[i + 1].latitude);
    const venueLon2 = parseFloat(venues[i + 1].longitude);
    
    if (isNaN(venueLat1) || isNaN(venueLon1) || isNaN(venueLat2) || isNaN(venueLon2)) {
      continue;
    }
    
    const distance = calculateDistance(venueLat1, venueLon1, venueLat2, venueLon2);
    totalDistance += distance;
  }
  
  return totalDistance;
}