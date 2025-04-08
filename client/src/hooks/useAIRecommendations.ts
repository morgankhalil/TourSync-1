
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Band, Venue } from '@/types';

export function useAIRecommendations(band: Band | null, venues: Venue[]) {
  return useQuery({
    queryKey: ['ai-recommendations', band?.id, venues.map(v => v.id)],
    queryFn: async () => {
      if (!band || venues.length === 0) return null;
      return apiRequest({
        url: '/api/ai/venue-recommendations',
        method: 'POST',
        data: { band, venues }
      });
    },
    enabled: !!band && venues.length > 0
  });
}
