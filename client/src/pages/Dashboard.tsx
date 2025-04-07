import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Link } from 'wouter';
import { 
  Calendar, 
  Music, 
  BarChart3, 
  Map, 
  MessageSquare, 
  Users, 
  AlertCircle, 
  Bell,
  TrendingUp,
  Route,
  Building2,
  Ticket,
  CalendarClock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Dashboard chart placeholder component
const ChartPlaceholder = () => (
  <div className="h-[200px] rounded-md bg-muted/40 flex items-center justify-center">
    <span className="text-sm text-muted-foreground">Chart visualization</span>
  </div>
);

// Dashboard map placeholder component
const MapPlaceholder = () => (
  <div className="h-[200px] rounded-md bg-muted/40 flex items-center justify-center">
    <span className="text-sm text-muted-foreground">Map visualization</span>
  </div>
);

const Dashboard: React.FC = () => {
  const { activeVenue } = useActiveVenue();
  
  // Mock data for display purposes
  const stats = {
    upcomingShows: 8,
    artistRequests: 5,
    tourOpportunities: 12,
    potentialRevenue: 15800,
    venueCapacity: activeVenue?.capacity || 350,
    capacityUsed: 285,
  };

  // Generate mock upcoming shows
  const upcomingShows = [
    { 
      id: 1, 
      artistName: "The Electric Echoes", 
      date: addDays(new Date(), 3),
      status: "confirmed",
      ticketsSold: 230,
      capacity: 300,
      genre: "Indie Rock"
    },
    { 
      id: 2, 
      artistName: "Violet Sunset", 
      date: addDays(new Date(), 7),
      status: "confirmed",
      ticketsSold: 180,
      capacity: 300,
      genre: "Alternative"
    },
    { 
      id: 3, 
      artistName: "Cosmic Waves", 
      date: addDays(new Date(), 12),
      status: "pending",
      ticketsSold: 0,
      capacity: 300,
      genre: "Psychedelic Rock"
    },
  ];

  // Generate mock artist recommendations
  const artistRecommendations = [
    { 
      id: 1, 
      name: "Midnight Pulse", 
      genre: "Indie Folk", 
      matchScore: 92,
      image: null,
      upcoming: "Seattle, May 15"
    },
    { 
      id: 2, 
      name: "Crystal Nova", 
      genre: "Synth Pop", 
      matchScore: 88,
      image: null,
      upcoming: "Portland, May 18"
    },
    { 
      id: 3, 
      name: "Lunar Tides", 
      genre: "Alternative", 
      matchScore: 85,
      image: null,
      upcoming: "Vancouver, May 20"
    },
    { 
      id: 4, 
      name: "Velvet Thunder", 
      genre: "Rock", 
      matchScore: 82,
      image: null,
      upcoming: "Los Angeles, May 24"
    },
  ];

  // Generate mock tour opportunities
  const tourOpportunities = [
    {
      id: 1,
      bandName: "Northern Lights",
      tourName: "Cosmic Journey Tour 2025",
      dates: "May 10 - June 15",
      openDateNear: "May 12",
      draw: 500,
      genre: "Indie Rock",
      matchScore: 95
    },
    {
      id: 2,
      bandName: "Crimson Rivers",
      tourName: "Red Dawn Tour",
      dates: "May 20 - July 5",
      openDateNear: "May 22",
      draw: 350,
      genre: "Alternative",
      matchScore: 92
    },
    {
      id: 3,
      bandName: "Solar Winds",
      tourName: "Atmospheric Voyage 2025",
      dates: "June 5 - July 20",
      openDateNear: "June 8",
      draw: 400,
      genre: "Electronic",
      matchScore: 88
    }
  ];

  // Format date for display
  const formatShowDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'E, MMM d');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
        {activeVenue ? (
          <p className="text-muted-foreground">
            Welcome back. Here's what's happening with {activeVenue.name}.
          </p>
        ) : (
          <div className="flex items-center mt-2 p-3 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>No venue selected. Please select a venue to see personalized analytics and recommendations.</span>
          </div>
        )}
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingShows}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Next show on {format(upcomingShows[0].date, 'MMM d')}
            </div>
            <Progress className="h-1 mt-2" value={63} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artistRequests}</div>
            <div className="text-xs text-muted-foreground mt-1">
              +2 new since yesterday
            </div>
            <Progress className="h-1 mt-2" value={45} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tour Opportunities</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tourOpportunities}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Bands passing nearby in 30 days
            </div>
            <Progress className="h-1 mt-2" value={78} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.potentialRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              From upcoming confirmed shows
            </div>
            <Progress className="h-1 mt-2" value={85} />
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left column - Upcoming shows */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Shows</CardTitle>
                <Link href="/calendar">
                  <Button variant="outline" size="sm">View Calendar</Button>
                </Link>
              </div>
              <CardDescription>
                Scheduled performances at your venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingShows.length > 0 ? (
                <div className="space-y-4">
                  {upcomingShows.map((show) => (
                    <div key={show.id} className="flex flex-wrap md:flex-nowrap items-start justify-between space-y-2 md:space-y-0 p-4 rounded-md border">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="rounded-md bg-primary/10 w-12 h-12 flex items-center justify-center text-primary">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">{show.artistName}</h4>
                          <div className="flex items-center text-sm gap-2">
                            <span className="text-muted-foreground">{formatShowDate(show.date)}</span>
                            <span className="text-primary/50">•</span>
                            <span className="text-muted-foreground">{show.genre}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-16 md:ml-0">
                        <Badge variant={show.status === 'confirmed' ? 'default' : 'outline'} className="capitalize">
                          {show.status}
                        </Badge>
                        {show.status === 'confirmed' && (
                          <div className="text-xs">
                            <div className="text-muted-foreground">Tickets Sold</div>
                            <div className="font-medium">{show.ticketsSold}/{show.capacity}</div>
                          </div>
                        )}
                        <Link href={`/shows/${show.id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarClock className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg">No upcoming shows</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any scheduled performances yet
                  </p>
                  <Link href="/calendar/add">
                    <Button>Schedule a Show</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Performance metrics for your venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="attendance">
                <TabsList className="mb-4">
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="genres">Genres</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance">
                  <ChartPlaceholder />
                </TabsContent>
                <TabsContent value="revenue">
                  <ChartPlaceholder />
                </TabsContent>
                <TabsContent value="genres">
                  <ChartPlaceholder />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Link href="/analytics">
                <Button variant="outline">View Detailed Analytics</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Artist suggestions and Tour Opportunities */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Artist Recommendations</CardTitle>
              <CardDescription>
                Based on your venue's profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {artistRecommendations.map((artist) => (
                  <div key={artist.id} className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      {artist.image ? (
                        <AvatarImage src={artist.image} alt={artist.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">{artist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium truncate">{artist.name}</p>
                          <p className="text-xs text-muted-foreground">{artist.genre}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{artist.matchScore}% match</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Map className="h-3 w-3 mr-1" /> 
                        Nearby: {artist.upcoming}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/discovery">
                <Button variant="outline" className="w-full">Discover More Artists</Button>
              </Link>
            </CardFooter>
          </Card>
        
          <Card>
            <CardHeader>
              <CardTitle>Tour Opportunities</CardTitle>
              <CardDescription>
                Touring bands with open dates near your venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tourOpportunities.map((tour) => (
                  <div key={tour.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{tour.bandName}</h4>
                        <p className="text-xs text-muted-foreground">{tour.tourName}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {tour.matchScore}% fit
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Tour Dates</p>
                        <p>{tour.dates}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Open Date</p>
                        <p className="text-primary font-medium">{tour.openDateNear}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Draw Size</p>
                        <p>{tour.draw} fans</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Genre</p>
                        <p>{tour.genre}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link href={`/tour/${tour.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/tours">
                <Button variant="outline" className="w-full">View All Tour Opportunities</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;