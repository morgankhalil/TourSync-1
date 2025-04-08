import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface TourEvent {
  id: string;
  tourId: string;
  venueId: string;
  venueName: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface Tour {
  id: string;
  name: string;
  artistId: string;
  startDate: Date;
  endDate: Date;
  region: string;
  status: 'planning' | 'booking' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  budget?: number;
  description?: string;
  collaborators?: string[];
  createdAt: Date;
  events?: TourEvent[];
}

export function useTours(artistId?: string) {
  return useQuery({
    queryKey: ['/api/tours', artistId],
    queryFn: () => {
      const url = artistId 
        ? `/api/artists/${artistId}/tours` 
        : '/api/tours';
      return apiRequest<Tour[]>(url);
    },
    enabled: true
  });
}

export function useTour(id: string) {
  return useQuery({
    queryKey: ['/api/tours', id],
    queryFn: () => apiRequest<Tour>(`/api/tours/${id}`),
    enabled: !!id
  });
}

export function useCreateTour() {
  return useMutation({
    mutationFn: (tour: Partial<Tour>) => 
      apiRequest<Tour>('/api/tours', { 
        method: 'POST', 
        body: tour 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      if (data.artistId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tours', data.artistId] });
      }
    }
  });
}

export function useUpdateTour() {
  return useMutation({
    mutationFn: ({ id, ...tour }: Partial<Tour> & { id: string }) => 
      apiRequest<Tour>(`/api/tours/${id}`, { 
        method: 'PATCH', 
        body: tour 
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      if (data.artistId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tours', data.artistId] });
      }
    }
  });
}

export function useDeleteTour() {
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/tours/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
    }
  });
}

export function useAddTourEvent() {
  return useMutation({
    mutationFn: (event: Omit<TourEvent, 'id' | 'createdAt'>) => 
      apiRequest<TourEvent>(`/api/tours/${event.tourId}/events`, { 
        method: 'POST', 
        body: event 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', data.tourId] });
    }
  });
}

export function useUpdateTourEvent() {
  return useMutation({
    mutationFn: ({ id, tourId, ...event }: Partial<TourEvent> & { id: string, tourId: string }) => 
      apiRequest<TourEvent>(`/api/tours/${tourId}/events/${id}`, { 
        method: 'PATCH', 
        body: event 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', data.tourId] });
    }
  });
}

export function useDeleteTourEvent() {
  return useMutation({
    mutationFn: ({ id, tourId }: { id: string, tourId: string }) => 
      apiRequest(`/api/tours/${tourId}/events/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', variables.tourId] });
    }
  });
}

export function useOptimizeTourRoute(tourId: string) {
  return useMutation({
    mutationFn: () => 
      apiRequest<{ optimizedEvents: TourEvent[] }>(
        `/api/tours/${tourId}/optimize`, 
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours', tourId] });
    }
  });
}