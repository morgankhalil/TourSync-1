import React, { useState } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueCalendarSidebar } from '@/components/venue/VenueCalendarSidebar';
import { TourDate } from '@shared/schema';
import axios from 'axios';
import { formatDate } from '@/lib/utils';
import { CalendarDays, Music, MapPin, ArrowRight } from 'lucide-react';


const VenueCalendar: React.FC = () => {
  const { venueData: venue } = useActiveVenue();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("upcoming");

  const { data: upcomingDates, isLoading } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/dates`],
    queryFn: async () => {
      if (!venue) return [];
      const response = await axios.get(`/api/venues/${venue.id}/dates`);
      return response.data as TourDate[];
    },
    enabled: !!venue,
  });

  const currentDate = new Date();
  const upcomingShows = upcomingDates?.filter(
    date => new Date(date.date) >= currentDate
  ) || [];

  const pastShows = upcomingDates?.filter(
    date => new Date(date.date) < currentDate
  ) || [];

  const openDates = upcomingDates?.filter(
    date => date.isOpenDate
  ) || [];


  if (!venue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Venue Selected</CardTitle>
          <CardDescription>Select a venue to view and manage your calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <p>You need to select or create a venue to use the Calendar feature.</p>
        </CardContent>
      </Card>
    );
  }

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

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="open">Open Dates</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="upcoming">
              {isLoading ? (
                <p>Loading upcoming events...</p>
              ) : upcomingShows.length > 0 ? (
                <div className="space-y-4">
                  {upcomingShows.map((event) => (
                    <Card key={event.id}>
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
                            <h3 className="text-lg font-semibold">{event.title || 'Untitled Event'}</h3>
                            {event.tourId && (
                              <div className="flex items-center mt-1 text-muted-foreground text-sm">
                                <Music className="h-3 w-3 mr-1" />
                                Band: {event.bandId ? `Band ID ${event.bandId}` : 'Unknown band'}
                              </div>
                            )}
                            <div className="flex mt-2 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.city}, {event.state}
                              </div>
                            </div>
                            {event.notes && (
                              <div className="mt-2 text-sm">
                                {event.notes}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-1 flex flex-col justify-center items-end">
                            <div className="inline-flex justify-end space-x-2">
                              <Button variant="outline" size="sm">Details</Button>
                              <Button size="sm">Confirm</Button>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Status: {event.status || 'Pending'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Your venue doesn't have any upcoming events scheduled.
                    Use Artist Discovery to find bands passing near your venue.
                  </p>
                  <Button className="mt-4">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Discover Artists
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {isLoading ? (
                <p>Loading past events...</p>
              ) : pastShows.length > 0 ? (
                <div className="space-y-4">
                  {pastShows.map((event) => (
                    <Card key={event.id}>
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
                              {event.title || 'Untitled Event'}
                            </h3>
                            <div className="flex items-center mt-1 text-muted-foreground text-sm">
                              <Music className="h-3 w-3 mr-1" />
                              Band info not available
                            </div>
                            <div className="flex mt-2 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.city}, {event.state}
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-1 flex flex-col justify-center items-end">
                            <Button variant="outline" size="sm">Details</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No past events</h3>
                  <p className="text-muted-foreground">
                    There are no past events in your calendar.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="open">
              {isLoading ? (
                <p>Loading open dates...</p>
              ) : openDates.length > 0 ? (
                <div className="space-y-4">
                  {openDates.map((date) => (
                    <Card key={date.id}>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1">
                            <div className="bg-muted rounded-md p-4 text-center">
                              <div className="text-xs text-muted-foreground uppercase">
                                {formatDate(date.date, 'EEEE')}
                              </div>
                              <div className="text-3xl font-bold">
                                {formatDate(date.date, 'd')}
                              </div>
                              <div className="text-sm font-medium">
                                {formatDate(date.date, 'MMM yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold">Open Date</h3>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {date.notes || 'No additional information'}
                            </div>
                          </div>
                          <div className="md:col-span-1 flex flex-col justify-center items-end">
                            <Button variant="outline" size="sm">Find Artist</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No open dates</h3>
                  <p className="text-muted-foreground">
                    You haven't marked any dates as available for booking.
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Open Date
                  </Button>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <VenueCalendarSidebar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          venue={venue}
        />
      </div>
    </div>
  );
};

export default VenueCalendar;