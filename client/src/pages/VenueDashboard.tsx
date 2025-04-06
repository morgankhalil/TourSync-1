import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import Sidebar from "@/components/layout/VenueSidebar";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar as CalendarIcon, MapPin, Users, Music, PieChart, Clock, Ticket } from "lucide-react";
import { Link } from "wouter";
import { format, addDays, isToday, parseISO, isSameDay } from "date-fns";
import { PastPerformance } from "@/types/pastPerformance";
import SimpleVenueMap from "@/components/maps/SimpleVenueMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import BandMapView from "@/components/maps/BandMapView";

const VenueDashboard = () => {
  const { openSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue, isLoading: isVenueLoading } = useActiveVenue();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Example scheduled dates - in production these would come from your API
  const scheduledDates = [new Date(), addDays(new Date(), 5), addDays(new Date(), 12)];

  // Fetch past performances for this venue
  const { data: pastPerformances = [], isLoading: isPerformancesLoading } = useQuery<PastPerformance[]>({
    queryKey: ["/api/venues", activeVenue?.id, "performances"],
    enabled: !!activeVenue?.id,
  });

  // Fetch venue availability
  const { data: availabilityList = [], isLoading: isAvailabilityLoading } = useQuery<any[]>({
    queryKey: activeVenue ? [`/api/venues/${activeVenue.id}/availability`] : [],
    enabled: !!activeVenue,
  });

  // Automatically open sidebar on desktop
  useEffect(() => {
    if (!isMobile) {
      openSidebar();
    }
  }, [isMobile, openSidebar]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Process performances in a single pass
  const { upcoming, recent } = pastPerformances.reduce((acc, perf) => {
    const perfDate = new Date(perf.date);
    if (perfDate >= now) {
      acc.upcoming.push(perf);
    } else if (perfDate >= thirtyDaysAgo && perfDate <= now) {
      acc.recent.push(perf);
    }
    return acc;
  }, { upcoming: [], recent: [] });

  // Sort only the arrays we need
  const upcomingPerformances = upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recentPerformances = recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Venue Dashboard</h1>
              <p className="text-muted-foreground">
                {isVenueLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : activeVenue ? (
                  `Manage your venue: ${activeVenue.name}`
                ) : (
                  "No active venue selected"
                )}
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex gap-2">
              <Link href="/venues">
                <Button variant="outline">All Venues</Button>
              </Link>
              {activeVenue && (
                <Link href={`/venues/${activeVenue.id}`}>
                  <Button variant="outline">Venue Profile</Button>
                </Link>
              )}
              <Link href="/opportunities">
                <Button>Find Bands</Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="performances">Performances</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <CalendarIcon className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">Upcoming Shows</p>
                        <p className="text-2xl font-bold">{upcomingPerformances.length}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <Music className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">Recent Shows</p>
                        <p className="text-2xl font-bold">{recentPerformances.length}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <Users className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">Capacity</p>
                        <p className="text-2xl font-bold">{activeVenue?.capacity || "--"}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <Ticket className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">Avg Ticket</p>
                        <p className="text-2xl font-bold">
                          {pastPerformances.length > 0 ? 
                            "$" + (pastPerformances.reduce((sum, perf) => sum + (perf.ticketPrice || 0), 0) / 
                            pastPerformances.filter(p => p.ticketPrice).length / 100).toFixed(2) : 
                            "--"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Next 7 Days Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        Next 7 Days
                      </CardTitle>
                      <CardDescription>Upcoming shows and availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = addDays(new Date(), i);
                          const dateStr = format(date, "yyyy-MM-dd");

                          // Find if there's a performance on this day
                          const performance = pastPerformances.find(p => {
                            const perfDate = new Date(p.date);
                            return perfDate.toDateString() === date.toDateString();
                          });

                          // Check if date is available (based on availability list)
                          const isAvailable = availabilityList?.some(
                            a => isSameDay(new Date(a.date), date) && a.isAvailable
                          );

                          return (
                            <div 
                              key={dateStr}
                              className={`p-3 rounded-md border ${
                                performance ? 'bg-blue-50 border-blue-200' : 
                                isAvailable ? 'bg-green-50 border-green-200' : 
                                'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{format(date, "EEE, MMM d")}</p>
                                  <p className="text-xs text-gray-500">
                                    {isToday(date) ? 'Today' : format(date, "yyyy")}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  {performance ? (
                                    <Badge variant="default" className="bg-blue-500">
                                      Booked: {performance.artistName}
                                    </Badge>
                                  ) : isAvailable ? (
                                    <Badge variant="outline" className="bg-green-500 text-white">
                                      Available
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-300">
                                      Unavailable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Performances */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle>Recent Performances</CardTitle>
                        <CardDescription>Shows from the past 30 days</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("performances")}>
                        <span className="sr-only">See all performances</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isPerformancesLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : recentPerformances.length > 0 ? (
                        <div className="space-y-2">
                          {recentPerformances.slice(0, 3).map((performance) => (
                            <div 
                              key={performance.id}
                              className="p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{performance.artistName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {performance.date ? format(new Date(performance.date), "MMMM d, yyyy") : 'Date not available'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {performance.drawSize && (
                                    <Badge variant="outline" className="gap-1 items-center">
                                      <Users className="h-3 w-3" />
                                      {performance.drawSize}
                                    </Badge>
                                  )}
                                  {performance.ticketPrice && (
                                    <Badge variant="outline" className="gap-1 items-center">
                                      <Ticket className="h-3 w-3" />
                                      ${(performance.ticketPrice / 100).toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-6">No recent performances</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                  {/* Venue Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Venue Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isVenueLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-32 w-full mt-2" />
                        </div>
                      ) : activeVenue ? (
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Address</h3>
                            <p className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {activeVenue.address ? activeVenue.address + ', ' : ''}
                              {activeVenue.city ? activeVenue.city + ', ' : ''}
                              {activeVenue.state || ''} 
                              {activeVenue.zipCode || ''}
                            </p>
                          </div>

                          <div className="h-32">
                            <SimpleVenueMap venue={activeVenue} />
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Venue Type</h3>
                            <p>{activeVenue.venueType || "Not specified"}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Preferred Genres</h3>
                            <p>{activeVenue.genre || "All genres"}</p>
                          </div>

                          <div className="pt-2">
                            <Link href={`/venues/${activeVenue.id}`}>
                              <Button variant="outline" className="w-full">
                                Venue Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-6">No venue selected</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Find Opportunities Card */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle>Find Opportunities</CardTitle>
                      <CardDescription>
                        Discover bands to book
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm">
                          Find bands that match your venue's style and schedule. Get personalized recommendations based on your past performances.
                        </p>
                        <Link href="/opportunities">
                          <Button className="w-full">
                            <Music className="mr-2 h-4 w-4" />
                            Discover Touring Bands
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Venue Calendar</CardTitle>
                      <CardDescription>
                        View and manage your venue's availability and scheduled performances
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Calendar component - wrapped in a div to prevent button nesting issues */}
                      <div className="calendar-wrapper border rounded-lg p-4">
                        <div>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="mx-auto"
                            disabled={{ before: new Date() }}
                            modifiers={{
                              booked: scheduledDates.map(date => new Date(date)),
                              available: availabilityList
                                ?.filter(a => a.isAvailable)
                                ?.map(a => new Date(a.date)) || []
                            }}
                            modifiersClassNames={{
                              booked: "bg-blue-100 text-blue-800 font-bold",
                              available: "bg-green-100 text-green-800 border-green-400 border"
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-4 mt-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Booked</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="text-sm">Available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                          <span className="text-sm">Unavailable</span>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-between">
                        <Link href="/venue-availability">
                          <Button variant="outline">
                            Manage Availability
                          </Button>
                        </Link>
                        <Link href="/opportunities">
                          <Button>
                            Find Bands for Selected Date
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Date</CardTitle>
                      <CardDescription>
                        {selectedDate && format(selectedDate, "MMMM d, yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedDate && (
                        <div className="space-y-4">
                          {/* Find if there's a performance on this date */}
                          {pastPerformances.find(p => 
                            isSameDay(new Date(p.date), selectedDate)
                          ) ? (
                            <div>
                              <h3 className="font-medium mb-2">Booked Performance</h3>
                              {pastPerformances
                                .filter(p => isSameDay(new Date(p.date), selectedDate))
                                .map(performance => (
                                  <div 
                                    key={performance.id}
                                    className="p-3 rounded-md border bg-blue-50 border-blue-200"
                                  >
                                    <p className="font-medium">{performance.artistName}</p>
                                    {performance.genre && (
                                      <Badge variant="outline" className="mt-1">
                                        {performance.genre}
                                      </Badge>
                                    )}
                                    <div className="mt-2 flex gap-3 text-sm">
                                      {performance.drawSize && (
                                        <div className="flex items-center">
                                          <Users className="h-3 w-3 mr-1" />
                                          {performance.drawSize}
                                        </div>
                                      )}
                                      {performance.ticketPrice && (
                                        <div className="flex items-center">
                                          <Ticket className="h-3 w-3 mr-1" />
                                          ${(performance.ticketPrice / 100).toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                    {performance.notes && (
                                      <p className="mt-2 text-sm text-muted-foreground">
                                        {performance.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-medium mb-2">
                                {availabilityList?.some(a => 
                                  isSameDay(new Date(a.date), selectedDate) && a.isAvailable
                                ) ? (
                                  <span className="text-green-600">Available for Booking</span>
                                ) : (
                                  <span className="text-gray-600">Not Available</span>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {availabilityList?.some(a => 
                                  isSameDay(new Date(a.date), selectedDate) && a.isAvailable
                                ) ? (
                                  "This date is marked as available for booking. You can search for bands to book on this date."
                                ) : (
                                  "This date is not currently marked as available for booking."
                                )}
                              </p>
                              {availabilityList?.some(a => 
                                isSameDay(new Date(a.date), selectedDate) && a.isAvailable
                              ) && (
                                <Link href="/opportunities">
                                  <Button className="w-full">
                                    Find Bands for This Date
                                  </Button>
                                </Link>
                              )}
                            </div>
                          )}

                          <div className="mt-2">
                            <Link href="/venue-availability">
                              <Button variant="outline" size="sm" className="w-full">
                                Update Availability
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performances">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance History</CardTitle>
                      <CardDescription>
                        Browse all performances at your venue
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isPerformancesLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : pastPerformances.length === 0 ? (
                        <div className="text-center py-12">
                          <Music className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                          <h3 className="font-medium text-lg mb-1">No Performances Yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Start adding your venue's past performances to get insights and recommendations.
                          </p>
                          <Link href={`/venues/${activeVenue?.id}`}>
                            <Button>
                              Add Past Performances
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-4">
                            {pastPerformances.map((performance) => (
                              <div 
                                key={performance.id}
                                className="p-4 rounded-md border hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-semibold text-lg">{performance.artistName}</h3>
                                    <p className="text-muted-foreground">
                                      {performance.date ? format(new Date(performance.date), "MMMM d, yyyy") : 'Date not available'}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    {performance.isSoldOut && (
                                      <Badge className="mb-1">Sold Out</Badge>
                                    )}
                                    <div className="flex gap-2">
                                      {performance.drawSize && (
                                        <Badge variant="outline" className="gap-1 items-center">
                                          <Users className="h-3 w-3" />
                                          {performance.drawSize}
                                        </Badge>
                                      )}
                                      {performance.ticketPrice && (
                                        <Badge variant="outline" className="gap-1 items-center">
                                          <Ticket className="h-3 w-3" />
                                          ${(performance.ticketPrice / 100).toFixed(2)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {performance.genre && (
                                    <Badge variant="secondary">
                                      {performance.genre}
                                    </Badge>
                                  )}
                                  {performance.isHeadliner && (
                                    <Badge variant="secondary">
                                      Headliner
                                    </Badge>
                                  )}
                                </div>

                                {performance.notes && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {performance.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Performance Stats</CardTitle>
                      <CardDescription>
                        Insights from your venue's history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pastPerformances.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">
                          Add performances to see statistics
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 rounded-md bg-accent/50">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Average Attendance</h3>
                            <p className="text-2xl font-bold">
                              {Math.round(pastPerformances.reduce((sum, perf) => sum + (perf.drawSize || 0), 0) / 
                              pastPerformances.filter(p => p.drawSize).length)}
                            </p>
                          </div>

                          <div className="p-3 rounded-md bg-accent/50">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Average Ticket Price</h3>
                            <p className="text-2xl font-bold">
                              ${(pastPerformances.reduce((sum, perf) => sum + (perf.ticketPrice || 0), 0) / 
                              pastPerformances.filter(p => p.ticketPrice).length / 100).toFixed(2)}
                            </p>
                          </div>

                          <div className="p-3 rounded-md bg-accent/50">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Top Genres</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.from(new Set(pastPerformances.map(p => p.genre).filter(Boolean)))
                                .slice(0, 3)
                                .map(genre => (
                                  <Badge key={genre} variant="outline">{genre}</Badge>
                                ))}
                            </div>
                          </div>

                          <div className="p-3 rounded-md bg-accent/50">
                            <h3 className="font-medium text-sm text-muted-foreground mb-1">Sold Out Shows</h3>
                            <p className="text-2xl font-bold">
                              {pastPerformances.filter(p => p.isSoldOut).length}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Link href={`/venues/${activeVenue?.id}`}>
                    <Button className="w-full">
                      Manage Past Performances
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="opportunities">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Band Opportunities</CardTitle>
                    <CardDescription>
                      Find bands touring near your venue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                      <h3 className="font-medium mb-2">Opportunity Discovery</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Our matching algorithm finds bands that would be perfect for your venue based on genre, audience size, and other factors.
                      </p>
                      <Link href="/opportunities">
                        <Button className="w-full">
                          <Music className="mr-2 h-4 w-4" />
                          Explore Band Opportunities
                        </Button>
                      </Link>
                    </div>

                    <div className="h-[400px]">
                      <BandMapView />
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                      The map shows bands currently touring near your venue location
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard;