import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';

export default function AddVenueModal() {
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    setIsLoading(true);

    if (!venueName || !location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      // First search for venue
      const searchResponse = await fetch(`/api/bandsintown/venue/search?name=${encodeURIComponent(venueName)}&location=${encodeURIComponent(location)}`);
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(`Error searching for venue: ${searchResponse.status} - ${errorData.message || 'Unknown error'}`);
      }
      const searchResult = await searchResponse.json();

      if (!searchResult?.id) {
        throw new Error('Venue not found');
      }

      // Get detailed venue info
      const detailsResponse = await fetch(`/api/bandsintown/venue/${searchResult.id}`);
      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        throw new Error(`Error fetching venue details: ${detailsResponse.status} - ${errorData.message || 'Unknown error'}`);
      }
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
        const errorData = await createResponse.json();
        throw new Error(`Failed to create venue: ${createResponse.status} - ${errorData.message || 'Unknown error'}`);
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