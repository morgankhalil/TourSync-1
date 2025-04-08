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
    queryKey: ['/api/venues-direct'],
    queryFn: () => apiRequest<Venue[]>('/api/venues-direct')
  });
}

export function useVenue(id: string) {
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
    mutationFn: ({ id, ...venue }: Partial<Venue> & { id: string }) => 
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
    mutationFn: (id: string) => 
      apiRequest(`/api/venues-direct/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/venues-direct'] });
    }
  });
}

export function useVenueAvailability(venueId: string, startDate?: Date, endDate?: Date) {
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