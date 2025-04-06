import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Venue } from "@shared/schema";

export const useActiveVenue = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // Store active venue in state so it can be changed
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // Initialize with first venue if none selected
  if (venues && venues.length > 0 && !selectedVenue) {
    setSelectedVenue(venues[0]);
  }

  // Get the active venue (from state or default to first)
  const activeVenue = selectedVenue || (venues && venues.length > 0 ? venues[0] : null);

  // Provide a setter function that can be called from components
  const setActiveVenue = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  return {
    venues,
    activeVenue,
    setActiveVenue,
    isLoading,
    error
  };
};