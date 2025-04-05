import { useQuery } from "@tanstack/react-query";
import { Tour } from "@/types";

export const useTours = () => {
  const { data: tours, isLoading, error } = useQuery<Tour[]>({
    queryKey: ['/api/tours'],
  });

  // Get the active tour (currently just getting the first tour)
  const activeTour = tours && tours.length > 0 ? tours[0] : null;

  return {
    tours,
    activeTour,
    isLoading,
    error
  };
};
