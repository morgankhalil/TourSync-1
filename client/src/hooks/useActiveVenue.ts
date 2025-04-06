import { useQuery } from "@tanstack/react-query";
import { Venue } from "@/types";

export const useActiveVenue = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // Get the active venue (currently just getting the first venue)
  // In a real application, this would be based on user login or selection
  const activeVenue = venues && venues.length > 0 ? venues[0] : null;

  return {
    venues,
    activeVenue,
    isLoading,
    error
  };
};