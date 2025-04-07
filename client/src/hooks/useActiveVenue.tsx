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
  const [venueId, setVenueId] = useState<number | null>(null);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  
  // Function to refresh venue data
  const refreshVenue = useCallback(() => {
    if (venueId) {
      console.log(`Refreshing venue data for ID ${venueId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/venues', venueId] });
    }
  }, [venueId, queryClient]);
  
  // Handle venueId changes with cache clearing
  const handleSetVenueId = useCallback((id: number | null) => {
    console.log(`Setting venueId from ${venueId} to ${id}`);
    
    // Use the enhanced client for better logging and error handling
    EnhancedBandsintownDiscoveryClient.clearCache()
      .then((result) => {
        console.log("API cache cleared for venue ID change:", result);
        
        // After clearing the cache, invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
        queryClient.invalidateQueries({ queryKey: ['/api/bandsintown-discovery-v2'] });
        
        // Update the venue ID after cache is cleared
        setVenueId(id);
      })
      .catch((error) => {
        console.error("Failed to clear API cache:", error);
        // Still update the venue ID even if cache clearing fails
        setVenueId(id);
        // Still invalidate queries
        queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      });
  }, [venueId, queryClient]);
  
  // Fetch venue data from the API
  const { data: venue, isLoading, error: venueError } = useQuery({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      console.log(`Fetching specific venue with ID: ${venueId}`);
      const response = await fetch(`/api/venues/${venueId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch venue with ID ${venueId}`);
      }
      const data = await response.json() as Venue;
      console.log(`Loaded venue data:`, data);
      return data;
    },
    enabled: !!venueId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Fetch all venues for selection
  const { data: venues } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      console.log('Fetching all venues');
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const data = await response.json() as Venue[];
      console.log(`Loaded ${data.length} venues`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Direct setter with better logging and cache management
  const handleSetActiveVenue = useCallback((venue: Venue | null) => {
    console.log(`Setting active venue to:`, venue);
    
    if (venue) {
      setVenueId(venue.id);
      setActiveVenue(venue);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venue.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bandsintown-discovery-v2'] });
      
      // Clear discovery cache in background
      EnhancedBandsintownDiscoveryClient.clearCache()
        .catch(error => console.error("Failed to clear API cache:", error));
    } else {
      setVenueId(null);
      setActiveVenue(null);
    }
  }, [venueId, queryClient]);
  
  // Update activeVenue when venue data changes
  useEffect(() => {
    if (venue) {
      console.log(`Setting active venue from fetched data:`, venue);
      setActiveVenue(venue);
    } else if (venues && venues.length > 0 && !activeVenue) {
      const firstVenue = venues[0];
      console.log(`Setting default venue to:`, firstVenue);
      setActiveVenue(firstVenue);
      setVenueId(firstVenue.id);
      
      toast({
        title: "Default venue selected",
        description: `Selected venue: ${firstVenue.name}`,
        duration: 3000
      });
    }
  }, [venue, venues, activeVenue, toast]);

  // When venue ID changes, log information
  useEffect(() => {
    console.log(`Current venue ID: ${venueId}, Venue object:`, activeVenue);
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