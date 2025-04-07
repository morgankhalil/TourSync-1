import React, { useState, useEffect } from 'react';
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
import { Venue } from '@/types';
import { EnhancedBandsintownDiscoveryClient } from '@/services/bandsintown-discovery-v2';

const VenueSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { activeVenue, setActiveVenue, venueId, setVenueId, refreshVenue } = useActiveVenue();
  
  // Fetch venues
  const { data: venues, isLoading, refetch } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      console.log('Fetching venues...');
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const venueData = await response.json() as Venue[];
      console.log('Fetched venues:', venueData);
      return venueData;
    },
  });

  // Debug logging for venue changes
  useEffect(() => {
    console.log("Current active venue ID:", venueId);
    console.log("Current active venue object:", activeVenue);
  }, [venueId, activeVenue]);

  // Handle venue selection with more thorough approach
  const handleVenueSelect = (venue: Venue) => {
    console.log(`Selecting venue: ${venue.name} (ID: ${venue.id})`);
    
    if (venueId === venue.id) {
      console.log("Venue already selected, no change needed");
      setOpen(false);
      return;
    }
    
    // Set active venue - this will handle ID updates and cache clearing internally
    setActiveVenue(venue);
    
    // Close the popover
    setOpen(false);
    
    // Show a toast to confirm venue change
    toast({
      title: "Venue Changed",
      description: `Selected venue is now ${venue.name}`,
      duration: 3000
    });
  };
  
  // Handle manual refresh with enhanced client
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear API cache using the enhanced client
      const cacheResult = await EnhancedBandsintownDiscoveryClient.clearCache();
      console.log("Cache cleared:", cacheResult);
      
      // Refresh venue data
      refreshVenue();
      
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
            ) : activeVenue ? (
              activeVenue.name
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
                  onSelect={() => handleVenueSelect(venue)}
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