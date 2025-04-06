import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tour, Venue, VenueAvailability, TourDate } from "@/types";
import VenueMapView from "@/components/maps/VenueMapView";
import VenueBookingsList from "@/components/venue/VenueBookingsList";
import TourDetailModal from "@/components/tour/TourDetailModal";
import { Loader2 } from "lucide-react";

// Represents a page for venue owners to see bookings and nearby tours
const VenueView = () => {
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isTourDetailOpen, setIsTourDetailOpen] = useState(false);
  
  // Fetch venues - would be filtered by the currently authenticated venue owner in a real app
  const { data: venuesList, isLoading: venuesLoading } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });
  
  // Load the first venue if none is selected (temporarily for demo)
  // In a real app, it would use the authenticated venue owner's venue
  if (!activeVenue && venuesList && venuesList.length > 0) {
    setActiveVenue(venuesList[0]);
  }
  
  const handleTourClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsTourDetailOpen(true);
  };
  
  if (venuesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin mr-2" size={24} />
        <p>Loading venue data...</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* Left sidebar with venue bookings list */}
      <div className="w-1/4 min-w-[300px] p-4 border-r border-gray-200 overflow-y-auto bg-gray-50">
        <VenueBookingsList 
          venueId={activeVenue?.id || 0}
          onTourClick={handleTourClick}
        />
      </div>
      
      {/* Map view for showing nearby tours */}
      <div className="flex-1 h-full">
        {activeVenue && (
          <VenueMapView 
            venue={activeVenue}
            onTourClick={handleTourClick}
          />
        )}
      </div>
      
      {/* Tour Detail Modal */}
      <TourDetailModal
        tour={selectedTour}
        isOpen={isTourDetailOpen}
        onClose={() => setIsTourDetailOpen(false)}
      />
    </div>
  );
};

export default VenueView;