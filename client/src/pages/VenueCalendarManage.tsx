import React, { useState } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueCalendarSidebar } from '@/components/venue/VenueCalendarSidebar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, addDays } from 'date-fns';
import { CalendarPlus, CalendarX, Check, Loader2, Plus, RefreshCw } from 'lucide-react';
import { VenueAvailability } from '@/types';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const VenueCalendarManage: React.FC = () => {
  const { activeVenue: venue } = useActiveVenue();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [activeTab, setActiveTab] = useState("availability");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch venue availability data
  const { 
    data: availabilityData, 
    isLoading 
  } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/availability`],
    enabled: !!venue?.id,
  });

  // Mutation for updating availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (dates: {date: string, isAvailable: boolean}[]) => {
      if (!venue) throw new Error('No venue selected');
      const response = await axios.post(`/api/venues/${venue.id}/availability`, { dates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venue?.id}/availability`] });
      toast({
        title: 'Success',
        description: 'Venue availability has been updated',
        variant: 'default',
      });
      setSelectedDates([]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update venue availability',
        variant: 'destructive',
      });
      console.error('Error updating availability:', error);
    }
  });

  // Format the availability data for the calendar
  const availableDates = React.useMemo(() => {
    if (!availabilityData) return [];
    
    return (availabilityData as VenueAvailability[])
      .filter(a => a.isAvailable)
      .map(availability => new Date(availability.date));
  }, [availabilityData]);

  // Handle date selection for marking available/unavailable
  const handleDateSelect = (date: Date) => {
    setSelectedDates(prev => {
      const alreadySelected = prev.some(d => isSameDay(d, date));
      if (alreadySelected) {
        return prev.filter(d => !isSameDay(d, date));
      } else {
        return [...prev, date];
      }
    });
  };

  // Save selected dates as available
  const handleMarkAvailable = () => {
    if (!selectedDates.length) return;
    
    const updates = selectedDates.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      isAvailable: true
    }));
    
    updateAvailabilityMutation.mutate(updates);
  };

  // Save selected dates as unavailable
  const handleMarkUnavailable = () => {
    if (!selectedDates.length) return;
    
    const updates = selectedDates.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      isAvailable: false
    }));
    
    updateAvailabilityMutation.mutate(updates);
  };

  // Clear all selected dates
  const clearSelection = () => {
    setSelectedDates([]);
  };

  // If no venue is selected, show a message
  if (!venue) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Active Venue Selected</CardTitle>
            <CardDescription>Select a venue to manage your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to select or create a venue to use the Calendar Management feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Calendar</h1>
            <p className="text-muted-foreground">
              Set your venue's availability and manage events
            </p>
          </div>
        </div>

        <Tabs defaultValue="availability" value={activeTab} onValueChange={setActiveTab}>
          <Card>
            <CardHeader className="pb-2">
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="availability">Manage Availability</TabsTrigger>
                <TabsTrigger value="events">Scheduled Events</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="pt-4">
              <TabsContent value="availability" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Set Venue Availability</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Mark dates when your venue is available for booking. Selected dates are highlighted with a blue border.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                    <div className="col-span-1 md:col-span-4">
                      <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => dates ? setSelectedDates(dates) : setSelectedDates([])}
                        className="rounded-md border"
                        modifiers={{
                          available: availableDates
                        }}
                        modifiersStyles={{
                          available: {
                            backgroundColor: 'hsl(var(--success) / 0.1)',
                            color: 'hsl(var(--success))'
                          }
                        }}
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Actions</CardTitle>
                          <CardDescription>Update your venue's availability</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Selected dates:</span>
                            <Badge variant="outline">{selectedDates.length}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Button 
                              onClick={handleMarkAvailable}
                              disabled={selectedDates.length === 0 || updateAvailabilityMutation.isPending}
                              className="w-full"
                            >
                              {updateAvailabilityMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                              Mark as Available
                            </Button>
                            
                            <Button 
                              onClick={handleMarkUnavailable}
                              disabled={selectedDates.length === 0 || updateAvailabilityMutation.isPending}
                              variant="outline"
                              className="w-full"
                            >
                              {updateAvailabilityMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarX className="mr-2 h-4 w-4" />}
                              Mark as Unavailable
                            </Button>
                            
                            <Button 
                              onClick={clearSelection}
                              disabled={selectedDates.length === 0}
                              variant="ghost"
                              className="w-full"
                            >
                              Clear Selection
                            </Button>
                          </div>
                          
                          <div className="text-xs text-muted-foreground pt-4 border-t">
                            <p>Tip: Click multiple dates to select them all at once, then apply an action.</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Legend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-success/20 mr-2"></div>
                              <span className="text-sm">Available for booking</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full border-2 border-primary mr-2"></div>
                              <span className="text-sm">Selected for update</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full border mr-2 flex items-center justify-center font-bold text-[10px]">
                                T
                              </div>
                              <span className="text-sm">Today</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events" className="mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Scheduled Events</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    View and edit events scheduled at your venue.
                  </p>
                  
                  <Card className="p-6 text-center">
                    <h4 className="font-medium mb-2">Event Management Coming Soon</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This feature is under development. Check back soon for updates.
                    </p>
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check for Updates
                    </Button>
                  </Card>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
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

export default VenueCalendarManage;