import * as React from 'react';
import { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Venue } from '../types';

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

export const ActiveVenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [venueId, setVenueId] = useState<number | null>(38); // Default to Bug Jar venue (ID 38)
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  
  // Fetch venue data from the API
  const { data: venue, isLoading, error: venueError } = useQuery({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const response = await fetch(`/api/venues/${venueId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch venue');
      }
      return response.json() as Promise<Venue>;
    },
    enabled: !!venueId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Fetch all venues for selection
  const { data: venues } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json() as Promise<Venue[]>;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Update activeVenue when venue data changes
  useEffect(() => {
    if (venue) {
      setActiveVenue(venue);
    } else if (venues && venues.length > 0 && !activeVenue) {
      // If we have venues but no active venue, set the first one
      const bugJar = venues.find(v => v.name === "Bug Jar") || venues[0];
      setActiveVenue(bugJar);
      setVenueId(bugJar.id);
    }
  }, [venue, venues, activeVenue]);

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