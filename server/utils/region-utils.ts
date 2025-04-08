
import { Venue } from '../../shared/schema';

export const US_REGIONS = {
  NORTHEAST: {
    name: "Northeast",
    states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
    centerLat: 42.5,
    centerLong: -72.5
  },
  SOUTHEAST: {
    name: "Southeast", 
    states: ["MD", "DE", "VA", "WV", "KY", "NC", "SC", "TN", "GA", "FL", "AL", "MS", "AR", "LA"],
    centerLat: 33.5,
    centerLong: -84.5
  },
  MIDWEST: {
    name: "Midwest",
    states: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    centerLat: 43.5,
    centerLong: -93.5
  },
  SOUTHWEST: {
    name: "Southwest",
    states: ["TX", "OK", "NM", "AZ"],
    centerLat: 33.5,
    centerLong: -106.5
  },
  ROCKY_MOUNTAIN: {
    name: "Rocky Mountain",
    states: ["MT", "ID", "WY", "CO", "UT", "NV"],
    centerLat: 43.5,
    centerLong: -111.5
  },
  PACIFIC: {
    name: "Pacific",
    states: ["WA", "OR", "CA", "AK", "HI"],
    centerLat: 37.5,
    centerLong: -122.5
  }
};

export function getVenueRegion(venue: Venue): keyof typeof US_REGIONS | null {
  const state = venue.state.toUpperCase();
  
  for (const [region, data] of Object.entries(US_REGIONS)) {
    if (data.states.includes(state)) {
      return region as keyof typeof US_REGIONS;
    }
  }
  
  return null;
}
