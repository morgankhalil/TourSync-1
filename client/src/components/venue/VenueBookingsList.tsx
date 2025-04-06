import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  CalendarDays, 
  ChevronDown, 
  Loader2,
  ArrowRight
} from "lucide-react";
import { Tour, TourDate, VenueAvailability } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VenueBookingsListProps {
  venueId: number;
  onTourClick: (tour: Tour) => void;
}

// Type for grouped availability dates
interface AvailabilityData {
  date: Date;
  tourDate: TourDate; 
  tour?: Tour;
}

// Availability Card component
const AvailabilityCard = ({ availability }: { availability: VenueAvailability }) => {
  const date = new Date(availability.date);
  
  return (
    <div className="border rounded-md p-3 mb-2 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <CalendarDays size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{format(date, "MMM d, yyyy")}</p>
            <p className="text-sm text-gray-500">Open Date</p>
          </div>
        </div>
        <Badge variant={availability.isAvailable ? "outline" : "destructive"}>
          {availability.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </div>
    </div>
  );
};

const VenueBookingsList = ({ venueId, onTourClick }: VenueBookingsListProps) => {
  // Get venue availability
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<VenueAvailability[]>({
    queryKey: ['/api/venues', venueId, 'availability'],
    enabled: !!venueId,
  });
  
  // Get all tours with dates near this venue
  const { data: nearbyTours, isLoading: toursLoading } = useQuery<Tour[]>({
    queryKey: ['/api/venues', venueId, 'nearby-tours'],
    enabled: !!venueId,
  });
  
  // Get tour dates for all nearby tours
  const { data: allTourDates, isLoading: datesLoading } = useQuery<TourDate[]>({
    queryKey: ['/api/tours/all-dates'],
    enabled: !!nearbyTours && nearbyTours.length > 0,
  });
  
  // Handle clicking on a tour date to show tour details
  const handleTourDateClick = (tourDate: TourDate) => {
    // Find the associated tour
    if (nearbyTours) {
      const tour = nearbyTours.find(t => t.id === tourDate.tourId);
      if (tour) {
        onTourClick(tour);
      }
    }
  };
  
  // Group tour dates by month
  const groupedBookings: Record<string, AvailabilityData[]> = {};
  
  if (allTourDates && nearbyTours) {
    allTourDates.forEach(date => {
      // Only include dates associated with this venue
      if (date.venueId === venueId) {
        const dateObj = new Date(date.date);
        const monthYear = format(dateObj, "MMMM yyyy");
        
        if (!groupedBookings[monthYear]) {
          groupedBookings[monthYear] = [];
        }
        
        const tour = nearbyTours.find(t => t.id === date.tourId);
        
        groupedBookings[monthYear].push({
          date: dateObj,
          tourDate: date,
          tour
        });
      }
    });
  }
  
  // Sort months
  const sortedMonths = Object.keys(groupedBookings).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Loading state
  if (availabilityLoading || toursLoading || datesLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Venue Bookings</h2>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin mr-2" size={20} />
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-2">
      <h2 className="text-xl font-bold mb-4">Venue Bookings</h2>
      
      {/* Current & Upcoming Bookings */}
      {sortedMonths.length > 0 ? (
        <Accordion type="single" collapsible className="mb-6">
          {sortedMonths.map((month) => (
            <AccordionItem value={month} key={month}>
              <AccordionTrigger className="py-2">
                <span className="text-md font-medium">{month}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-2 space-y-2">
                  {groupedBookings[month]
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((item) => (
                      <div 
                        key={`booking-${item.tourDate.id}`}
                        onClick={() => handleTourDateClick(item.tourDate)}
                        className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 flex flex-col items-center justify-center mr-3 border rounded-md">
                              <span className="font-bold text-sm">{format(item.date, "d")}</span>
                              <span className="text-xs text-gray-500">{format(item.date, "EEE")}</span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.tour?.name || "Unknown Tour"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.tourDate.city}, {item.tourDate.state}
                              </p>
                            </div>
                          </div>
                          {item.tourDate.status === "confirmed" ? (
                            <Badge className="bg-green-500">Confirmed</Badge>
                          ) : item.tourDate.status === "pending" ? (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          ) : (
                            <Badge variant="outline">Open</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <button className="text-xs text-primary flex items-center">
                            View details <ArrowRight size={12} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="bg-gray-50 border rounded-md p-4 text-center mb-6">
          <p className="text-gray-500">No current bookings</p>
        </div>
      )}
      
      {/* Venue Availability Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center mb-3">
          <CalendarDays size={18} className="mr-2" /> 
          Venue Availability
        </h3>
        
        {availabilityData && availabilityData.length > 0 ? (
          availabilityData
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => (
              <AvailabilityCard 
                key={`availability-${item.id}`} 
                availability={item} 
              />
            ))
        ) : (
          <div className="bg-gray-50 border rounded-md p-4 text-center">
            <p className="text-gray-500">No availability information</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueBookingsList;