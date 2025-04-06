import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  CalendarDays, 
  User, 
  Music, 
  Mail,
  Phone
} from "lucide-react";
import { Tour, TourDate, Band } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface TourDetailModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
}

const TourDetailModal = ({ tour, isOpen, onClose }: TourDetailModalProps) => {
  // Get the band information
  const { data: band, isLoading: bandLoading } = useQuery<Band>({
    queryKey: tour ? [`/api/bands/${tour.bandId}`] : [],
    enabled: !!tour && isOpen
  });
  
  // Get tour dates 
  const { data: tourDates, isLoading: tourDatesLoading } = useQuery<TourDate[]>({
    queryKey: tour ? [`/api/tours/${tour.id}/dates`] : [],
    enabled: !!tour && isOpen
  });
  
  // Fetch tour stats
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalShows: number;
    confirmed: number;
    pending: number;
    openDates: number;
  }>({
    queryKey: tour ? [`/api/tours/${tour.id}/stats`] : [],
    enabled: !!tour && isOpen
  });
  
  if (!tour) return null;
  
  const formatDateRange = () => {
    const start = new Date(tour.startDate);
    const end = new Date(tour.endDate);
    
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="font-inter font-semibold text-lg">Tour Details</DialogTitle>
          </div>
        </DialogHeader>
        
        <div>
          <div className="mb-4">
            <h3 className="font-inter font-bold text-xl">{tour.name}</h3>
            <div className="flex items-center text-gray-600">
              <CalendarDays size={16} className="mr-1" />
              <span>{formatDateRange()}</span>
            </div>
          </div>
          
          {/* Band Information */}
          <div className="p-4 rounded-md bg-gray-50 mb-4">
            <h4 className="font-medium mb-3">Band Information</h4>
            {bandLoading ? (
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : band ? (
              <div>
                <div className="flex items-center mb-2">
                  <User size={16} className="text-gray-500 mr-2" />
                  <p className="font-medium">{band.name}</p>
                </div>
                {band.genre && (
                  <div className="flex items-center mb-2">
                    <Music size={16} className="text-gray-500 mr-2" />
                    <p>{band.genre}</p>
                  </div>
                )}
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-500 mr-2" />
                  <p>{band.contactEmail}</p>
                </div>
                {band.contactPhone && (
                  <div className="flex items-center mt-2">
                    <Phone size={16} className="text-gray-500 mr-2" />
                    <p>{band.contactPhone}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Band information not available</p>
            )}
          </div>
          
          {/* Tour Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-primary bg-opacity-10 p-3 rounded-md text-center">
                <p className="text-sm text-gray-600">Total Shows</p>
                <p className="font-bold text-lg">{stats.totalShows}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-md text-center">
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="font-bold text-lg text-green-600">{stats.confirmed}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md text-center">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="font-bold text-lg text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-md text-center">
                <p className="text-sm text-gray-600">Open Dates</p>
                <p className="font-bold text-lg text-gray-600">{stats.openDates}</p>
              </div>
            </div>
          )}
          
          {/* Tour Dates */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Tour Schedule</h4>
            
            {tourDatesLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between p-2 border-b border-gray-100">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : tourDates && tourDates.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                {tourDates
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((date, index) => {
                    // Determine if this date is close to your venue
                    const isNearYourVenue = false; // This would be determined by proximity logic
                    
                    return (
                      <div 
                        key={date.id} 
                        className={`flex justify-between items-center p-3 ${
                          index !== tourDates.length - 1 ? 'border-b' : ''
                        } ${isNearYourVenue ? 'bg-yellow-50' : ''}`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 text-center w-10">
                            <p className="font-bold">{format(new Date(date.date), "d")}</p>
                            <p className="text-xs text-gray-500">{format(new Date(date.date), "MMM")}</p>
                          </div>
                          <div>
                            <p className="font-medium">{date.city}, {date.state}</p>
                            <p className="text-sm text-gray-500">{date.venueName || "No venue set"}</p>
                          </div>
                        </div>
                        <div>
                          {date.status === "confirmed" ? (
                            <Badge className="bg-green-500">Confirmed</Badge>
                          ) : date.status === "pending" ? (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300 text-gray-500">Open</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tour dates available</p>
            )}
          </div>
          
          {/* Tour Notes */}
          {tour.notes && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Notes</h4>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {tour.notes}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <Button className="flex-1 bg-primary text-white">
              Submit Booking Offer
            </Button>
            <Button variant="outline" className="flex-1 border border-primary text-primary">
              Contact Band
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourDetailModal;