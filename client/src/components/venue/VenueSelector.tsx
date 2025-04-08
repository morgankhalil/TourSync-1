import React, { useState } from 'react';
import { Check } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useVenues } from '@/hooks/useVenues';
import { useActiveVenue } from '@/hooks/useActiveVenue';

export const VenueSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { activeVenueId, setActiveVenueId, venueData } = useActiveVenue();
  const { data: venues, isLoading } = useVenues();

  const handleVenueSelect = (venueId: string) => {
    setActiveVenueId(venueId);
    localStorage.setItem('activeVenueId', venueId);
    setOpen(false);

    const selectedVenue = venues?.find(v => v.id.toString() === venueId);
    if (selectedVenue) {
      toast({
        title: "Venue Changed",
        description: `Selected venue is now ${selectedVenue.name}`,
        duration: 3000
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {venueData?.name || "Select venue..."}
          {!venueData && activeVenueId && "Loading..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search venues..." />
          <CommandEmpty>No venues found.</CommandEmpty>
          <CommandGroup>
            {Array.isArray(venues) && venues.map((venue) => (
              <CommandItem
                key={venue.id}
                value={venue.name}
                onSelect={() => handleVenueSelect(venue.id.toString())}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeVenueId === venue.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{venue.name}</span>
                {venue.city && venue.state && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {venue.city}, {venue.state}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};