import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a formatted location label from city and state
 */
export function getLocationLabel(city?: string, state?: string): string {
  if (!city && !state) return 'Location unknown';
  if (!city) return state as string;
  if (!state) return city;
  return `${city}, ${state}`;
}

/**
 * Formats a date for display with consistent options
 */
export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return 'Date unavailable';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Formats a date in medium format (e.g., "Apr 5, 2025")
 */
export function formatDateMedium(date: string | Date): string {
  return formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a date in long format (e.g., "Monday, April 5, 2025")
 */
export function formatDateLong(date: string | Date): string {
  return formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Convert latitude and longitude from degrees to radians
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  
  const rlat1 = toRadians(lat1);
  const rlon1 = toRadians(lon1);
  const rlat2 = toRadians(lat2);
  const rlon2 = toRadians(lon2);
  
  // Haversine formula
  const dlon = rlon2 - rlon1;
  const dlat = rlat2 - rlat1;
  const a = Math.sin(dlat/2) ** 2 + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dlon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Radius of the Earth in miles
  const radiusOfEarth = 3958.8;
  
  // Calculate the distance
  const distance = radiusOfEarth * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Generates a descriptive label for a routing score
 * @param score The routing score (lower is better)
 * @returns A human-readable description of how good the routing opportunity is
 */
export function getFitDescription(score?: number): string {
  if (score === undefined) return 'Unknown fit';
  
  if (score < 50) return 'Excellent fit';
  if (score < 100) return 'Good fit';
  if (score < 150) return 'Moderate fit';
  if (score < 200) return 'Fair fit';
  return 'Poor fit';
}