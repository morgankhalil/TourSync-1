import { Plus, Calendar, MoreVertical, Zap, X, Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import VenueBookingsList from "@/components/venue/VenueBookingsList";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import VenueSelector from "@/components/venue/VenueSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { VenueAvailability } from "@/types";
import { useVenues } from "@/hooks/useVenues"; // Import the useVenues hook
import { Spinner } from "@/components/ui/spinner"; //Import Spinner component


const VenueSidebar = () => {
  const { isOpen, toggle, close, isMobile } = useSidebar();
  const { activeVenue, isLoading: isVenueLoading } = useActiveVenue();
  const { data: venues, isLoading: isVenuesLoading } = useVenues();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (isVenuesLoading) {
    return <div className="p-4"><Spinner /></div>;
  }

  // Fetch venue availability
  const { data: availabilityList, isLoading: isAvailabilityLoading } = useQuery<VenueAvailability[]>({
    queryKey: [`/api/venues/${activeVenue?.id}/availability`],
    enabled: !!activeVenue?.id,
  });

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-[280px] bg-background transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `hidden md:block w-[280px] border-r border-border bg-background`;

  // Next 14 days for availability display
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
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}

      {/* Mobile menu trigger */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="fixed top-4 left-4 z-50 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">TourSync</h2>
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={close}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            <VenueSelector />
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-6">
              {/* Main Actions */}
              <div>
                <Link href="/venue-availability">
                  <Button className="w-full bg-primary text-primary-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    Manage Availability
                  </Button>
                </Link>

                <Link href="/ai-recommendations">
                  <Button variant="outline" className="w-full mt-2">
                    <Zap className="mr-2 h-4 w-4" />
                    AI Recommendations
                  </Button>
                </Link>
              </div>

              {/* Active Venue */}
              {isVenueLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : activeVenue ? (
                <div className="bg-primary/10 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-primary">{activeVenue.name}</h3>
                    <Link href="/edit-venue">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {activeVenue.city}, {activeVenue.state}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {activeVenue.capacity || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No venue selected</p>
              )}

              {/* Availability Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Availability</h3>
                  <Link href="/venue-availability">
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {isAvailabilityLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nextTwoWeeks.map((day, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-md cursor-pointer transition-colors ${
                          day.isAvailable
                            ? "bg-green-100 hover:bg-green-200 border-green-300"
                            : "bg-muted hover:bg-muted/80 border-border"
                        } border ${
                          selectedDate?.toDateString() === day.date.toDateString()
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {format(day.date, "EEE, MMM d")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(day.date, "yyyy")}
                            </p>
                          </div>
                          <Badge variant={day.isAvailable ? "success" : "secondary"}>
                            {day.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Venue Bookings */}
              {activeVenue?.id && (
                <div>
                  <VenueBookingsList
                    venueId={activeVenue.id}
                    onTourClick={() => {}}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default VenueSidebar;