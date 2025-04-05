import { useState } from "react";
import { X, Search, SlidersHorizontal, ArrowDownWideNarrow } from "lucide-react";
import { useVenues } from "@/hooks/useVenues";
import VenueItem from "./VenueItem";
import { Venue } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface VenueDiscoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  fromCity?: string;
  toCity?: string;
  onVenueSelect: (venue: Venue) => void;
}

const VenueDiscoveryPanel = ({
  isOpen,
  onClose,
  date,
  fromCity,
  toCity,
  onVenueSelect
}: VenueDiscoveryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { nearbyVenues, isLoading } = useVenues();

  // Filter venues based on search query
  const filteredVenues = nearbyVenues?.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 bg-white w-80 shadow-lg border-l border-gray-200 overflow-y-auto custom-scrollbar z-10">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-inter font-semibold">Available Venues</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {date && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">For open date</p>
            <p className="font-medium">{format(new Date(date), "MMMM d, yyyy")}</p>
            {fromCity && toCity && (
              <p className="text-sm text-gray-500">Between {fromCity} and {toCity}</p>
            )}
          </div>
        )}
        
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search venues"
              className="w-full py-2 pl-8 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          </div>
        </div>
        
        <div className="mb-4 flex space-x-2">
          <Badge variant="outline" className="px-3 py-1 text-sm flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm flex items-center gap-1">
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Sort
          </Badge>
        </div>
        
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-md p-3 mb-3 shadow-card border border-gray-200">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))
        ) : filteredVenues && filteredVenues.length > 0 ? (
          filteredVenues.map(venue => (
            <VenueItem 
              key={venue.id} 
              venue={venue} 
              onClick={() => onVenueSelect(venue)} 
            />
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No venues found</p>
        )}
      </div>
    </div>
  );
};

export default VenueDiscoveryPanel;
