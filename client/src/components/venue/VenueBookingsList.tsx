import React, { useState, useEffect } from 'react';
import { Tour, TourDate, VenueAvailability, Venue } from '../../types';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Spinner } from '../ui/spinner';

interface VenueBookingsListProps {
  venueId: number;
  onTourClick: (tour: Tour) => void;
}

// Availability data type for calendar
interface AvailabilityData {
  date: Date;
  tourDate?: TourDate; 
  tour?: Tour;
  isAvailable?: boolean;
}

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500 hover:bg-green-600';
    case 'pending':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'open':
      return 'bg-purple-500 hover:bg-purple-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// Individual availability card component
const AvailabilityCard = ({ availability, tour, onClick }: { 
  availability: VenueAvailability | TourDate, 
  tour?: Tour,
  onClick?: () => void 
}) => {
  // Determine if this is a VenueAvailability or TourDate
  const isTourDate = 'tourId' in availability;
  
  // Safely parse the date
  const parseDateSafe = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date(); // Return current date as fallback
      }
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date(); // Return current date as fallback
    }
  };
  
  const date = parseDateSafe(availability.date);
  
  return (
    <Card 
      className={`mb-4 cursor-pointer transform transition-transform hover:scale-105 ${
        isTourDate ? 'border-l-4 border-l-primary' : 'border'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </CardTitle>
          
          {isTourDate && (
            <Badge className={getStatusBadgeStyle((availability as TourDate).status || 'pending')}>
              {(availability as TourDate).status || 'pending'}
            </Badge>
          )}
          
          {!isTourDate && (
            <Badge variant={(availability as VenueAvailability).isAvailable ? "default" : "secondary"}>
              {(availability as VenueAvailability).isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          )}
        </div>
        
        {tour && (
          <CardDescription className="mt-1">
            {tour.name}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {isTourDate && (
          <p className="text-sm">
            {(availability as TourDate).notes || 'No additional notes.'}
          </p>
        )}
        
        {!isTourDate && (
          <div className="flex justify-end">
            <Badge variant="outline">Venue Availability</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VenueBookingsList = ({ venueId, onTourClick }: VenueBookingsListProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [venueAvailability, setVenueAvailability] = useState<VenueAvailability[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [tours, setTours] = useState<{ [id: number]: Tour }>({});
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  
  // Load venue details
  useEffect(() => {
    async function fetchVenue() {
      try {
        const response = await fetch(`/api/venues/${venueId}`);
        if (!response.ok) throw new Error('Failed to fetch venue');
        const data = await response.json();
        setVenue(data);
      } catch (error) {
        console.error('Error fetching venue:', error);
      }
    }
    
    if (venueId) {
      fetchVenue();
    }
  }, [venueId]);
  
  // Load tour dates associated with this venue
  useEffect(() => {
    async function fetchTourDates() {
      try {
        const response = await fetch(`/api/venues/${venueId}/tour-dates`);
        if (!response.ok) throw new Error('Failed to fetch tour dates');
        const data = await response.json();
        setTourDates(data);
        
        // Fetch associated tours
        const tourIds = new Set(data.map((date: TourDate) => date.tourId));
        const tourPromises = Array.from(tourIds).map((id) => 
          fetch(`/api/tours/${id as number}`).then(res => res.json())
        );
        
        const toursData = await Promise.all(tourPromises);
        const toursMap = toursData.reduce((acc: { [id: number]: Tour }, tour: Tour) => {
          acc[tour.id] = tour;
          return acc;
        }, {});
        
        setTours(toursMap);
      } catch (error) {
        console.error('Error fetching tour dates:', error);
      }
    }
    
    if (venueId) {
      fetchTourDates();
    }
  }, [venueId]);
  
  // Load venue availability
  useEffect(() => {
    async function fetchVenueAvailability() {
      try {
        const response = await fetch(`/api/venues/${venueId}/availability`);
        if (!response.ok) throw new Error('Failed to fetch venue availability');
        const data = await response.json();
        setVenueAvailability(data);
      } catch (error) {
        console.error('Error fetching venue availability:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (venueId) {
      fetchVenueAvailability();
    }
  }, [venueId]);
  
  // Combine tour dates and venue availability for the calendar
  useEffect(() => {
    const combinedData: AvailabilityData[] = [];
    
    // Safely parse the date
    const parseDateSafe = (dateString: string | Date) => {
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return new Date(); // Return current date as fallback
        }
        return date;
      } catch (error) {
        console.error('Error parsing date:', error);
        return new Date(); // Return current date as fallback
      }
    };
    
    // Add tour dates
    tourDates.forEach(tourDate => {
      const tour = tours[tourDate.tourId];
      combinedData.push({
        date: parseDateSafe(tourDate.date),
        tourDate,
        tour,
        isAvailable: false
      });
    });
    
    // Add venue availability
    venueAvailability.forEach(avail => {
      const safeDate = parseDateSafe(avail.date);
      
      // Check if there's already a tour date for this date
      const existingIndex = combinedData.findIndex(item => 
        item.date.toDateString() === safeDate.toDateString()
      );
      
      if (existingIndex === -1) {
        // No tour date for this date, add availability
        combinedData.push({
          date: safeDate,
          isAvailable: avail.isAvailable
        });
      } else {
        // Update existing entry with availability
        combinedData[existingIndex].isAvailable = avail.isAvailable;
      }
    });
    
    setAvailabilityData(combinedData);
  }, [tourDates, venueAvailability, tours]);
  
  // Handle clicking on a tour date
  const handleTourDateClick = (tourDate: TourDate) => {
    const tour = tours[tourDate.tourId];
    if (tour) {
      setSelectedTour(tour);
      onTourClick(tour);
    }
  };
  
  // Filter availabilities for the selected date
  const filteredAvailabilities = date
    ? availabilityData.filter(avail => 
        avail.date.toDateString() === date.toDateString()
      )
    : [];
  
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {venue?.name} Bookings
        </h2>
        <p className="text-gray-500">
          View and manage bookings for {venue?.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-6">
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="text-lg font-semibold mb-4">Calendar</h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={{ before: new Date(Date.now() - 86400000) }} // Disable past dates
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {date ? `Events on ${date.toLocaleDateString()}` : 'Select a date'}
          </h3>
          
          {filteredAvailabilities.length > 0 ? (
            <div>
              {filteredAvailabilities.map((avail, index) => (
                <div key={index}>
                  {avail.tourDate ? (
                    <AvailabilityCard 
                      availability={avail.tourDate} 
                      tour={avail.tour}
                      onClick={() => avail.tour && handleTourDateClick(avail.tourDate!)}
                    />
                  ) : (
                    avail.isAvailable !== undefined && (
                      <Card className="mb-4 bg-muted/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Venue Availability</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>
                            {avail.isAvailable 
                              ? 'This date is marked as available for booking.' 
                              : 'This date is marked as unavailable for booking.'}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">
                No events or availability information for this date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueBookingsList;