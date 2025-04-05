import { Venue } from "@/types";
import { Users } from "lucide-react";

interface VenueItemProps {
  venue: Venue;
  onClick: () => void;
}

const VenueItem = ({ venue, onClick }: VenueItemProps) => {
  // Placeholder for distance calculation, would be calculated based on actual coordinates
  const distance = Math.floor(Math.random() * 100) + 50; // Just for demo

  return (
    <div 
      className="bg-white rounded-md p-3 mb-3 shadow-card border border-gray-200 hover:border-secondary cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium font-inter">{venue.name}</h3>
          <p className="text-sm">{venue.city}, {venue.state}</p>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            {venue.capacity} capacity
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-2 py-0.5 text-xs text-white bg-secondary rounded-full">
            Available
          </span>
          <p className="text-sm mt-1">{distance} miles</p>
        </div>
      </div>
      <div className="mt-2 text-sm">
        <button className="text-primary font-medium">View Details</button>
      </div>
    </div>
  );
};

export default VenueItem;
