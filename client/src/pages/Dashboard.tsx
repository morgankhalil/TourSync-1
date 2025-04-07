import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Link } from 'wouter';
import { getLocationLabel, formatDate, formatDateMedium, cn } from '@/lib/utils';
import { Venue } from '@/types';
import { 
  Calendar, 
  MessageSquare, 
  Music, 
  TrendingUp, 
  User, 
  Users, 
  DollarSign, 
  MapPin, 
  Ticket, 
  Clock,
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays,
  BadgePlus,
  Star
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const Dashboard: React.FC = () => {
  const { activeVenue } = useActiveVenue();
  
  // Placeholder data - in a real implementation, these would come from API calls
  const upcomingBookings = 5;
  const inquiriesPending = 3;
  const bandsPassing = 12;
  const venueCapacity = activeVenue?.capacity || 400;
  const currentMonthRevenue = 18750;
  const lastMonthRevenue = 15200;
  const revenueChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  
  // Monthly booking stats placeholder
  const bookingData = {
    totalCapacity: venueCapacity * 30, // Capacity * days in month
    bookedCapacity: venueCapacity * upcomingBookings,
    percentBooked: (upcomingBookings / 30) * 100,
    daysAvailable: 30 - upcomingBookings,
  };
  
  // Analytics placeholder data
  const genrePopularity = [
    { name: "Indie Rock", percent: 35 },
    { name: "Alternative", percent: 25 },
    { name: "Electronic", percent: 15 },
    { name: "Hip Hop", percent: 15 },
    { name: "Other", percent: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {activeVenue ? (
            <div className="flex items-center mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
              <p className="text-muted-foreground">
                {activeVenue.address}, {getLocationLabel(activeVenue.city, activeVenue.state)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Select a venue to view customized dashboard
            </p>
          )}
        </div>
        
        {activeVenue && (
          <div className="flex gap-2">
            <Link href="/performances/add">
              <Button>
                <BadgePlus className="mr-2 h-4 w-4" />
                Add Show
              </Button>
            </Link>
            <Link href="/calendar/manage">
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                Update Calendar
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Not Logged In State */}
      {!activeVenue && (
        <Card className="p-6 bg-muted/30 border border-dashed">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="rounded-full bg-primary/10 p-3">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>No Venue Selected</CardTitle>
            <CardDescription className="max-w-[500px]">
              Please select a venue from the dropdown in the top navigation bar to view your venue's dashboard and analytics.
            </CardDescription>
            <div className="mt-2">
              <VenueSelector />
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      {activeVenue && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Monthly Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonthRevenue.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <span className={cn(
                  "text-xs flex items-center",
                  revenueChange > 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {revenueChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(revenueChange).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Shows Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Next show on {formatDateMedium(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Inquiries Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquiries Pending</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inquiriesPending}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-emerald-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +1 new today
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bands Passing Nearby Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bands Passing Nearby</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bandsPassing}</div>
              <div className="flex items-center mt-1">
                <Link href="/artist-discovery">
                  <span className="text-xs text-primary flex items-center hover:underline cursor-pointer">
                    View opportunities
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Content */}
      {activeVenue && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Calendar Availability */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Calendar Status</CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    View Calendar
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Your venue's booking status for this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Booked Capacity</span>
                    <div className="text-xl font-bold">{Math.round(bookingData.percentBooked)}%</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Days Available</span>
                    <div className="text-xl font-bold">{bookingData.daysAvailable} days</div>
                  </div>
                </div>
                
                <Progress 
                  value={bookingData.percentBooked} 
                  className="h-2"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-xs font-medium text-muted-foreground">Strongest Booking Days</div>
                    <ul className="mt-2 space-y-1">
                      <li className="text-sm flex justify-between">
                        <span>Friday</span>
                        <span className="font-medium">90%</span>
                      </li>
                      <li className="text-sm flex justify-between">
                        <span>Saturday</span>
                        <span className="font-medium">85%</span>
                      </li>
                      <li className="text-sm flex justify-between">
                        <span>Thursday</span>
                        <span className="font-medium">70%</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-xs font-medium text-muted-foreground">Available Blocks</div>
                    <ul className="mt-2 space-y-1">
                      <li className="text-sm flex justify-between">
                        <span>April 15-17</span>
                        <Badge variant="outline" className="text-xs">3 days</Badge>
                      </li>
                      <li className="text-sm flex justify-between">
                        <span>April 22-23</span>
                        <Badge variant="outline" className="text-xs">2 days</Badge>
                      </li>
                      <li className="text-sm flex justify-between">
                        <span>April 28-30</span>
                        <Badge variant="outline" className="text-xs">3 days</Badge>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Genre Analytics */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Genre Analytics</CardTitle>
              <CardDescription>
                Distribution of musical genres at your venue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {genrePopularity.map((genre, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{genre.name}</span>
                      <span className="text-sm">{genre.percent}%</span>
                    </div>
                    <Progress value={genre.percent} className="h-2" />
                  </div>
                ))}
                
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Based on last 6 months of bookings</span>
                  <Link href="/analytics">
                    <Button variant="outline" size="sm">Full Analytics</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Shows and Artist Recommendations */}
      {activeVenue && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Upcoming Shows */}
          <Card className="md:col-span-1 lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Shows</CardTitle>
                <Badge variant="outline">{upcomingBookings} Total</Badge>
              </div>
              <CardDescription>
                Your venue's upcoming scheduled performances.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[320px]">
                <div className="px-6 divide-y">
                  {[...Array(5)].map((_, index) => {
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + (index + 1) * 5);
                    
                    const bandNames = [
                      "The Midnight Echoes", 
                      "Neon Horizon", 
                      "Crimson Cascade",
                      "Velvet Thunder",
                      "Lunar Tides"
                    ];
                    
                    const expectedAttendance = Math.floor(Math.random() * 60) + 40;
                    const status = index === 0 ? "sold-out" : 
                                index === 1 ? "on-sale" : 
                                index === 2 ? "pending" : "confirmed";
                    
                    return (
                      <div key={index} className="py-4">
                        <div className="flex items-start gap-3">
                          {/* Date */}
                          <div className="text-center min-w-[50px]">
                            <div className="text-xs font-medium uppercase text-muted-foreground">
                              {formatDate(futureDate, 'MMM')}
                            </div>
                            <div className="text-2xl font-bold leading-none mt-1">
                              {formatDate(futureDate, 'd')}
                            </div>
                            <div className="text-xs mt-1">
                              {formatDate(futureDate, 'EEE')}
                            </div>
                          </div>
                          
                          {/* Show Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold truncate">{bandNames[index % bandNames.length]}</h4>
                              <Badge 
                                variant={status === 'sold-out' ? 'destructive' : 
                                         status === 'on-sale' ? 'default' : 
                                         'secondary'} 
                                className="text-[10px]"
                              >
                                {status === 'sold-out' ? 'SOLD OUT' : 
                                 status === 'on-sale' ? 'ON SALE' : 
                                 status === 'pending' ? 'PENDING' : 'CONFIRMED'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="inline-flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(futureDate, 'h:mm a')}
                              </span>
                              <span className="inline-flex items-center ml-3">
                                <Ticket className="h-3 w-3 mr-1" />
                                {expectedAttendance}% capacity
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <Link href={`/performances/details/${index}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex justify-between items-center w-full">
                <Link href="/performances">
                  <Button variant="outline">View All Shows</Button>
                </Link>
                <Link href="/performances/add">
                  <Button variant="secondary" size="sm">+ Add Show</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
          
          {/* Artist Recommendations */}
          <Card className="md:col-span-1 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Artist Recommendations</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Star className="h-4 w-4 text-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Based on your venue profile and booking history</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Artists who would be a good fit for your venue.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[320px]">
                <div className="px-6 divide-y">
                  {[...Array(6)].map((_, index) => {
                    const artistNames = [
                      "Frozen Echo", 
                      "Silver Pulse", 
                      "Neon Valley", 
                      "Cosmic Dawn",
                      "Electric Wind",
                      "Atlas Theory"
                    ];
                    const genres = ["Indie Rock", "Alternative", "Post-Punk", "Synth Pop", "Indie Folk", "Electronic"];
                    const fanBase = [2500, 3200, 1800, 4100, 2700, 3500];
                    const match = 95 - (index * 7);
                    
                    return (
                      <div key={index} className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {artistNames[index % artistNames.length].split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {artistNames[index % artistNames.length]}
                              </h4>
                              <Badge variant="outline" className="ml-1.5 font-mono bg-primary/5">
                                {match}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{genres[index % genres.length]}</span>
                              <span className="inline-flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {fanBase[index % fanBase.length].toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Link href="/artist-discovery" className="w-full">
                <Button className="w-full">
                  Discover More Artists
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;