import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Globe, Music, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

const EventCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events', date?.toISOString()],
    queryFn: async () => {
      // If we have a date, get events for that month
      if (date) {
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const response = await fetch(`/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        return response.json();
      }
      
      // Otherwise just get all upcoming events
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    }
  });

  // Get artists to display names
  const { data: artists } = useQuery({
    queryKey: ['/api/artists'],
    queryFn: async () => {
      const response = await fetch('/api/artists');
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      return response.json();
    }
  });

  // Function to get all the dates that have events
  const getEventDates = () => {
    if (!events) return [];
    
    return events.map((event: any) => {
      const eventDate = new Date(event.eventDate);
      // Return date without time
      return new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    });
  };

  // Function to get events for the selected date
  const getEventsForDate = (selectedDate: Date) => {
    if (!events) return [];
    
    return events.filter((event: any) => {
      const eventDate = new Date(event.eventDate);
      return eventDate.getDate() === selectedDate.getDate() &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  // Get events for the currently selected date
  const selectedDateEvents = date ? getEventsForDate(date) : [];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Event Calendar</h1>
      <p className="text-muted-foreground mb-8">
        Browse upcoming events and find collaboration opportunities
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              View events for a specific date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Wrap calendar in div to prevent button nesting issues with the sidebar venue selector */}
            <div className="calendar-wrapper">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border mx-auto"
                modifiers={{
                  event: getEventDates()
                }}
                modifiersStyles={{
                  event: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {date ? (
                  <span>Events for {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                ) : (
                  <span>All Upcoming Events</span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedDateEvents.length} events found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map((event: any) => {
                    const artist = artists?.find((a: any) => a.id === event.artistId);
                    const eventDate = new Date(event.eventDate);
                    const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={event.id} className="flex gap-4 p-4 border rounded-lg">
                        {/* Tour poster - use a music-themed placeholder if no image */}
                        <div className="h-24 w-24 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                          {event.posterUrl ? (
                            <img 
                              src={event.posterUrl} 
                              alt={`${artist?.name || 'Event'} tour poster`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.log("Image failed to load:", event.posterUrl);
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-primary/50"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>';
                              }}
                            />
                          ) : artist?.imageUrl ? (
                            <img 
                              src={artist.imageUrl} 
                              alt={artist.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-primary/50"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>';
                              }}
                            />
                          ) : (
                            <Music className="h-6 w-6 text-primary/50" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-semibold">
                              {artist?.name || "Unknown Artist"}
                            </h3>
                            <div className="text-sm font-medium">
                              {formattedTime}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {event.venueName}
                          </p>
                          
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {event.venueCity}, {event.venueState || event.venueCountry}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            {event.collaborationOpen && (
                              <Badge variant="secondary" className="text-xs">
                                Open for Collaboration
                              </Badge>
                            )}
                            
                            <Button size="sm" variant="outline" asChild className="ml-auto">
                              <Link href={`/artists/${event.artistId}`} className="flex items-center gap-1">
                                View Artist 
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8">
                  <h3 className="font-semibold mb-1">No Events Found</h3>
                  <p className="text-muted-foreground">
                    There are no events scheduled for this date.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <Button asChild variant="outline">
                <Link href="/artists/discovery">
                  Discover More Artists
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;