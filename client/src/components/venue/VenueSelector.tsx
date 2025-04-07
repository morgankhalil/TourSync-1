import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Venue } from '@/types';

const VenueSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  // Use 'as any' to bypass TypeScript errors while the context is being refactored
  const { activeVenue, setActiveVenue, venueId, setVenueId } = useActiveVenue() as any;
  
  // Fetch venues
  const { data: venues, isLoading } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json() as Promise<Venue[]>;
    },
  });

  return (
    <div className="flex items-center">
      <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <Building className="h-4 w-4 text-primary" />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {isLoading ? (
              'Loading venues...'
            ) : activeVenue ? (
              activeVenue.name
            ) : (
              'Select a venue'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search venues..." />
            <CommandEmpty>No venue found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {venues?.map((venue) => (
                <CommandItem
                  key={venue.id}
                  value={venue.name}
                  onSelect={() => {
                    // Set both the active venue object and the venue ID
                    setActiveVenue(venue as any);
                    setVenueId(venue.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      venueId === venue.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{venue.name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {venue.city}, {venue.state}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VenueSelector;