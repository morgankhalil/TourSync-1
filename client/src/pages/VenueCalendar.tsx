import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, Music, MapPin, ArrowRight } from 'lucide-react';
import { TourDate } from '@shared/schema';
import { formatDate } from '@/lib/utils';

const VenueCalendar: React.FC = () => {
  const { venue } = useActiveVenue();
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Fetch upcoming shows for venue
  const { data: upcomingDates, isLoading } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/dates`],
    queryFn: async () => {
      if (!venue) return [];
      
      const response = await axios.get(`/api/venues/${venue.id}/dates`);
      return response.data as TourDate[];
    },
    enabled: !!venue,
  });
  
  // Structure date data for calendar display
  const currentDate = new Date();
  const upcomingShows = upcomingDates?.filter(
    date => new Date(date.date) >= currentDate
  ) || [];
  
  const pastShows = upcomingDates?.filter(
    date => new Date(date.date) < currentDate
  ) || [];
  
  // Get days with no shows (open dates)
  const openDates = upcomingDates?.filter(
    date => date.isOpenDate
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your venue's booking schedule
          </p>
        </div>
        
        {venue && (
          <Card className="w-full md:w-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">{venue.name}</div>
              <div className="text-sm text-muted-foreground">
                {venue.city}, {venue.state}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!venue ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Venue Selected</CardTitle>
            <CardDescription>Select a venue to view and manage your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              You need to select or create a venue to use the Calendar feature.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Calendar Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? 'Loading calendar...' : `${upcomingShows.length} upcoming events`}
              </h2>
            </div>
            <div className="space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
              <Button variant="outline">
                Open Dates
              </Button>
            </div>
          </div>
          
          {/* Calendar Tabs */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past Events</TabsTrigger>
                  <TabsTrigger value="open">Open Dates</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="upcoming" className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading events</p>
                    </div>
                  </div>
                ) : upcomingShows.length > 0 ? (
                  upcomingShows.map(event => (
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
                  ))
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
              
              <TabsContent value="past" className="space-y-4">
                {pastShows.length > 0 ? (
                  pastShows.map(event => (
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
                  ))
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
              
              <TabsContent value="open" className="space-y-4">
                {openDates.length > 0 ? (
                  openDates.map(date => (
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
                  ))
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
        </>
      )}
    </div>
  );
};

export default VenueCalendar;