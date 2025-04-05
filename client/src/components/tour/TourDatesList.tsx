import { useState } from "react";
import { Plus } from "lucide-react";
import { useTours } from "@/hooks/useTours";
import { useQuery } from "@tanstack/react-query";
import TourDateItem from "./TourDateItem";
import { TourDate } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const TourDatesList = () => {
  const { activeTour } = useTours();
  const [selectedTourDateId, setSelectedTourDateId] = useState<number | null>(null);

  const { data: tourDates, isLoading } = useQuery<TourDate[]>({
    queryKey: activeTour ? [`/api/tours/${activeTour.id}/dates`] : [],
    enabled: !!activeTour,
  });

  const handleTourDateClick = (id: number) => {
    setSelectedTourDateId(id === selectedTourDateId ? null : id);
  };

  if (!activeTour) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-inter font-semibold text-lg">Tour Dates</h2>
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
              onClick={() => handleTourDateClick(tourDate.id)} 
            />
          ))
      ) : (
        <div className="text-gray-500 text-sm">No tour dates found</div>
      )}
    </div>
  );
};

export default TourDatesList;
