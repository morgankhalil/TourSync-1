
import { useQuery } from "@tanstack/react-query";
import { Venue } from "../types";

export const useVenues = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // For nearby venues, we filter by location
  const nearbyVenues = venues?.slice(0, 5);

  return {
    venues,
    nearbyVenues,
    isLoading,
    error
  };
};
