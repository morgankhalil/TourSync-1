/**
 * Utility functions for working with routing data and generating user-friendly descriptions
 */

import { ArtistRoute } from "../services/bandsintown-discovery-v2";

/**
 * Get a human-readable description of routing fit based on score
 */
export function getFitDescription(score: number) {
  if (score >= 90) {
    return {
      text: "Excellent",
      color: "text-green-700",
      description: "This artist is a perfect fit for your venue on their tour route."
    };
  } else if (score >= 75) {
    return {
      text: "Great",
      color: "text-green-600",
      description: "This artist's tour route makes your venue a very logical stop."
    };
  } else if (score >= 60) {
    return {
      text: "Good",
      color: "text-emerald-600",
      description: "Your venue would fit well with this artist's existing tour route."
    };
  } else if (score >= 40) {
    return {
      text: "Fair",
      color: "text-amber-600",
      description: "Your venue would add some extra travel to their tour, but could still be worthwhile."
    };
  } else {
    return {
      text: "Poor",
      color: "text-red-600",
      description: "This artist would need to make a significant detour to play your venue."
    };
  }
}

/**
 * Generate human-readable description of days available
 */
export function getDaysDescription(days: number) {
  if (days === 0) {
    return "Same day (tight schedule)";
  } else if (days === 1) {
    return "1 day available";
  } else if (days === 2) {
    return "2 days available";
  } else if (days <= 4) {
    return `${days} days available`;
  } else {
    return `${days} days (extended break)`;
  }
}

/**
 * Generate description of detour distance
 */
export function getDetourDescription(miles: number) {
  if (miles === 0) {
    return "No detour required";
  } else if (miles < 20) {
    return "Minimal detour";
  } else if (miles < 50) {
    return "Small detour";
  } else if (miles < 100) {
    return "Moderate detour";
  } else {
    return "Significant detour";
  }
}

/**
 * Generate a complete routing description for an artist
 */
export function generateRoutingDescription(artistName: string, route: ArtistRoute) {
  // Artist with both origin and destination
  if (route.origin && route.destination) {
    return `${artistName} is playing in ${route.origin.city} and then ${route.destination.city} with ${route.daysAvailable} days in between. Your venue is ${route.distanceToVenue} miles from their route.`;
  }
  
  // Artist with only origin (next show)
  else if (route.origin && !route.destination) {
    return `${artistName} is playing in ${route.origin.city} and could potentially add your venue to their tour route.`;
  }
  
  // Artist with only destination (previous show)
  else if (!route.origin && route.destination) {
    return `${artistName} will be in ${route.destination.city} and might be interested in adding your venue before that show.`;
  }
  
  // Fallback (shouldn't happen if the API is working properly)
  else {
    return `${artistName} is touring in your area and could be a good fit for your venue.`;
  }
}