import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  CalendarDays, 
  Globe, 
  ArrowUpRight, 
  PlusCircle,
  Search,
  Calendar
} from 'lucide-react';
import { useTours } from '@/hooks/useTours';
import { Tour, TourDate, Venue } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import TourOptimizationPanel from '@/components/tour/TourOptimizationPanel';
import MapView from '@/components/maps/MapView';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const TourDashboard = () => {
  const { tours, activeTour, isLoading: isLoadingTours } = useTours();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Initially select the active tour
  useEffect(() => {
    if (!selectedTour && activeTour) {
      setSelectedTour(activeTour);
    }
  }, [activeTour, selectedTour]);

  // Fetch tour dates for the selected tour
  const { data: tourDates = [], isLoading: isLoadingTourDates } = useQuery<TourDate[]>({
    queryKey: ['/api/tours', selectedTour?.id, 'dates'],
    queryFn: async () => {
      if (!selectedTour?.id) return [];
      try {
        const response = await apiRequest(`/api/tours/${selectedTour.id}/dates`);
        return Array.isArray(response) ? response as TourDate[] : [];
      } catch (error) {
        console.error("Error fetching tour dates:", error);
        return [];
      }
    },
    enabled: !!selectedTour?.id,
  });

  // Fetch tour stats
  const { data: tourStats, isLoading: isLoadingStats } = useQuery<{
    totalShows: number;
    confirmed: number;
    pending: number;
    openDates: number;
  }>({
    queryKey: ['/api/tours', selectedTour?.id, 'stats'],
    queryFn: async () => {
      if (!selectedTour?.id) return { totalShows: 0, confirmed: 0, pending: 0, openDates: 0 };
      try {
        const response = await apiRequest(`/api/tours/${selectedTour.id}/stats`);
        return response as { 
          totalShows: number; 
          confirmed: number; 
          pending: number; 
          openDates: number 
        };
      } catch (error) {
        console.error("Error fetching tour stats:", error);
        return { totalShows: 0, confirmed: 0, pending: 0, openDates: 0 };
      }
    },
    enabled: !!selectedTour?.id,
  });

  const handleSelectTour = (tour: Tour) => {
    setSelectedTour(tour);
  };

  const handleOptimizationVenueSelect = (venue: Venue) => {
    // Handle venue selection from optimization panel
    if (!selectedTour || !tourDates.length) return;
    
    toast({
      title: "Venue Selected",
      description: `${venue.name} has been selected. Add it to an available date in your tour.`,
    });
    
    // Could add functionality here to auto-assign to an open date
    // or open a modal to select which date to assign it to
  };

  const isLoading = isLoadingTours || isLoadingTourDates || isLoadingStats;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tour Dashboard</h1>
          <p className="text-muted-foreground">Manage and optimize your tours</p>
        </div>
        <Link href="/create-tour">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Tour
          </Button>
        </Link>
      </div>

      {tours && tours.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Tour List Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Tours</CardTitle>
              <CardDescription>Select a tour to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="space-y-2">
                  {tours.map(tour => (
                    <div
                      key={tour.id}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedTour?.id === tour.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelectTour(tour)}
                    >
                      <div className="font-medium">{tour.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(tour.startDate), 'MMM d')} - {format(new Date(tour.endDate), 'MMM d, yyyy')}
                      </div>
                      {tour.isActive && (
                        <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {selectedTour ? (
              <>
                {/* Tour Header Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedTour.name}</CardTitle>
                    <CardDescription>
                      {format(new Date(selectedTour.startDate), 'MMMM d, yyyy')} - {format(new Date(selectedTour.endDate), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <CalendarDays className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-sm text-muted-foreground">Total Shows</div>
                        <div className="text-2xl font-bold">{tourStats?.totalShows || tourDates.length}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-sm text-muted-foreground">Open Dates</div>
                        <div className="text-2xl font-bold">{tourStats?.openDates || tourDates.filter((d: TourDate) => d.isOpenDate).length}</div>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-sm text-muted-foreground">Cities</div>
                        <div className="text-2xl font-bold">
                          {new Set(tourDates.map(date => date.city)).size}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedTour.isActive ? 'Active Tour' : 'Inactive Tour'}
                    </div>
                    <Link href={`/tour-planning/${selectedTour.id}`}>
                      <Button variant="outline" size="sm">
                        Edit Tour
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                {/* Tour Management Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="optimize">Optimize Tour</TabsTrigger>
                    <TabsTrigger value="map">Map View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tour Schedule</CardTitle>
                        <CardDescription>All dates in your tour</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {tourDates.length > 0 ? (
                            <div className="max-h-[500px] overflow-y-auto pr-2">
                              <div className="space-y-2">
                                {tourDates
                                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                  .map(date => (
                                    <div 
                                      key={date.id} 
                                      className="flex justify-between items-center p-3 border rounded-md"
                                    >
                                      <div>
                                        <div className="flex items-center">
                                          <span className="font-medium">
                                            {format(new Date(date.date), 'EEE, MMM d, yyyy')}
                                          </span>
                                          <Badge 
                                            className={`ml-2 ${
                                              date.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                              date.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-red-100 text-red-800'
                                            }`}
                                          >
                                            {date.status.charAt(0).toUpperCase() + date.status.slice(1)}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {date.venueName ? (
                                            `${date.venueName} • ${date.city}, ${date.state}`
                                          ) : (
                                            <span className="italic">No venue assigned</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {!date.venueId && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setActiveTab('optimize')}
                                        >
                                          Find Venue
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No tour dates found
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="optimize" className="mt-6">
                    <TourOptimizationPanel 
                      tour={selectedTour} 
                      tourDates={tourDates as TourDate[]}
                      onSelectVenue={handleOptimizationVenueSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="map" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tour Map</CardTitle>
                        <CardDescription>Visualize your tour route</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="h-[500px]">
                          <MapView />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium mb-2">No Tour Selected</h3>
                    <p className="text-muted-foreground mb-6">
                      Select a tour from the sidebar or create a new one to get started
                    </p>
                    <Link href="/create-tour">
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Tour
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No Tours Found</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created any tours yet. Get started by creating your first tour.
              </p>
              <Link href="/create-tour">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Tour
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TourDashboard;