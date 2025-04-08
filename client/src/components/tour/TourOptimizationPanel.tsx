import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Venue, TourDate, Tour } from "../../types";
import { useTours } from "../../hooks/useTours";
import { useVenues } from "../../hooks/useVenues";
import { apiRequest } from "../../lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { InteractiveMapView } from "../maps/InteractiveMapView";
import { CalendarIcon, Map, Calendar as CalendarIcon2, Clock } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VenueItem from "../venue/VenueItem";

interface TourOptimizationPanelProps {
  tour: Tour | null;
  tourDates: TourDate[];
  onSelectVenue?: (venue: Venue) => void;
}

type TourGap = {
  startDate: Date;
  endDate: Date;
  durationDays: number;
};

const TourOptimizationPanel = ({ tour, tourDates, onSelectVenue }: TourOptimizationPanelProps) => {
  const [activeTab, setActiveTab] = useState("gaps");
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDate | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [tourGaps, setTourGaps] = useState<TourGap[]>([]);
  const [selectedGap, setSelectedGap] = useState<TourGap | null>(null);
  const [gapVenues, setGapVenues] = useState<Venue[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    if (tour?.id) {
      fetchTourGaps();
    }
  }, [tour]);

  const fetchTourGaps = async () => {
    if (!tour) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest(`/api/tours/${tour.id}/gaps`);
      
      if (Array.isArray(response)) {
        const gaps = response as TourGap[];
        setTourGaps(gaps.map(gap => ({
          ...gap,
          startDate: new Date(gap.startDate),
          endDate: new Date(gap.endDate)
        })));
      } else {
        console.error("Unexpected response format for tour gaps:", response);
        setTourGaps([]);
      }
    } catch (error) {
      console.error("Error fetching tour gaps:", error);
      setTourGaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGap = async (gap: TourGap) => {
    if (!tour) return;
    
    setSelectedGap(gap);
    
    try {
      setIsLoading(true);
      
      const response = await apiRequest(`/api/tours/${tour.id}/fill-gap`, {
        method: 'POST',
        data: {
          gapStartDate: gap.startDate.toISOString(),
          gapEndDate: gap.endDate.toISOString(),
          radius: searchRadius
        }
      });
      
      const venues = Array.isArray(response) ? response as Venue[] : [];
      setGapVenues(venues);
      
      if (venues.length === 0) {
        toast({
          title: "No venues found",
          description: "No venues found for this gap. Try increasing the search radius.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fetching venues for gap:", error);
      setGapVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTourDate = async (date: TourDate) => {
    if (!date.venueId) {
      toast({
        title: "No venue selected",
        description: "This tour date doesn't have a venue assigned",
        variant: "default"
      });
      return;
    }
    
    setSelectedTourDate(date);
    
    try {
      setIsLoading(true);
      
      const excludeIds = tourDates
        .filter(td => td.venueId)
        .map(td => td.venueId as number)
        .join(',');
      
      const response = await apiRequest(
        `/api/venues/${date.venueId}/nearby?radius=${searchRadius}&excludeIds=${excludeIds}`
      );
      
      const venues = Array.isArray(response) ? response as Venue[] : [];
      setNearbyVenues(venues);
      
      if (venues.length === 0) {
        toast({
          title: "No venues found",
          description: "No venues found near this location. Try increasing the search radius.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fetching nearby venues:", error);
      setNearbyVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    if (onSelectVenue) {
      onSelectVenue(venue);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tour Optimization</CardTitle>
        <CardDescription>Find venues to optimize your tour routing and fill open dates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 h-[300px] rounded-lg overflow-hidden border">
          <InteractiveMapView
            locations={tourDates.map(date => ({
              lat: Number(date.latitude) || 0,
              lng: Number(date.longitude) || 0,
              name: date.venueName || 'Open Date',
              tourId: tour?.id,
              date: date.date,
              isVenue: !!date.venueId,
            }))}
            showPaths={true}
          />
        </div>
        
        <Tabs defaultValue="gaps" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gaps">Fill Tour Gaps</TabsTrigger>
            <TabsTrigger value="nearby">Find Nearby Venues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gaps">
            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="searchRadius">Search Radius (miles):</Label>
                <Input
                  id="searchRadius"
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              
              {tourGaps.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Available Gaps</h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      {tourGaps.map((gap, index) => (
                        <Card key={index} className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          selectedGap === gap && "border-primary"
                        )}
                        onClick={() => handleSelectGap(gap)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span>
                                  {format(gap.startDate, 'MMM d')} - {format(gap.endDate, 'MMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <span>{gap.durationDays} days</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {isLoading ? "Loading tour gaps..." : "No gaps found in the tour schedule."}
                  </p>
                </div>
              )}
              
              {selectedGap && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium">Venues Available for Gap</h3>
                  {isLoading ? (
                    <p className="py-4 text-center text-muted-foreground">Loading venues...</p>
                  ) : (
                    <div className="mt-4 max-h-[400px] overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 gap-4">
                        {gapVenues.map((venue) => (
                          <VenueItem
                            key={venue.id}
                            venue={venue}
                            onClick={() => handleSelectVenue(venue)}
                            isSelected={selectedVenue?.id === venue.id}
                          />
                        ))}
                        
                        {gapVenues.length === 0 && !isLoading && (
                          <p className="py-4 text-center text-muted-foreground">
                            No venues found for this gap. Try increasing the search radius.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="nearby">
            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="nearbySearchRadius">Search Radius (miles):</Label>
                <Input
                  id="nearbySearchRadius"
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              
              <h3 className="text-lg font-medium">Select a confirmed venue</h3>
              <div className="mt-2 max-h-[300px] overflow-y-auto pr-2">
                <div className="space-y-2">
                  {tourDates
                    .filter(date => date.venueId && (date.status === 'confirmed' || date.status === 'pending'))
                    .map((date) => (
                      <Card 
                        key={date.id} 
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          selectedTourDate?.id === date.id && "border-primary"
                        )}
                        onClick={() => handleSelectTourDate(date)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-medium">{date.venueName || 'Unknown Venue'}</span>
                              <span className="text-sm text-muted-foreground">
                                {date.city}, {date.state}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon2 className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span>{format(new Date(date.date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                  {tourDates.filter(date => date.venueId && (date.status === 'confirmed' || date.status === 'pending')).length === 0 && (
                    <p className="py-4 text-center text-muted-foreground">
                      No confirmed venues in this tour yet.
                    </p>
                  )}
                </div>
              </div>
              
              {selectedTourDate && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium">Venues Nearby {selectedTourDate.venueName}</h3>
                  {isLoading ? (
                    <p className="py-4 text-center text-muted-foreground">Loading venues...</p>
                  ) : (
                    <div className="mt-4 max-h-[400px] overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 gap-4">
                        {nearbyVenues.map((venue) => (
                          <VenueItem
                            key={venue.id}
                            venue={venue}
                            onClick={() => handleSelectVenue(venue)}
                            isSelected={selectedVenue?.id === venue.id}
                          />
                        ))}
                        
                        {nearbyVenues.length === 0 && !isLoading && (
                          <p className="py-4 text-center text-muted-foreground">
                            No venues found near this location. Try increasing the search radius.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TourOptimizationPanel;