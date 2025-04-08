import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useVenue, Venue } from './useVenues';

interface ActiveVenueContextType {
  // Original properties
  activeVenueId: string | null;
  setActiveVenueId: (id: string | null) => void;
  isLoading: boolean;
  venueData: Venue | null;
  error: unknown;
  
  // Added properties for enhanced compatibility
  venue: Venue | null;  // Alias for venueData to maintain compatibility
  venueId: number | null; // Numeric ID for compatibility with discovery API
}

const ActiveVenueContext = createContext<ActiveVenueContextType | undefined>(undefined);

export const ActiveVenueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeVenueId, setActiveVenueId] = useState<string | null>(() => {
    try {
      // Try to get from localStorage or user's venueId
      const storedId = localStorage.getItem('activeVenueId');
      if (storedId) return storedId;
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.userType === 'venue' && user.venueId) {
          console.log('Setting active venue ID:', user.venueId);
          return user.venueId.toString();
        }
      }
    } catch (e) {
      console.error('Error reading venue ID:', e);
    }
    return null;
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

  // Convert string ID to numeric ID for API compatibility
  const numericId = activeVenueId ? parseInt(activeVenueId, 10) : null;

  const value = {
    activeVenueId,
    setActiveVenueId,
    isLoading,
    venueData: data || null,
    error,
    
    // Aliases for enhanced compatibility
    venue: data || null,
    venueId: !isNaN(numericId as number) ? numericId : null
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