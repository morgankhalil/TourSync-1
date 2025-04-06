import { useQuery } from "@tanstack/react-query";
import { Band } from "@/types";

export const useBands = () => {
  const { data: bands, isLoading, error } = useQuery<Band[]>({
    queryKey: ['/api/bands'],
  });

  return {
    bands,
    isLoading,
    error
  };
};