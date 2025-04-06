import { useQuery } from "@tanstack/react-query";
import { Venue } from "@shared/schema";

export const useVenues = () => {
  // For demo purposes, we're loading all venues
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // For nearby venues, we would typically filter by location
  // In a real app, this would use coordinates based on the current map view
  const nearbyVenues = venues?.slice(0, 5);

  return {
    venues,
    nearbyVenues,
    isLoading,
    error
  };
};
