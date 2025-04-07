import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardTitle, CardHeader, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Venue, VenueAvailability, TourDate } from '@shared/schema';
import { format, isSameDay, isToday } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to format dates
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

// Extended types for our components
interface ExtendedTourDate extends TourDate {
  title?: string;
  bandId?: number;
}

interface VenueCalendarSidebarProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  venue: Venue | null;
}

export function VenueCalendarSidebar({ 
  selectedDate, 
  onDateChange,
  venue
}: VenueCalendarSidebarProps) {
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const today = new Date();

  // Fetch venue availability data
  const { data: availabilityData } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/availability`],
    enabled: !!venue?.id,
    retry: false
  });
  
  // Fetch venue events data
  const { data: eventsData } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/dates`],
    enabled: !!venue?.id,
    retry: false,
  });
  
  // Format the availability data for display
  const availableDates = React.useMemo(() => {
    if (!availabilityData) return [];
    
    return (availabilityData as VenueAvailability[])
      .filter(a => a.isAvailable)
      .map(availability => new Date(availability.date));
  }, [availabilityData]);
  
  // Extract booked dates
  const bookedDates = React.useMemo(() => {
    if (!eventsData) return [];
    
    return (eventsData as TourDate[])
      .filter(event => !event.isOpenDate && event.status !== 'cancelled')
      .map(event => new Date(event.date));
  }, [eventsData]);
  
  // Get the currently focused date's events
  const focusedDateEvents = React.useMemo(() => {
    if (!focusedDate || !eventsData) return [];
    
    return (eventsData as ExtendedTourDate[]).filter(
      event => isSameDay(new Date(event.date), focusedDate)
    );
  }, [focusedDate, eventsData]);
  
  // Get the currently focused date's availability details
  const focusedDateAvailability = React.useMemo(() => {
    if (!focusedDate || !availabilityData) return null;
    
    return (availabilityData as VenueAvailability[]).find(
      availability => isSameDay(new Date(availability.date), focusedDate)
    );
  }, [focusedDate, availabilityData]);
  
  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date);
    if (date) setFocusedDate(date);
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Calendar View</CardTitle>
        <CardDescription>
          Select a date to see details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 pb-0 flex-grow">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          onDayMouseEnter={(date) => setFocusedDate(date)}
          className="w-full border-none"
          modifiers={{
            booked: bookedDates,
            available: availableDates
          }}
          modifiersStyles={{
            booked: {
              fontWeight: 'bold',
              borderWidth: '2px',
              borderColor: 'var(--primary)'
            },
            available: {
              backgroundColor: 'hsl(var(--success) / 0.1)',
              color: 'hsl(var(--success))'
            }
          }}
        />
      </CardContent>
      
      {/* Selected date information */}
      {selectedDate && (
        <div className="p-4 border-t mt-4">
          <h3 className="font-semibold flex items-center text-base">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {/* Status badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {bookedDates.some(date => isSameDay(date, selectedDate)) && (
              <Badge variant="default">Booked</Badge>
            )}
            {availableDates.some(date => isSameDay(date, selectedDate)) && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                Available
              </Badge>
            )}
            {isToday(selectedDate) && (
              <Badge variant="outline">Today</Badge>
            )}
          </div>
          
          {/* Events for the selected date */}
          {focusedDateEvents.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Events</p>
              
              {focusedDateEvents.map((event, idx) => {
                // Create a display title based on venue name or a default
                const displayTitle = event.venueName || `Event on ${formatDate(event.date)}`;
                
                return (
                  <div key={idx} className="text-sm border rounded-md p-2">
                    <div className="font-medium">{displayTitle}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Music className="h-3 w-3 mr-1" />
                      {event.tourId ? `Tour ID: ${event.tourId}` : 'No tour assigned'}
                    </div>
                    {event.notes && (
                      <div className="text-xs mt-1 text-muted-foreground">
                        {event.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Available date without events */}
          {focusedDateEvents.length === 0 && availableDates.some(date => isSameDay(date, selectedDate)) && (
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground">
                This date is available but no events are scheduled.
              </p>
              <Button size="sm" variant="outline" className="mt-2 w-full">
                <Plus className="h-3 w-3 mr-1" />
                Schedule Event
              </Button>
            </div>
          )}
          
          {/* Not available date */}
          {focusedDateEvents.length === 0 && !availableDates.some(date => isSameDay(date, selectedDate)) && (
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground">
                This date is currently marked as unavailable.
              </p>
              <Button size="sm" variant="outline" className="mt-2 w-full">
                Mark as Available
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <CardFooter className="flex-col items-start gap-2 mt-auto border-t pt-4">
        <p className="text-xs font-medium text-muted-foreground">Calendar Legend</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-primary rounded-full mr-2"></div>
            <span>Booked Dates</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
            <span>Available Dates</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full border mr-2"></div>
            <span>Regular Date</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 font-bold bg-accent/20 rounded-full mr-2 flex items-center justify-center text-[9px]">
              T
            </div>
            <span>Today</span>
          </div>
        </div>
      </CardFooter>
    </div>
  );
}