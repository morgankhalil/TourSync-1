import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Venue, VenueAvailability } from '@shared/schema';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

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

  // Fetch venue availability data
  const { data: availabilityData } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/availability`],
    enabled: !!venue?.id,
    retry: false
  });
  
  // Format the availability data for display
  const availableDates = React.useMemo(() => {
    if (!availabilityData) return [];
    
    return (availabilityData as VenueAvailability[]).map(
      availability => new Date(availability.date)
    );
  }, [availabilityData]);
  
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
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">{venue?.name || 'Venue'} Calendar</h2>
      
      <div className="mb-4 flex-shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          onDayMouseEnter={(date) => setFocusedDate(date)}
          className="rounded-md border"
          modifiers={{
            available: availableDates,
          }}
          modifiersStyles={{
            available: {
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: 'bold'
            }
          }}
        />
      </div>
      
      {/* Selected date information */}
      {selectedDate && (
        <div className="mb-4">
          <h3 className="font-semibold flex items-center text-lg">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          <div className="mt-2 text-sm text-muted-foreground">
            {venue && (
              <p>
                {venue.name} - {venue.city}, {venue.state}
              </p>
            )}
          </div>
          
          {/* Availability badge */}
          <div className="mt-2">
            {availableDates.some(date => isSameDay(date, selectedDate)) ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
            ) : (
              <Badge variant="outline">Not Available</Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Date availability details */}
      {focusedDateAvailability && (
        <Card className="mt-2">
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Status: </span>
                <span className="ml-1 font-medium">
                  {focusedDateAvailability.isAvailable ? 'Available all day' : 'Not available'}
                </span>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">
                  This date is {focusedDateAvailability.isAvailable ? 'available' : 'not available'} for booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Legend */}
      <div className="mt-auto pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-green-100 mr-2"></div>
          <span>Available Dates</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full border mr-2"></div>
          <span>Booked or Unavailable</span>
        </div>
      </div>
    </div>
  );
}