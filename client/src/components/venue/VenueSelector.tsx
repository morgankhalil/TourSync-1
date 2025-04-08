
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Venue } from '@/hooks/useVenues';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function VenueSelector() {
  const { data: venues, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json();
    }
  });

  const { venueData, setActiveVenueId } = useActiveVenue();

  if (isLoading) {
    return <div>Loading venues...</div>;
  }

  if (!venues || venues.length === 0) {
    return <div>No venues found</div>;
  }

  return (
    <Select 
      value={venueData?.id?.toString() || ''} 
      onValueChange={(value) => {
        setActiveVenueId(value);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a venue" />
      </SelectTrigger>
      <SelectContent>
        {venues.map((venue: Venue) => (
          <SelectItem key={venue.id} value={venue.id.toString()}>
            {venue.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
