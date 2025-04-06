import { format } from "date-fns";
import { TourDate } from "@/types";

interface TourDateItemProps {
  tourDate: TourDate;
  isSelected: boolean;
  onClick: () => void;
}

const TourDateItem = ({ tourDate, isSelected, onClick }: TourDateItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          text: "text-secondary",
          color: "#2EB67D"
        };
      case "pending":
        return {
          text: "text-accent",
          color: "#ECB22E"
        };
      default:
        return {
          text: "text-primary",
          color: "#4A154B"
        };
    }
  };

  // Format the date to show just the month and day
  const formattedDate = format(new Date(tourDate.date), "MMM d");
  
  // Get the appropriate status colors
  const statusStyles = tourDate.status ? getStatusColor(tourDate.status) : getStatusColor("default");

  // SVG Marker similar to the one used on the map
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

  if (tourDate.isOpenDate) {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-md p-3 mb-3 shadow-card border border-dashed border-gray-300 cursor-pointer hover:border-primary"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StatusMarker color="#4A154B" isDashed={true} />
            <p className="font-medium font-inter text-gray-500">Open Date</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-500">{formattedDate}</p>
            <p className="text-xs" style={{ color: "#4A154B" }}>Find Venues</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-md p-3 mb-3 shadow-card border border-gray-100 cursor-pointer hover:border-primary relative ${isSelected ? 'border-primary' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <div className="mt-1 flex-shrink-0">
            <StatusMarker color={statusStyles.color} />
          </div>
          <div>
            <p className="font-medium font-inter">{tourDate.city}, {tourDate.state}</p>
            <p className="text-sm text-gray-500">{tourDate.venueName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">{formattedDate}</p>
          <p className="text-sm font-medium" style={{ color: statusStyles.color }}>
            {tourDate.status ? tourDate.status.charAt(0).toUpperCase() + tourDate.status.slice(1) : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourDateItem;