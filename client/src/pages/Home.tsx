
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { Venue } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Music, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [, setLocation] = useLocation();
  const { setActiveVenue } = useActiveVenue();
  
  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleVenueSelect = async (venue: Venue) => {
    await setActiveVenue(venue);
    setLocation(`/venues/${venue.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to VenueHub</h1>
          <p className="text-xl text-muted-foreground">
            Select a venue to manage shows, discover artists, and plan tours
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))
          ) : venues.length > 0 ? (
            venues.map((venue) => (
              <Card 
                key={venue.id} 
                className="cursor-pointer hover:bg-accent/50 hover:shadow-lg transition-all"
                onClick={() => handleVenueSelect(venue)}
              >
                <CardHeader>
                  <CardTitle>{venue.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {venue.city}, {venue.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Capacity: {venue.capacity || 'Not specified'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Music className="h-4 w-4" />
                      {venue.genre || 'All genres'}
                    </div>
                    <div className="mt-4">
                      <Button className="w-full">
                        Manage Venue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Music className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No Venues Found</h2>
              <p className="text-muted-foreground mt-2">Add your first venue to get started</p>
              <Button onClick={() => setLocation('/venues/new')} className="mt-4">
                Add Venue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
