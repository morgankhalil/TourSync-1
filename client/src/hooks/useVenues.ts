import { useQuery } from "@tanstack/react-query";
import { Venue } from "@shared/schema";

export const useVenues = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json();
    },
    retry: 3,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const nearbyVenues = venues?.slice(0, 5);

  return {
    venues: venues || [],
    nearbyVenues,
    isLoading,
    error
  };
};
