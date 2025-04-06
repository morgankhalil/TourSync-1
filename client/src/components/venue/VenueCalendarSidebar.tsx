import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MoreVertical, Plus } from "lucide-react";
import { Venue } from "@shared/schema";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type VenueAvailability = {
  id: number;
  date: string;
  venueId: number;
  isAvailable: boolean | null;
};

interface VenueCalendarSidebarProps {
  venue: Venue | null;
  onDateSelect: (date: Date, isAvailable: boolean) => void;
  selectedDate: Date | null;
  numDaysToShow?: number;
}

export function VenueCalendarSidebar({ 
  venue, 
  onDateSelect, 
  selectedDate,
  numDaysToShow = 10 
}: VenueCalendarSidebarProps) {
  // Fetch venue availability
  const { data: availabilityData, isLoading } = useQuery<VenueAvailability[]>({
    queryKey: ['/api/venues', venue?.id, 'availability'],
    enabled: !!venue,
    queryFn: () => apiRequest(`/api/venues/${venue?.id}/availability`),
  });

  const handleDateClick = (date: string, isAvailable: boolean | null) => {
    onDateSelect(parseISO(date), isAvailable !== false);
  };

  const isDateSelected = (date: string) => {
    if (!selectedDate) return false;
    return isSameDay(parseISO(date), selectedDate);
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <Button variant="default" className="w-full justify-start" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Manage Availability
        </Button>
      </div>
      
      {venue && (
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">{venue.name}</h2>
            <p className="text-sm text-muted-foreground">{venue.city}, {venue.state}</p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Availability</h3>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-auto flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array(numDaysToShow).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {availabilityData?.slice(0, numDaysToShow).map(day => (
              <div 
                key={day.id} 
                className={`p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center ${
                  isDateSelected(day.date) 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleDateClick(day.date, day.isAvailable)}
              >
                <div>
                  <p className="font-medium">{format(parseISO(day.date), "EEE, MMM d")}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(day.date), "yyyy")}</p>
                </div>
                <Badge 
                  variant={day.isAvailable === false ? "secondary" : "outline"}
                  className={day.isAvailable === false ? "" : "border-dashed"}
                >
                  {day.isAvailable === false ? "Unavailable" : "Available"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}