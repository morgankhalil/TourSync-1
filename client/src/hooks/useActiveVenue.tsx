import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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

export const ActiveVenueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [venueId, setVenueId] = useState<number | null>(1); // Default to venue 1 for demo
  
  // Fetch venue data from API when venueId changes
  const { isLoading, error } = useQuery({
    queryKey: venueId ? ['/api/venues', venueId] : ['skip-query'],
    queryFn: async () => {
      if (!venueId) return null;
      const response = await fetch(`/api/venues/${venueId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch venue');
      }
      return response.json();
    },
    enabled: !!venueId,
    onSuccess: (data) => {
      if (data) {
        setActiveVenue(data);
      }
    }
  });

  return (
    <ActiveVenueContext.Provider 
      value={{ 
        activeVenue, 
        setActiveVenue, 
        venueId, 
        setVenueId, 
        isLoading,
        error
      }}>
      {children}
    </ActiveVenueContext.Provider>
  );
};

export const useActiveVenue = () => useContext(ActiveVenueContext);