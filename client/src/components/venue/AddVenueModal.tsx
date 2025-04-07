
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export function AddVenueModal() {
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!venueName || !location) {
      toast({
        title: "Missing information",
        description: "Please enter both venue name and location",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // First search for venue
      const searchResponse = await fetch(`/api/bandsintown/venue/search?name=${encodeURIComponent(venueName)}&location=${encodeURIComponent(location)}`);
      const searchResult = await searchResponse.json();
      
      if (!searchResult?.id) {
        throw new Error('Venue not found');
      }

      // Get detailed venue info
      const detailsResponse = await fetch(`/api/bandsintown/venue/${searchResult.id}`);
      const venueDetails = await detailsResponse.json();

      // Add venue to database
      const createResponse = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: venueDetails.name,
          address: venueDetails.address || '',
          city: venueDetails.city || '',
          state: venueDetails.region || '',
          country: venueDetails.country || 'United States',
          postalCode: venueDetails.postal_code || '',
          latitude: venueDetails.latitude?.toString() || null,
          longitude: venueDetails.longitude?.toString() || null,
          bandsintownId: searchResult.id
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create venue');
      }

      toast({
        title: "Success",
        description: "Venue added successfully"
      });

      // Refresh venues list
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      
      // Reset form
      setVenueName('');
      setLocation('');
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add venue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add New Venue</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Venue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="venueName">Venue Name</Label>
            <Input
              id="venueName"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Enter venue name"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search and Add Venue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
