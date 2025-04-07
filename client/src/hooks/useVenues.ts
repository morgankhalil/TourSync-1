import { useQuery } from "@tanstack/react-query";
import { Venue } from "../types";

export const useVenues = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues'); //Corrected to lowercase
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    venues,
    isLoading,
    error
  };
};