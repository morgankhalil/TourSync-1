import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { Venue } from '@shared/schema';

interface ActiveVenueContextType {
  venue: Venue | null;
  isLoading: boolean;
  error: string | null;
  setActiveVenue: (venue: Venue) => void;
}

// Default context value
const defaultContextValue: ActiveVenueContextType = {
  venue: null,
  isLoading: true,
  error: null,
  setActiveVenue: () => {}
};

// Create context
export const ActiveVenueContext = createContext<ActiveVenueContextType>(defaultContextValue);

// Hook to use the active venue context
export const useActiveVenue = () => useContext(ActiveVenueContext);

// Provider function component
export const ActiveVenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the user's active venue on component mount
  useEffect(() => {
    const fetchActiveVenue = async () => {
      try {
        // For now, we're just getting the first venue in the database
        // In a real production app, this would come from a user profile
        const response = await axios.get('/api/venues');
        if (response.data && response.data.length > 0) {
          // Get the venue with ID 1 (Bug Jar in Rochester) or the first venue
          const venueData = response.data.find((v: Venue) => v.id === 1) || response.data[0];
          setVenue(venueData);
        } else {
          setError('No venues found');
        }
      } catch (err) {
        setError('Error fetching venue data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveVenue();
  }, []);

  // Function to update the active venue
  const setActiveVenue = (newVenue: Venue) => {
    setVenue(newVenue);
  };

  return (
    <ActiveVenueContext.Provider value={{ venue, isLoading, error, setActiveVenue }}>
      {children}
    </ActiveVenueContext.Provider>
  );
};