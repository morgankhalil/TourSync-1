import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  imageUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export function useVenues() {
  return useQuery({
    queryKey: ['/api/venues'],
    queryFn: () => apiRequest<Venue[]>('/api/venues')
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: ['/api/venues', id],
    queryFn: () => apiRequest<Venue>(`/api/venues/${id}`),
    enabled: !!id
  });
}

export function useCreateVenue() {
  return useMutation({
    mutationFn: (venue: Partial<Venue>) => 
      apiRequest<Venue>('/api/venues', { 
        method: 'POST', 
        body: venue 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
    }
  });
}

export function useUpdateVenue() {
  return useMutation({
    mutationFn: ({ id, ...venue }: Partial<Venue> & { id: string }) => 
      apiRequest<Venue>(`/api/venues/${id}`, { 
        method: 'PATCH', 
        body: venue 
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
    }
  });
}

export function useDeleteVenue() {
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/venues/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
    }
  });
}

export function useVenueAvailability(venueId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['/api/venues/availability', venueId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      const queryParams: Record<string, string> = {};
      if (startDate) queryParams.startDate = startDate.toISOString();
      if (endDate) queryParams.endDate = endDate.toISOString();
      
      return apiRequest<{
        dates: { date: string; available: boolean; eventId?: string }[]
      }>(`/api/venues/${venueId}/availability`, { 
        queryParams 
      });
    },
    enabled: !!venueId && !!startDate && !!endDate
  });
}