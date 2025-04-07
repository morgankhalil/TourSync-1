import React, { useState } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueCalendarSidebar } from '@/components/venue/VenueCalendarSidebar';
import { TourDate } from '@/types';
import axios from 'axios';
import { formatDate } from '@/lib/utils';
import { CalendarDays, Music, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Extended TourDate type with optional title and bandId for display purposes
interface ExtendedTourDate extends TourDate {
  title?: string;
  bandId?: number;
}

// Event card component to reduce repetition
const EventCard = ({ event }: { event: ExtendedTourDate }) => {
  // Use the band name or a fallback title
  const eventTitle = event.title || event.venueName || `Event on ${formatDate(event.date)}`;

  return (
    <Card key={event.id} className="overflow-hidden border">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="bg-muted rounded-md p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase">
                {formatDate(event.date, 'EEEE')}
              </div>
              <div className="text-3xl font-bold">
                {formatDate(event.date, 'd')}
              </div>
              <div className="text-sm font-medium">
                {formatDate(event.date, 'MMM yyyy')}
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold">
              {event.isOpenDate ? 'Open Date' : eventTitle}
            </h3>
            {event.tourId && (
              <div className="flex items-center mt-1 text-muted-foreground text-sm">
                <Music className="h-3 w-3 mr-1" />
                {event.title ? 
                  `${event.title} Tour` : 
                  (event.tourId ? `Tour ID: ${event.tourId}` : 'No tour assigned')}
              </div>
            )}
            <div className="flex mt-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {event.city}, {event.state}
              </div>
            </div>
            {event.notes && (
              <div className="mt-2 text-sm text-muted-foreground">
                {event.notes}
              </div>
            )}
          </div>
          <div className="md:col-span-1 flex flex-col justify-center items-end">
            <div className="inline-flex justify-end space-x-2">
              <Button variant="outline" size="sm">Details</Button>
              {new Date(event.date) >= new Date() && !event.isOpenDate && (
                <Button size="sm">Confirm</Button>
              )}
              {event.isOpenDate && (
                <Button size="sm" variant="secondary">Find Artist</Button>
              )}
            </div>
            {!event.isOpenDate && (
              <div className="mt-2">
                <Badge variant={
                  event.status === 'confirmed' ? 'default' :
                  event.status === 'cancelled' ? 'destructive' :
                  'secondary'
                } className="text-xs">
                  {event.status || 'Pending'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const VenueCalendar: React.FC = () => {
  const { activeVenue: venue } = useActiveVenue();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Full query implementation with proper query function
  const { data: upcomingDates, isLoading, error } = useQuery({
    queryKey: ['/api/venues', venue?.id, 'dates'],
    queryFn: async () => {
      if (!venue) return [];
      console.log("Fetching venue dates for venue ID:", venue.id);
      try {
        const response = await axios.get(`/api/venues/${venue.id}/dates`);
        console.log("Received venue dates:", response.data);
        
        // Get tours to find band names
        const toursResponse = await axios.get('/api/tours');
        const tours = toursResponse.data;
        
        // Get all bands for matching
        const bandsResponse = await axios.get('/api/bands');
        const bands = bandsResponse.data;
        
        // Enhance tour dates with band names
        const enhancedDates = response.data.map((date: TourDate) => {
          const tour = tours.find((t: any) => t.id === date.tourId);
          const band = tour ? bands.find((b: any) => b.id === tour.bandId) : null;
          
          return {
            ...date,
            title: band?.name || `Event on ${formatDate(date.date)}`,
            bandId: band?.id
          };
        });
        
        console.log("Enhanced dates with band info:", enhancedDates);
        return enhancedDates as ExtendedTourDate[];
      } catch (err) {
        console.error("Error fetching venue dates:", err);
        throw err;
      }
    },
    enabled: !!venue,
  });

  // Filter dates based on current date
  const currentDate = new Date();
  console.log("Current date for comparison:", currentDate);

  const upcomingShows = upcomingDates?.filter(date => {
    const eventDate = new Date(date.date);
    console.log(`Date ${date.id}: ${date.date}, parsed as:`, eventDate);
    return eventDate >= currentDate && !date.isOpenDate;
  }) || [];

  const pastShows = upcomingDates?.filter(date => {
    const eventDate = new Date(date.date);
    return eventDate < currentDate && !date.isOpenDate;
  }) || [];

  const openDates = upcomingDates?.filter(date => {
    return date.isOpenDate;
  }) || [];

  // If no venue is selected, show a message
  if (!venue) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Active Venue Selected</CardTitle>
            <CardDescription>Select a venue to view and manage your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to select or create a venue to use the Calendar feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // EmptyState component for reuse
  const EmptyState = ({ title, description, buttonText, buttonIcon, buttonAction }: any) => (
    <div className="text-center py-12">
      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {buttonText && (
        <Button className="mt-4" onClick={buttonAction}>
          {buttonIcon}
          {buttonText}
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Venue Calendar</h1>
            <p className="text-muted-foreground">
              Manage your venue's booking schedule
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* The Tabs component contains ALL its related components */}
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <Card>
            <CardHeader className="pb-2">
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="open">Open Dates</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="pt-4">
              {/* The TabsContent components must be children of the Tabs component */}
              <TabsContent value="upcoming" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-pulse">Loading upcoming events...</div>
                  </div>
                ) : upcomingShows.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingShows.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No upcoming events"
                    description="Your venue doesn't have any upcoming events scheduled. Use Artist Discovery to find bands passing near your venue."
                    buttonText="Discover Artists"
                    buttonIcon={<ArrowRight className="mr-2 h-4 w-4" />}
                  />
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-pulse">Loading past events...</div>
                  </div>
                ) : pastShows.length > 0 ? (
                  <div className="space-y-4">
                    {pastShows.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No past events"
                    description="There are no past events in your calendar."
                  />
                )}
              </TabsContent>
              
              <TabsContent value="open" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="animate-pulse">Loading open dates...</div>
                  </div>
                ) : openDates.length > 0 ? (
                  <div className="space-y-4">
                    {openDates.map((date) => (
                      <EventCard key={date.id} event={date} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No open dates"
                    description="You haven't marked any dates as available for booking."
                    buttonText="Add Open Date"
                    buttonIcon={<Plus className="mr-2 h-4 w-4" />}
                  />
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* Debug information (only in development) */}
        <div className="mt-6 border p-4 rounded-md bg-gray-50 text-xs">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <div className="space-y-1">
            <p>Active Venue ID: {venue?.id}</p>
            <p>Query Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Success'}</p>
            <p>Data Received: {upcomingDates ? 'Yes' : 'No'}</p>
            <p>Total Dates: {upcomingDates?.length || 0}</p>
            <p>Upcoming Shows: {upcomingShows.length}</p>
            <p>Past Shows: {pastShows.length}</p>
            <p>Open Dates: {openDates.length}</p>
            {error && <p className="text-red-500">Error: {(error as Error).message}</p>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-0">
            <VenueCalendarSidebar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              venue={venue}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueCalendar;