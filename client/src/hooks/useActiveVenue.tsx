import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Venue } from '../types';

// Mock data for development
const MOCK_VENUE: Venue = {
  id: 1,
  name: "Bug Jar",
  address: "219 Monroe Ave",
  city: "Rochester",
  state: "NY",
  zipCode: "14607",
  latitude: "43.15",
  longitude: "-77.59",
  capacity: 200,
  contactName: "Aaron Smith",
  contactEmail: "booking@bugjar.com",
  contactPhone: "585-555-1212",
  description: "Iconic small music venue known for indie rock and alternative music",
  genre: "Indie Rock, Alternative, Punk",
  location: "Rochester, NY",
  imageUrl: null,
  website: "https://bugjar.com",
  socialMedia: null,
  paymentTerms: null,
  minimumDraw: 50,
  amenities: null,
  stageDimensions: null,
  technicalSpecs: null,
  accessibility: null,
  parkingInfo: null,
  nearbyAccommodation: null,
  foodOptions: null,
  loadingInfo: null,
  priceRange: null
};

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
  const [activeVenue, setActiveVenue] = useState<Venue | null>(MOCK_VENUE); // Use mock data for development
  const [venueId, setVenueId] = useState<number | null>(1); // Default to venue 1 for demo
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // In a real app, we would fetch from API
  // For now, we'll just use mock data for demonstration

  const contextValue: ActiveVenueContextType = {
    activeVenue, 
    setActiveVenue, 
    venueId, 
    setVenueId, 
    isLoading,
    error
  };

  return (
    <ActiveVenueContext.Provider value={contextValue}>
      {children}
    </ActiveVenueContext.Provider>
  );
};

export const useActiveVenue = () => useContext(ActiveVenueContext);