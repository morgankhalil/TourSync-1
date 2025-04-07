import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Venue } from '../types';
import { apiRequest } from '../lib/queryClient';

interface ActiveVenueContextType {
  activeVenue: Venue | null;
  setActiveVenue: (venue: Venue | null) => void;
  venueId: number | null;
  setVenueId: (id: number | null) => void;
  isLoading: boolean;
  error: Error | null;
}

const defaultActiveVenueContext: ActiveVenueContextType = {
  activeVenue: null,
  setActiveVenue: () => {},
  venueId: null,
  setVenueId: () => {},
  isLoading: false,
  error: null
};

const ActiveVenueContext = createContext<ActiveVenueContextType>(defaultActiveVenueContext);

export const ActiveVenueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [venueId, setVenueId] = useState<number | null>(38); // Default to Bug Jar venue (ID 38)
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  
  // Fetch venue data from the API
  const { data: venue, isLoading, error: venueError } = useQuery({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      return apiRequest<Venue>(`/api/venues/${venueId}`);
    },
    enabled: !!venueId
  });
  
  // Update activeVenue when venue data changes
  useEffect(() => {
    if (venue) {
      setActiveVenue(venue);
    }
  }, [venue]);

  const contextValue: ActiveVenueContextType = {
    activeVenue, 
    setActiveVenue, 
    venueId, 
    setVenueId, 
    isLoading,
    error: venueError instanceof Error ? venueError : null
  };

  return (
    <ActiveVenueContext.Provider value={contextValue}>
      {children}
    </ActiveVenueContext.Provider>
  );
};

export const useActiveVenue = () => useContext(ActiveVenueContext);