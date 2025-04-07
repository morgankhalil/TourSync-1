
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bandsintownService } from "@/services/bandsintown";
import { useToast } from "@/hooks/use-toast";

export function AddVenueModal() {
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const venueData = await bandsintownService.searchVenue(venueName, location);
      if (venueData) {
        const details = await bandsintownService.getVenueDetails(venueData.id);
        // Add venue to your database with the fetched details
        // You'll need to implement this API endpoint
        const response = await fetch('/api/venues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...details,
            bandsintownId: venueData.id
          })
        });
        
        if (response.ok) {
          toast({
            title: "Success",
            description: "Venue added successfully"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch venue data",
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
