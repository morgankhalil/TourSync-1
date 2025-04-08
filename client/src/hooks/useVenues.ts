import { useQuery } from '@tanstack/react-query';

export type Venue = {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  venueId?: number; // Alias for id in some contexts
  capacity?: number;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  genre?: string;
  dealType?: string;
  bookingLeadTime?: number;
};

type VenueOptionsResponse = {
  success: boolean;
  venues: Venue[];
  message?: string;
};

type VenueResponse = {
  success: boolean;
  venue: Venue;
  message?: string;
};

type VenuesNearResponse = {
  success?: boolean;
  venues: Venue[];
  message?: string;
};

/**
 * Hook for fetching venue options for registration
 */
export function useVenueOptions() {
  return useQuery<VenueOptionsResponse>({
    queryKey: ['/api/venues-direct'],
    queryFn: async () => {
      const response = await fetch('/api/venues-direct');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const venues = await response.json();
      return { 
        success: true, 
        venues: Array.isArray(venues) ? venues : [] 
      };
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching a single venue by ID
 */
export function useVenue(venueId: string) {
  return useQuery<VenueResponse>({
    queryKey: ['/api/venues', venueId],
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!venueId, // Only run the query if venueId is provided
  });
}

/**
 * Hook for fetching all venues
 */
export function useVenues() {
  return useQuery<Venue[] | VenuesNearResponse>({
    queryKey: ['/api/venues'],
    retry: 1,
    refetchOnWindowFocus: false,
    // Transform the response data in case it's wrapped in an object
    select: (data) => {
      // If data is already an array, return it
      if (Array.isArray(data)) {
        return data;
      }
      // If data is an object with a venues property that's an array, return that
      if (data && typeof data === 'object' && 'venues' in data && Array.isArray(data.venues)) {
        return data.venues;
      }
      // Otherwise return an empty array
      return [];
    }
  });
}

/**
 * Parameters for venues near location search
 */
interface VenuesNearLocationParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

/**
 * Hook for fetching venues near a specified location
 */
export function useVenuesNearLocation(params: VenuesNearLocationParams) {
  const { latitude, longitude, radius = 25, limit = 20 } = params;
  
  return useQuery<Venue[] | VenuesNearResponse>({
    queryKey: ['/api/venues/near', latitude, longitude, radius, limit],
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: Boolean(latitude && longitude), // Only run if latitude and longitude are provided
    select: (data) => {
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'venues' in data && Array.isArray(data.venues)) {
        return data.venues;
      }
      return [];
    }
  });
}