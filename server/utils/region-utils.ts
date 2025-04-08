import { InsertVenueCluster } from "../../shared/schema";

export interface USRegion {
  code: string;
  name: string;
  description: string;
  states: string[];
  centerLatitude: string;
  centerLongitude: string;
  radiusKm: number;
}

// Define standard US regions
export const US_REGIONS: USRegion[] = [
  {
    code: "NE",
    name: "Northeast",
    description: "Northeastern United States region including New England and Mid-Atlantic states",
    states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
    centerLatitude: "42.0546",
    centerLongitude: "-74.5247",
    radiusKm: 400
  },
  {
    code: "MW",
    name: "Midwest",
    description: "Midwestern United States region including Great Lakes and Plains states",
    states: ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    centerLatitude: "41.4925",
    centerLongitude: "-88.9513",
    radiusKm: 700
  },
  {
    code: "SE",
    name: "Southeast",
    description: "Southeastern United States region including South Atlantic and East South Central states",
    states: ["DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR", "LA"],
    centerLatitude: "33.8283",
    centerLongitude: "-84.3963",
    radiusKm: 650
  },
  {
    code: "SW",
    name: "Southwest",
    description: "Southwestern United States region including Texas and surrounding states",
    states: ["TX", "OK", "NM", "AZ"],
    centerLatitude: "32.7767",
    centerLongitude: "-96.7970",
    radiusKm: 600
  },
  {
    code: "W",
    name: "West",
    description: "Western United States region including Mountain and Pacific states",
    states: ["CO", "WY", "MT", "ID", "WA", "OR", "UT", "NV", "CA", "AK", "HI"],
    centerLatitude: "37.7749",
    centerLongitude: "-122.4194",
    radiusKm: 800
  }
];

// For a given state code, return the region it belongs to
export function getRegionForState(stateCode: string): USRegion | undefined {
  const upperStateCode = stateCode.toUpperCase();
  return US_REGIONS.find(region => 
    region.states.includes(upperStateCode)
  );
}

// Convert a US region to a VenueCluster for database insertion
export function regionToCluster(region: USRegion): InsertVenueCluster {
  return {
    name: `${region.name} Region`,
    description: region.description,
    regionCode: region.code,
    isStatic: true,
    centerLatitude: region.centerLatitude,
    centerLongitude: region.centerLongitude,
    radiusKm: region.radiusKm
  };
}

// Determine which region a venue belongs to based on its state
export function determineVenueRegion(venueState: string): string {
  if (!venueState) return "UNKNOWN";
  
  const region = getRegionForState(venueState);
  return region?.code || "UNKNOWN";
}