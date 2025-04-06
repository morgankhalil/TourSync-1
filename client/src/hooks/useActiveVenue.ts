import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { Venue } from "@shared/schema";

// Default venue name for the dashboard - can be set in a configuration file
const DEFAULT_VENUE_NAME = "Bug Jar";

export const useActiveVenue = () => {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // Store active venue in state so it can be changed
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // Initialize with a specific venue for the venue dashboard
  useEffect(() => {
    if (venues && venues.length > 0 && !selectedVenue) {
      // Try to find the default venue by name
      const defaultVenue = venues.find(venue => venue.name === DEFAULT_VENUE_NAME);
      
      // Use the default venue if found, otherwise use first venue
      setSelectedVenue(defaultVenue || venues[0]);
    }
  }, [venues, selectedVenue]);

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