import React from 'react';
import { useLocation } from 'wouter';
import { Venue } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, Calendar, Users, Music, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const VenueList = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use react-query to fetch venues
  const { data: venues = [], isLoading, error } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle error with toast notification
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching venues",
        description: "There was a problem loading the venues. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Venues</h1>
        <p className="text-muted-foreground mt-2">
          Browse and select venues for your tour dates
        </p>
      </div>

      {venues && venues.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-lg">
          <p className="text-lg text-muted-foreground">No venues found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues && venues.map((venue: Venue) => (
            <Card 
              key={venue.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-primary/10"
            >
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-xl">{venue.name}</CardTitle>
                <CardDescription className="flex items-center text-sm">
                  <MapPin size={14} className="mr-1" />
                  {venue.city}, {venue.state}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <p className="text-sm mb-4">{venue.address}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                  <div className="flex items-center">
                    <Users size={16} className="mr-1 text-primary" />
                    <span>Capacity: {venue.capacity || 'N/A'}</span>
                  </div>
                  
                  {venue.dealType && (
                    <div className="flex items-center">
                      <Tag size={16} className="mr-1 text-primary" />
                      <span>Deal: {venue.dealType}</span>
                    </div>
                  )}
                  
                  {venue.contactEmail && (
                    <div className="flex items-center col-span-2 truncate">
                      <span className="text-xs text-muted-foreground truncate">
                        Contact: {venue.contactName || venue.contactEmail}
                      </span>
                    </div>
                  )}
                </div>
                
                {venue.genre && (
                  <div className="flex items-center mt-2">
                    <Music size={14} className="mr-1 text-primary" />
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {venue.genre}
                    </span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between items-center bg-muted/10">
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full"
                  onClick={() => setLocation(`/venue-profile/${venue.id}`)}
                >
                  <Calendar size={16} className="mr-2" />
                  View Venue Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;