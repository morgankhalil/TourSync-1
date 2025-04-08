import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Building, RefreshCw } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useVenues } from '@/hooks/useVenues';

const VenueSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { activeVenueId, setActiveVenueId, venueData } = useActiveVenue();
  
  // Use the venues hook from useVenues
  const { data: venues, isLoading, refetch } = useVenues();

  // Handle venue selection
  const handleVenueSelect = (venueId: string) => {
    if (activeVenueId === venueId) {
      setOpen(false);
      return;
    }
    
    // Set active venue ID
    setActiveVenueId(venueId);
    
    // Close the popover
    setOpen(false);
    
    // Show a toast to confirm venue change
    const selectedVenue = venues?.find(v => v.id.toString() === venueId);
    if (selectedVenue) {
      toast({
        title: "Venue Changed",
        description: `Selected venue is now ${selectedVenue.name}`,
        duration: 3000
      });
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh venues list
      await refetch();
      
      toast({
        title: "Data Refreshed",
        description: "Venue information has been refreshed",
        duration: 2000
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh venue data",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setRefreshing(false);
    }
  };

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
            ) : venueData ? (
              venueData.name
            ) : (
              'Select a venue'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search venues..." />
            <CommandEmpty>No venue found.</CommandEmpty>
            <div className="flex justify-end p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 gap-1 text-xs"
                disabled={refreshing}
                onClick={handleRefresh}
              >
                <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {venues?.map((venue) => (
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

export { VenueSelector };