import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number | null;
  website: string | null;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude: string;
  longitude: string;
  technicalSpecs: string | null;
  venueType: string | null;
  amenities: string | null;
  pastPerformers: string | null;
  photoGallery: string | null;
  loadingInfo: string | null;
  accommodations: string | null;
  preferredGenres: string | null;
  priceRange: string | null;
  dealType: string | null;
  genre: string | null;
  bandsintown_id: string | null;
}

export function useVenues() {
  return useQuery({
    queryKey: ['/api/venues-direct'],
    queryFn: () => apiRequest<Venue[]>('/api/venues-direct')
  });
}

export function useVenue(id: string | number) {
  return useQuery({
    queryKey: ['/api/venues-direct', id],
    queryFn: () => apiRequest<Venue>(`/api/venues-direct/${id}`),
    enabled: !!id
  });
}

export function useCreateVenue() {
  return useMutation({
    mutationFn: (venue: Partial<Venue>) => 
      apiRequest<Venue>('/api/venues-direct', { 
        method: 'POST', 
        body: venue 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct'] });
    }
  });
}

export function useUpdateVenue() {
  return useMutation({
    mutationFn: ({ id, ...venue }: Partial<Venue> & { id: number }) => 
      apiRequest<Venue>(`/api/venues-direct/${id}`, { 
        method: 'PATCH', 
        body: venue 
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct'] });
    }
  });
}

export function useDeleteVenue() {
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/venues-direct/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct'] });
    }
  });
}

export function useVenueAvailability(venueId: string | number, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['/api/venues-direct/availability', venueId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      const queryParams: Record<string, string> = {};
      if (startDate) queryParams.startDate = startDate.toISOString();
      if (endDate) queryParams.endDate = endDate.toISOString();
      
      return apiRequest<{
        dates: { date: string; available: boolean; eventId?: string }[]
      }>(`/api/venues-direct/${venueId}/availability`, { 
        queryParams 
      });
    },
    enabled: !!venueId && !!startDate && !!endDate
  });
}

export interface VenueProximitySearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

export function useVenuesNearLocation(params: VenueProximitySearchParams) {
  const { latitude, longitude, radius = 25, limit = 20 } = params;
  
  return useQuery({
    queryKey: ['/api/venues-search/near', latitude, longitude, radius, limit],
    queryFn: () => {
      const queryParams: Record<string, string> = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString()
      };
      
      return apiRequest<Venue[]>('/api/venues-search/near', { queryParams });
    },
    enabled: !!latitude && !!longitude
  });
}