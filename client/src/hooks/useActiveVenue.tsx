import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useVenue } from './useVenues';

interface ActiveVenueContextType {
  activeVenueId: string | null;
  setActiveVenueId: (id: string | null) => void;
  isLoading: boolean;
  venueData: any | null;
  error: unknown;
}

const ActiveVenueContext = createContext<ActiveVenueContextType | undefined>(undefined);

export const ActiveVenueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(() => {
    // Try to get from localStorage on initial render
    const storedId = localStorage.getItem('activeVenueId');
    return storedId ? storedId : null;
  });

  const { data, isLoading, error } = useVenue(activeVenueId || '');

  // Update localStorage when activeVenueId changes
  useEffect(() => {
    if (activeVenueId) {
      localStorage.setItem('activeVenueId', activeVenueId);
    } else {
      localStorage.removeItem('activeVenueId');
    }
  }, [activeVenueId]);

  const value = {
    activeVenueId,
    setActiveVenueId,
    isLoading,
    venueData: data || null,
    error
  };

  return (
    <ActiveVenueContext.Provider value={value}>
      {children}
    </ActiveVenueContext.Provider>
  );
};

export function useActiveVenue() {
  const context = useContext(ActiveVenueContext);
  
  if (context === undefined) {
    throw new Error('useActiveVenue must be used within an ActiveVenueProvider');
  }
  
  return context;
}