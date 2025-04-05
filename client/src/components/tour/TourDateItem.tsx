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
        return "text-secondary";
      case "pending":
        return "text-accent";
      default:
        return "text-gray-500";
    }
  };

  // Format the date to show just the month and day
  const formattedDate = format(new Date(tourDate.date), "MMM d");

  if (tourDate.isOpenDate) {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-md p-3 mb-3 shadow-card border border-dashed border-gray-300 cursor-pointer hover:border-primary"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium font-inter text-gray-500">Open Date</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-500">{formattedDate}</p>
            <p className="text-xs text-primary">Find Venues</p>
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
      {tourDate.status === "pending" && (
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-accent rounded-full"></div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium font-inter">{tourDate.city}, {tourDate.state}</p>
          <p className="text-sm text-gray-500">{tourDate.venueName}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formattedDate}</p>
          <p className={`text-sm ${getStatusColor(tourDate.status)}`}>
            {tourDate.status.charAt(0).toUpperCase() + tourDate.status.slice(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourDateItem;
