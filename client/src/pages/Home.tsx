
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { Venue } from "@shared/schema";
import { MapPin, Users } from "lucide-react";

const Home = () => {
  const [, setLocation] = useLocation();
  const { setActiveVenue } = useActiveVenue();
  
  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleVenueSelect = (venue: Venue) => {
    setActiveVenue(venue);
    setLocation('/dashboard');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to Venue Manager</h1>
        <p className="text-xl text-muted-foreground">
          Select a venue to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {venues.map((venue) => (
          <Card 
            key={venue.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Capacity: {venue.capacity || 'Not specified'}
              </div>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <div className="col-span-2 text-center py-12">
            Loading venues...
          </div>
        )}

        {!isLoading && venues.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            No venues found. Please add a venue to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
