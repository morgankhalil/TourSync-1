import { Plus, Calendar, MoreVertical } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Link } from "wouter";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Venue, VenueAvailability } from "@/types";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const VenueSidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue, isLoading: isVenueLoading } = useActiveVenue();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch venue availability
  const { data: availabilityList, isLoading: isAvailabilityLoading } = useQuery<VenueAvailability[]>({
    queryKey: [`/api/venues/${activeVenue?.id || 38}/availability`], // Bug Jar's ID is 38
    enabled: true,
  });

  // Determine the sidebar classes based on mobile and open state
  const sidebarClasses = isMobile
    ? `${isSidebarOpen ? "fixed inset-0 z-50" : "hidden"} bg-sidebar-bg w-full overflow-y-auto custom-scrollbar`
    : "hidden md:block bg-sidebar-bg w-80 border-r border-gray-200 flex-shrink-0 overflow-y-auto custom-scrollbar";

  // Generate next 14 days for venue availability
  const nextTwoWeeks = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      isAvailable: availabilityList?.some(
        a => new Date(a.date).toDateString() === date.toDateString() && a.isAvailable
      ) ?? false
    };
  });

  return (
    <aside className={sidebarClasses}>
      {isMobile && isSidebarOpen && (
        <button 
          onClick={closeSidebar} 
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      )}

      <div className="p-4">
        <div className="mb-6">
          <h2 className="font-inter font-semibold text-lg mb-4">Venue Dashboard</h2>
          <Link href="/venue-availability">
            <Button className="w-full bg-primary text-white py-2 px-4 rounded-md font-inter font-medium flex items-center justify-center">
              <Calendar size={16} className="mr-2" />
              Manage Availability
            </Button>
          </Link>
          
          {/* Current Venue */}
          {isVenueLoading ? (
            <div className="mt-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : activeVenue ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-inter font-medium">{activeVenue.name}</h3>
                <div className="flex">
                  <Link href="/edit-venue">
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <MoreVertical size={16} />
                    </button>
                  </Link>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {activeVenue.city}, {activeVenue.state}
              </p>
            </div>
          ) : (
            <div className="mt-4 text-gray-500">No active venue selected</div>
          )}
        </div>

        {/* Venue Availability */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-inter font-medium">Availability</h3>
            <Link href="/venue-availability">
              <button className="p-1 text-primary hover:text-primary/80">
                <Plus size={16} />
              </button>
            </Link>
          </div>
          
          {isAvailabilityLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {nextTwoWeeks.map((day, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    day.isAvailable 
                      ? 'bg-green-100 hover:bg-green-200 border border-green-300' 
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                  } ${selectedDate && selectedDate.toDateString() === day.date.toDateString() ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{format(day.date, "EEE, MMM d")}</p>
                      <p className="text-xs text-gray-500">{format(day.date, "yyyy")}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      day.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {day.isAvailable ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div>
          <h3 className="font-inter font-medium mb-4">Upcoming Bookings</h3>
          <div className="text-sm text-gray-500 italic">
            No confirmed bookings yet
          </div>
        </div>
      </div>
    </aside>
  );
};

export default VenueSidebar;