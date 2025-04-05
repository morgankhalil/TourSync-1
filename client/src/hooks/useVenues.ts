import { useQuery } from "@tanstack/react-query";
import { Venue } from "@/types";

export const useVenues = () => {
  // For demo purposes, we're loading all venues
  const { data: allVenues, isLoading: isLoadingAll } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // For nearby venues, we would typically filter by location
  // In a real app, this would use coordinates based on the current map view
  const nearbyVenues = allVenues?.slice(0, 5);

  return {
    allVenues,
    nearbyVenues,
    isLoading: isLoadingAll
  };
};
