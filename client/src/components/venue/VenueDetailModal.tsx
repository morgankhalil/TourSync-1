import { VenueAvailability } from "@/types";
import { Venue } from "@shared/schema";
import { Users, DollarSign, MapPin, Music, Link as LinkIcon, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface VenueDetailModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
}

const VenueDetailModal = ({ venue, isOpen, onClose }: VenueDetailModalProps) => {
  const { data: availabilities } = useQuery<VenueAvailability[]>({
    queryKey: venue ? [`/api/venues/${venue.id}/availability`] : [],
    enabled: !!venue && isOpen,
  });

  if (!venue) return null;

  // Get available dates from the venue's availability
  const availableDates = availabilities
    ? availabilities
        .filter((a: VenueAvailability) => a.isAvailable)
        .map((a: VenueAvailability) => new Date(a.date))
        .slice(0, 3) // Just show the first 3 for simplicity
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="font-inter font-semibold text-lg">Venue Details</DialogTitle>
          </div>
        </DialogHeader>
        
        <div>
          <div className="mb-4">
            <h3 className="font-inter font-bold text-xl">{venue.name}</h3>
            <p>{venue.city}, {venue.state}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center">
              <Users className="text-gray-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p>{venue.capacity} people</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="text-gray-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-500">Deal Type</p>
                <p>{venue.dealType || "Negotiable"}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="text-gray-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p>{Math.floor(Math.random() * 100) + 50} miles</p>
              </div>
            </div>
            <div className="flex items-center">
              <Music className="text-gray-500 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-500">Genre Focus</p>
                <p>{venue.genre || "Various"}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-inter font-medium mb-2">About</h4>
            <p className="text-sm">{venue.description || "No description available."}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-inter font-medium mb-2">Available Dates</h4>
            {availableDates && availableDates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableDates.map((date: Date, i: number) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {format(date, "MMMM d, yyyy")}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No available dates to show</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-inter font-medium mb-2">Contact</h4>
            <p className="text-sm mb-1">{venue.contactName || "Booking Manager"}</p>
            
            {venue.contactEmail && (
              <div className="flex items-center text-sm mb-1">
                <Mail className="h-4 w-4 mr-1 text-gray-500" />
                <a href={`mailto:${venue.contactEmail}`} className="text-primary hover:underline">
                  {venue.contactEmail}
                </a>
              </div>
            )}
            
            {venue.contactPhone && (
              <div className="flex items-center text-sm mb-1">
                <Phone className="h-4 w-4 mr-1 text-gray-500" />
                <a href={`tel:${venue.contactPhone}`} className="text-primary hover:underline">
                  {venue.contactPhone}
                </a>
              </div>
            )}
            
            {venue.website && (
              <div className="flex items-center text-sm">
                <LinkIcon className="h-4 w-4 mr-1 text-gray-500" />
                <a 
                  href={venue.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  {venue.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button className="flex-1 bg-primary text-white">
              Request Booking
            </Button>
            <Button variant="outline" className="flex-1 border border-primary text-primary">
              Add to Tour
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VenueDetailModal;
