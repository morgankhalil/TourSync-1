import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { useTours } from "@/hooks/useTours";
import { useQuery } from "@tanstack/react-query";
import TourDateItem from "./TourDateItem";
import { TourDate, Venue } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import VenueDetailModal from "../venue/VenueDetailModal";

// SVG Marker component for the legend
const StatusMarker = ({ color, isDashed = false }: { color: string, isDashed?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="inline-block mr-2">
    <circle 
      cx="12" 
      cy="10" 
      r="8" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      strokeDasharray={isDashed ? "4" : "0"}
    />
    <path d="M12 18l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 24l-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Status legend component
const StatusLegend = () => (
  <div className="p-3 bg-white rounded-md shadow-md text-sm">
    <h4 className="font-medium mb-2">Marker Legend</h4>
    <div className="space-y-2">
      <div className="flex items-center">
        <StatusMarker color="#2EB67D" />
        <span>Confirmed</span>
      </div>
      <div className="flex items-center">
        <StatusMarker color="#ECB22E" />
        <span>Pending</span>
      </div>
      <div className="flex items-center">
        <StatusMarker color="#4A154B" isDashed={true} />
        <span>Open Date (No Venue)</span>
      </div>
    </div>
  </div>
);

const TourDatesList = () => {
  const { activeTour } = useTours();
  const [selectedTourDateId, setSelectedTourDateId] = useState<number | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isVenueDetailOpen, setIsVenueDetailOpen] = useState(false);

  const { data: tourDates, isLoading } = useQuery<TourDate[]>({
    queryKey: activeTour ? [`/api/tours/${activeTour.id}/dates`] : [],
    enabled: !!activeTour,
  });

  // Fetch venues
  const { data: venuesList } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  const handleTourDateClick = (tourDate: TourDate) => {
    setSelectedTourDateId(tourDate.id === selectedTourDateId ? null : tourDate.id);
    
    // Only show venue details if the tour date has a venue
    if (tourDate.venueId && venuesList) {
      const venue = venuesList.find(v => v.id === tourDate.venueId);
      if (venue) {
        setSelectedVenue(venue);
        setIsVenueDetailOpen(true);
      }
    }
  };

  if (!activeTour) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="font-inter font-semibold text-lg">Tour Dates</h2>
          <Popover>
            <PopoverTrigger asChild>
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <Info size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="p-0 w-auto">
              <StatusLegend />
            </PopoverContent>
          </Popover>
        </div>
        <button className="text-primary hover:text-opacity-80 text-sm font-medium flex items-center">
          <Plus size={16} className="inline-block mr-1" />
          Add Stop
        </button>
      </div>
      
      {isLoading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-md p-3 mb-3 shadow-card border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))
      ) : tourDates && tourDates.length > 0 ? (
        tourDates
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((tourDate) => (
            <TourDateItem 
              key={tourDate.id} 
              tourDate={tourDate} 
              isSelected={tourDate.id === selectedTourDateId}
              onClick={() => handleTourDateClick(tourDate)} 
            />
          ))
      ) : (
        <div className="text-gray-500 text-sm">No tour dates found</div>
      )}

      {/* Venue Detail Modal */}
      <VenueDetailModal 
        venue={selectedVenue}
        isOpen={isVenueDetailOpen}
        onClose={() => setIsVenueDetailOpen(false)}
      />
    </div>
  );
};

export default TourDatesList;