import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, 'MMM d, yyyy');
}

export function formatDateMedium(date: string | Date): string {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return format(parsedDate, 'MMM d, yyyy');
}

export function getLocationLabel(city: string, state: string): string {
  if (!city && !state) return 'Unknown location';
  if (!city) return state;
  if (!state) return city;
  return `${city}, ${state}`;
}

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }
  
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515; // Distance in miles
  return Math.round(dist);
}

export function getFitDescription(score: number): string {
  if (score >= 90) return "Perfect fit";
  if (score >= 80) return "Excellent match";
  if (score >= 70) return "Great opportunity";
  if (score >= 60) return "Good fit";
  if (score >= 50) return "Potential match";
  if (score >= 40) return "Possible option";
  if (score >= 30) return "Consider carefully";
  if (score >= 20) return "Low match";
  return "Poor fit";
}