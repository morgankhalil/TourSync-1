import * as React from 'react';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Venue } from '../types';
import { useToast } from '@/hooks/use-toast';
import { EnhancedBandsintownDiscoveryClient } from '../services/bandsintown-discovery-v2';

interface ActiveVenueContextType {
  activeVenue: Venue | null;
  venue: Venue | null; // Add this for backward compatibility
  setActiveVenue: (venue: Venue | null) => void;
  venueId: number | null;
  setVenueId: (id: number | null) => void;
  isLoading: boolean;
  error: Error | null;
  refreshVenue: () => void;
}

const defaultActiveVenueContext: ActiveVenueContextType = {
  activeVenue: null,
  venue: null, // Add venue property for backward compatibility
  setActiveVenue: () => {},
  venueId: null,
  setVenueId: () => {},
  isLoading: false,
  error: null,
  refreshVenue: () => {}
};

const ActiveVenueContext = createContext<ActiveVenueContextType>(defaultActiveVenueContext);

export const ActiveVenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [venueId, setVenueId] = useState<number | null>(45); // Default to first venue (Empty Bottle)
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  
  // Function to refresh venue data
  const refreshVenue = useCallback(() => {
    if (venueId) {
      console.log(`Refreshing venue data for ID ${venueId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/venues', venueId] });
    }
  }, [venueId, queryClient]);
  
  // Simplified handling of venueId changes
  const handleSetVenueId = useCallback((id: number | null) => {
    console.log(`Setting venueId from ${venueId} to ${id}`);
    setVenueId(id || 45); // Always use a default venue ID if null is passed
  }, [venueId]);
  
  // Fetch venue data from the API - always using the default venue
  const { data: venue, isLoading, error: venueError } = useQuery({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      console.log(`!!! Fetching specific venue with ID: ${venueId}`);
      const response = await fetch(`/api/venues/${venueId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch venue with ID ${venueId}`);
      }
      const data = await response.json() as Venue;
      console.log(`!!! Loaded venue data:`, data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Simplified direct setter for active venue
  const handleSetActiveVenue = useCallback((venue: Venue | null) => {
    console.log(`Setting active venue to:`, venue);
    
    if (venue) {
      // Update both venue ID and active venue immediately
      setVenueId(venue.id);
      setActiveVenue(venue);
    } else {
      // If null is passed, use default venue ID
      setVenueId(45);
    }
  }, []);
  
  // Update activeVenue when venue data changes
  useEffect(() => {
    if (venue) {
      console.log(`Setting active venue from fetched data:`, venue);
      setActiveVenue(venue);
    }
  }, [venue]);

  // When venue ID changes, log information
  useEffect(() => {
    console.log(`!!!!! Current venue ID: ${venueId}, Venue object:`, activeVenue);
  }, [venueId, activeVenue]);

  const contextValue: ActiveVenueContextType = {
    activeVenue, 
    venue: activeVenue, // Add venue property that mirrors activeVenue for backward compatibility
    setActiveVenue: handleSetActiveVenue, 
    venueId, 
    setVenueId: handleSetVenueId, 
    isLoading,
    error: venueError instanceof Error ? venueError : null,
    refreshVenue
  };

  return (
    <ActiveVenueContext.Provider value={contextValue}>
      {children}
    </ActiveVenueContext.Provider>
  );
};

export const useActiveVenue = () => useContext(ActiveVenueContext);