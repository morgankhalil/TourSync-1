import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Link } from 'wouter';
import { 
  Calendar, 
  PieChart, 
  Users, 
  TrendingUp, 
  Music, 
  Palmtree, 
  PlusCircle, 
  Info, 
  Network, 
  RefreshCw, 
  Map, 
  Route, 
  MessageSquare,
  Handshake,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, addDays, parseISO, isFuture } from 'date-fns';

// Types for the dashboard components
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick: () => void;
}

interface StatCardProps {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  trend?: number;
  isLoading?: boolean;
}

interface EventCardProps {
  id: string;
  bandName: string;
  date: string;
  status: 'confirmed' | 'pending' | 'available';
  attendance?: number;
}

interface ActivityCardProps {
  type: 'booking' | 'gap' | 'offer';
  title: string;
  subtitle: string;
  date: string;
}

// Helper components
const QuickActionCard = ({ title, description, icon, buttonText, buttonVariant = "default", onClick }: QuickActionCardProps) => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-start space-y-0 pb-2">
      <div className="mr-4 rounded-full p-1 bg-primary/10">
        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 text-primary" })}
      </div>
      <div>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
    <CardFooter className="pt-2">
      <Button variant={buttonVariant} className="w-full" onClick={onClick}>
        {buttonText}
      </Button>
    </CardFooter>
  </Card>
);

const StatCard = ({ value, label, icon, trend, isLoading }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      <div className="rounded-full p-1 bg-primary/10">
        {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 text-primary" })}
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-20 rounded-md" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {trend !== undefined && (
        <p className={cn("text-xs", trend >= 0 ? "text-green-500" : "text-red-500")}>
          {trend >= 0 ? "+" : ""}{trend}% from last month
        </p>
      )}
    </CardContent>
  </Card>
);

const EventCard = ({ id, bandName, date, status, attendance }: EventCardProps) => {
  const statusColors = {
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500",
    available: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500",
  };

  return (
    <Card className="mb-3">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div>
          <CardTitle className="text-base font-semibold">{bandName}</CardTitle>
          <CardDescription>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </div>
        <Badge className={statusColors[status]} variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="pb-4 pt-0 px-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isFuture(new Date(date)) 
              ? `In ${Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` 
              : 'Past event'}
          </span>
          {attendance !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              {attendance}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NetworkActivityCard = ({ type, title, subtitle, date }: ActivityCardProps) => {
  const iconMap = {
    booking: <Calendar className="h-4 w-4" />,
    gap: <Palmtree className="h-4 w-4" />,
    offer: <Handshake className="h-4 w-4" />
  };

  const colorMap = {
    booking: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800/30",
    gap: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border-amber-200 dark:border-amber-800/30",
    offer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800/30"
  };

  return (
    <div className={`relative p-4 rounded-lg border mb-3 ${colorMap[type]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-full p-1 bg-white/70 dark:bg-black/20">
          {iconMap[type]}
        </div>
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm mb-1">{subtitle}</p>
      <p className="text-xs opacity-70">{date}</p>
    </div>
  );
};

// Main Dashboard Component
export function VenueDashboard() {
  const { toast } = useToast();
  const { activeVenueId, activeVenue, isLoadingVenue, venueData } = useActiveVenue();

  // Mock data for demonstration - would be replaced with actual API calls
  const { isLoading: isLoadingEvents } = useQuery({ 
    queryKey: ['/api/venues/events', activeVenueId],
    enabled: !!activeVenueId,
    queryFn: async () => {
      // This would be a real API call in production
      return [];
    }
  });

  const quickActions = [
    {
      title: "Venue Network",
      description: "Connect with partner venues to share bookings and coordinate tours",
      icon: <Network />,
      buttonText: "View Network",
      onClick: () => window.location.href = '/venue-network'
    },
    {
      title: "Tour Finder",
      description: "Discover bands touring near your location and fill open dates",
      icon: <Route />,
      buttonText: "Find Tours",
      onClick: () => window.location.href = '/venues/tour-finder'
    },
    {
      title: "Calendar",
      description: "Manage your bookings, holds and availability",
      icon: <Calendar />,
      buttonText: "Open Calendar",
      onClick: () => window.location.href = '/calendar'
    },
    {
      title: "Share Booking",
      description: "Let your network know about new confirmed bookings",
      icon: <Share2 />,
      buttonText: "Share Booking",
      buttonVariant: "outline",
      onClick: () => toast({
        title: "Coming Soon",
        description: "This feature will be available in the next update!",
      })
    }
  ];

  // Sample upcoming events data
  const upcomingEvents = [
    {
      id: "1",
      bandName: "The Mountain Goats",
      date: addDays(new Date(), 5).toISOString(),
      status: 'confirmed' as const,
      attendance: 350
    },
    {
      id: "2",
      bandName: "Mitski",
      date: addDays(new Date(), 14).toISOString(),
      status: 'confirmed' as const,
      attendance: 450
    },
    {
      id: "3",
      bandName: "Open Date",
      date: addDays(new Date(), 21).toISOString(),
      status: 'available' as const
    },
    {
      id: "4",
      bandName: "Japanese Breakfast",
      date: addDays(new Date(), 28).toISOString(),
      status: 'pending' as const
    }
  ];

  // Sample network activity data
  const networkActivity = [
    {
      type: 'booking' as const,
      title: 'New Shared Booking',
      subtitle: 'Empty Bottle has booked Parquet Courts for June 15',
      date: '3 hours ago'
    },
    {
      type: 'gap' as const,
      title: 'Routing Gap Opportunity',
      subtitle: 'Julien Baker needs a venue between Chicago and Detroit (June 7-9)',
      date: '1 day ago'
    },
    {
      type: 'offer' as const,
      title: 'Multi-Venue Offer',
      subtitle: 'Collaborative offer for Big Thief (4 venues in Midwest)',
      date: '2 days ago'
    },
    {
      type: 'booking' as const,
      title: 'New Shared Booking',
      subtitle: 'Metro has booked Animal Collective for July 22',
      date: '3 days ago'
    }
  ];

  // Sample monthly stats
  const monthlyStats = [
    { 
      label: "Shows This Month", 
      value: "8", 
      trend: 14.5, 
      icon: <Calendar /> 
    },
    { 
      label: "Avg. Attendance", 
      value: "385", 
      trend: 2.3, 
      icon: <Users /> 
    },
    { 
      label: "Network Referrals", 
      value: "12", 
      trend: 28.0, 
      icon: <Network /> 
    },
    { 
      label: "Tour Finder Bookings", 
      value: "5", 
      trend: 16.8, 
      icon: <Route /> 
    }
  ];

  // Venue utilization progress
  const venueUtilization = 75;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Venue Dashboard</h1>
        {activeVenueId && venueData ? (
          <p className="text-muted-foreground mb-0">
            Welcome to {venueData.name} | {venueData.city}, {venueData.state}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-amber-500">
            <Info className="h-4 w-4" />
            <span>Please select a venue to see customized dashboard information</span>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </div>
      </section>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Monthly Stats & Venue Utilization */}
        <div className="space-y-8">
          {/* Monthly Stats */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Monthly Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {monthlyStats.map((stat, i) => (
                <StatCard
                  key={i}
                  {...stat}
                  isLoading={isLoadingVenue}
                />
              ))}
            </div>
          </section>

          {/* Venue Utilization */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Venue Utilization</h2>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Monthly Capacity</CardTitle>
                  <span className="text-lg font-bold">{venueUtilization}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={venueUtilization} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>Target: 80%</span>
                  <span>100%</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-sm text-muted-foreground">
                  You're on track to hit your monthly capacity target
                </p>
              </CardFooter>
            </Card>
          </section>
        </div>

        {/* Middle Column: Upcoming Events */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {isLoadingEvents ? (
              <>
                <Skeleton className="h-24 w-full rounded-md mb-3" />
                <Skeleton className="h-24 w-full rounded-md mb-3" />
                <Skeleton className="h-24 w-full rounded-md" />
              </>
            ) : upcomingEvents.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-300px)]">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </ScrollArea>
            ) : (
              <Card className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground mb-4 max-w-xs">
                  You don't have any upcoming events scheduled. Start adding events to your calendar.
                </p>
                <Button className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add Event
                </Button>
              </Card>
            )}
          </div>
        </section>

        {/* Right Column: Network Activity */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Network Activity</h2>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="space-y-3">
            {isLoadingVenue ? (
              <>
                <Skeleton className="h-24 w-full rounded-md mb-3" />
                <Skeleton className="h-24 w-full rounded-md mb-3" />
                <Skeleton className="h-24 w-full rounded-md" />
              </>
            ) : networkActivity.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-300px)]">
                {networkActivity.map((activity, i) => (
                  <NetworkActivityCard key={i} {...activity} />
                ))}
              </ScrollArea>
            ) : (
              <Card className="flex flex-col items-center justify-center py-8 text-center">
                <Network className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Network Activity</h3>
                <p className="text-muted-foreground mb-4 max-w-xs">
                  Join venue networks to see shared bookings and collaboration opportunities.
                </p>
                <Button className="flex items-center gap-1">
                  <Network className="h-4 w-4" />
                  Join Networks
                </Button>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

