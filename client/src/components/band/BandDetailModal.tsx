import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { Band, Tour } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Music, Mail, Phone, Globe, Twitter, Instagram, Facebook } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BandDetailModalProps {
  band: Band | null;
  isOpen: boolean;
  onClose: () => void;
}

const BandDetailModal = ({ band, isOpen, onClose }: BandDetailModalProps) => {
  const { activeVenue } = useActiveVenue();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  
  // Reset selected tour when modal is opened with a new band
  useEffect(() => {
    if (isOpen && band) {
      setSelectedTour(null);
    }
  }, [isOpen, band]);
  
  // Fetch band's tours
  const { data: tours, isLoading: isLoadingTours } = useQuery<Tour[]>({
    queryKey: band ? [`/api/tours?bandId=${band.id}`] : [],
    enabled: !!band && isOpen,
  });
  
  // Handle contact band
  const handleContactBand = async () => {
    if (!band || !activeVenue) return;
    
    setIsLoading(true);
    try {
      // This would typically send a message or booking request to the band
      await apiRequest(
        'POST',
        `/api/venues/${activeVenue.id}/contact-band/${band.id}`, 
        {
          message: `${activeVenue.name} is interested in booking your band.`,
          venueId: activeVenue.id,
          bandId: band.id
        }
      );
      
      toast({
        title: "Contact request sent",
        description: `Your booking interest has been sent to ${band.name}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error contacting band:", error);
      toast({
        title: "Contact failed",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle booking request
  const handleBookingRequest = async () => {
    if (!band || !activeVenue || !selectedTour) return;
    
    setIsLoading(true);
    try {
      // This would typically send a booking request for a specific tour
      await apiRequest(
        'POST',
        `/api/venues/${activeVenue.id}/book-tour/${selectedTour.id}`,
        {
          message: `${activeVenue.name} would like to book ${band.name} for the ${selectedTour.name} tour.`,
          venueId: activeVenue.id,
          tourId: selectedTour.id
        }
      );
      
      toast({
        title: "Booking request sent",
        description: `Your booking request for ${selectedTour.name} has been sent to ${band.name}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error sending booking request:", error);
      toast({
        title: "Booking request failed",
        description: "There was a problem sending your booking request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!band) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{band.name}</DialogTitle>
          <DialogDescription>
            {band.genre && (
              <Badge variant="outline" className="mt-1 bg-primary/10">
                <Music className="mr-1 h-3 w-3" /> {band.genre}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Band Info</TabsTrigger>
            <TabsTrigger value="tours">Tours</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="py-4">
            {band.description ? (
              <p className="text-sm text-gray-700 mb-4">{band.description}</p>
            ) : (
              <p className="text-sm text-gray-500 mb-4 italic">No band description available</p>
            )}
            
            {band.social && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Social Media</h4>
                <div className="flex space-x-3">
                  {band.social.website && (
                    <a 
                      href={band.social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary"
                    >
                      <Globe size={18} />
                    </a>
                  )}
                  {band.social.twitter && (
                    <a 
                      href={`https://twitter.com/${band.social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary"
                    >
                      <Twitter size={18} />
                    </a>
                  )}
                  {band.social.instagram && (
                    <a 
                      href={`https://instagram.com/${band.social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary"
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {band.social.facebook && (
                    <a 
                      href={band.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tours" className="py-4">
            {isLoadingTours ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : !tours || tours.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8">
                No active tours found for this band
              </p>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium">Active Tours</h4>
                {tours.map(tour => (
                  <div 
                    key={tour.id}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      selectedTour?.id === tour.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTour(tour)}
                  >
                    <h5 className="font-medium">{tour.name}</h5>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar size={14} className="mr-1" />
                      <span>
                        {format(new Date(tour.startDate), "MMM d, yyyy")} - {format(new Date(tour.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {tour.notes && (
                      <p className="text-sm mt-2">{tour.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="contact" className="py-4">
            <div className="space-y-3">
              {band.contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  <a href={`mailto:${band.contactEmail}`} className="text-sm hover:underline">
                    {band.contactEmail}
                  </a>
                </div>
              )}
              
              {band.contactPhone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  <a href={`tel:${band.contactPhone}`} className="text-sm hover:underline">
                    {band.contactPhone}
                  </a>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Interested in booking this band at your venue?
              </p>
              <Button
                className="w-full"
                onClick={handleContactBand}
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                Contact Band
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {selectedTour && (
          <div className="mt-4 pt-4 border-t">
            <Button
              className="w-full"
              onClick={handleBookingRequest}
              disabled={isLoading}
            >
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
              Request Booking for {selectedTour.name}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BandDetailModal;