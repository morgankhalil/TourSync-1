import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface Band {
  id: string;
  name: string;
  genres: string[];
  imageUrl?: string;
  website?: string;
  description?: string;
  location?: string;
  followers?: number;
  monthlyListeners?: number;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    spotify?: string;
    appleMusic?: string;
    bandcamp?: string;
    soundcloud?: string;
  };
  createdAt: Date;
}

export interface BandWithCompatibility extends Band {
  compatibility: {
    score: number;
    genreOverlap: number;
    audienceMatch: number;
  };
}

export function useBands() {
  return useQuery({
    queryKey: ['/api/artists'],
    queryFn: () => apiRequest<Band[]>('/api/artists')
  });
}

export function useBand(id: string) {
  return useQuery({
    queryKey: ['/api/artists', id],
    queryFn: () => apiRequest<Band>(`/api/artists/${id}`),
    enabled: !!id
  });
}

export function useCreateBand() {
  return useMutation({
    mutationFn: (band: Partial<Band>) => 
      apiRequest<Band>('/api/artists', { 
        method: 'POST', 
        body: band 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artists'] });
    }
  });
}

export function useUpdateBand() {
  return useMutation({
    mutationFn: ({ id, ...band }: Partial<Band> & { id: string }) => 
      apiRequest<Band>(`/api/artists/${id}`, { 
        method: 'PATCH', 
        body: band 
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/artists', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/artists'] });
    }
  });
}

export function useDeleteBand() {
  return useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/artists/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/artists', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/artists'] });
    }
  });
}

export function useCompatibleBands(bandId: string, minScore: number = 50) {
  return useQuery({
    queryKey: ['/api/artists/compatible', bandId, minScore],
    queryFn: () => apiRequest<BandWithCompatibility[]>(
      `/api/artists/${bandId}/compatibility`,
      { queryParams: { minScore: String(minScore) } }
    ),
    enabled: !!bandId
  });
}

export function useNearbyBands(latitude: number, longitude: number, radius: number = 50) {
  return useQuery({
    queryKey: ['/api/artists/nearby', latitude, longitude, radius],
    queryFn: () => apiRequest<Array<Band & { distance: number }>>(
      '/api/artists/near-location',
      { 
        queryParams: {
          lat: String(latitude),
          lng: String(longitude),
          radius: String(radius)
        } 
      }
    ),
    enabled: !!latitude && !!longitude
  });
}