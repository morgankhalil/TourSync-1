import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Map, Music } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Band, Tour } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TourDiscoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  venueId?: number;
}

const TourDiscoveryPanel = ({ isOpen, onClose, date, venueId }: TourDiscoveryPanelProps) => {
  const { toast } = useToast();
  const [distance, setDistance] = useState(100); // Distance in miles
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  
  // Fetch nearby tours for the selected date
  const { data: nearbyTours, isLoading } = useQuery<{ tour: Tour, band: Band }[]>({
    queryKey: [`/api/venues/${venueId}/nearby-tours`, date?.toISOString(), distance],
    enabled: !!date && !!venueId && isOpen,
  });
  
  // Fetch all genres
  const { data: genresData } = useQuery<string[]>({
    queryKey: ['/api/bands/genres'],
    enabled: isOpen,
  });
  
  // Update all genres list when data is loaded
  useEffect(() => {
    if (genresData && genresData.length > 0) {
      setAllGenres(genresData);
    }
  }, [genresData]);
  
  // Handle contact request
  const handleContactRequest = async (tourId: number, bandId: number) => {
    if (!venueId) return;
    
    try {
      await apiRequest(
        'POST',
        `/api/venues/${venueId}/contact-tour/${tourId}`,
        {
          date: date?.toISOString(),
          message: `Interested in booking your band for a show on ${date ? format(date, "MMMM d, yyyy") : "the selected date"}.`
        }
      );
      
      toast({
        title: "Contact request sent",
        description: "Your booking request has been sent to the band.",
      });
    } catch (error) {
      console.error("Error sending contact request:", error);
      toast({
        title: "Request failed",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  // Filter tours by selected genres
  const filteredTours = nearbyTours?.filter(({ band }) => 
    selectedGenres.length === 0 || (band.genre && selectedGenres.includes(band.genre))
  );
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Discover Tours</SheetTitle>
          <SheetDescription>
            {date ? (
              <div className="flex items-center mt-1 text-primary">
                <Calendar className="h-4 w-4 mr-1" />
                {format(date, "MMMM d, yyyy")}
              </div>
            ) : (
              "Find tours that could play at your venue"
            )}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="space-y-6">
            {/* Distance filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Search Radius</Label>
                <span className="text-sm font-medium">{distance} miles</span>
              </div>
              <Slider
                value={[distance]}
                min={10}
                max={500}
                step={10}
                onValueChange={(values) => setDistance(values[0])}
              />
            </div>
            
            {/* Genre filters */}
            <div>
              <Label className="font-medium">Genres</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allGenres.map(genre => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`genre-${genre}`} 
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={() => toggleGenre(genre)}
                    />
                    <label
                      htmlFor={`genre-${genre}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Results */}
            <div>
              <h3 className="font-medium mb-3">Available Tours</h3>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : !filteredTours || filteredTours.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No tours found matching your criteria.</p>
                  <p className="text-sm mt-1">Try adjusting your filters or increasing the search radius.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTours.map(({ tour, band }) => (
                    <div key={tour.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{band.name}</h4>
                          <div className="text-sm text-gray-500 mt-1">
                            {tour.name}
                          </div>
                          {band.genre && (
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <Music className="h-3 w-3 mr-1" /> {band.genre}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactRequest(tour.id, band.id)}
                        >
                          Contact
                        </Button>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {format(new Date(tour.startDate), "MMM d")} - {format(new Date(tour.endDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TourDiscoveryPanel;