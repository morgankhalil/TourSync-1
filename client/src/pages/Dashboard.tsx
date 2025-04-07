import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Route, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { addDays, format } from 'date-fns';

const Dashboard = () => {
  const { activeVenue, isLoading: isVenueLoading } = useActiveVenue();

  // If no venue is selected, redirect to home
  if (!isVenueLoading && !activeVenue) {
    window.location.href = '/';
    return null;
  }

  const stats = {
    upcomingShows: 8,
    artistRequests: 5,
    tourOpportunities: 12,
    potentialRevenue: 15800
  };

  const upcomingShows = [
    { 
      id: 1, 
      artistName: "The Electric Echoes", 
      date: addDays(new Date(), 3),
      status: "confirmed",
      ticketsSold: 230,
      capacity: 300
    },
    // Add more shows as needed
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{activeVenue?.name} Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your venue's performance and opportunities
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingShows}</div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artist Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artistRequests}</div>
            <Progress value={45} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tour Opportunities</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tourOpportunities}</div>
            <Progress value={60} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.potentialRevenue.toLocaleString()}</div>
            <Progress value={80} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingShows.map(show => (
                <div key={show.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{show.artistName}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(show.date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/venue-availability">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Availability
                </Button>
              </Link>
              <Link href="/artist-discovery">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Discover Artists
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;