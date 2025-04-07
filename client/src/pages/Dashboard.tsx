import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Link } from 'wouter';
import { getLocationLabel, formatDate, formatDateMedium } from '@/lib/utils';
import { Venue } from '@/types';

const Dashboard: React.FC = () => {
  const venue = useActiveVenue();
  const activeVenue = venue.activeVenue;
  
  // Placeholder data - in a real implementation, these would come from API calls
  const upcomingBookings = 5;
  const inquiriesPending = 3;
  const bandsPassing = 12;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        {activeVenue ? (
          <div>
            <p className="text-xl font-semibold">{activeVenue.name}</p>
            <p className="text-muted-foreground">
              {activeVenue.address}, {getLocationLabel(activeVenue.city, activeVenue.state)}
            </p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <p>No venue selected. Please select a venue to view customized dashboard.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Next show on {formatDateMedium(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/calendar">
              <Button className="w-full" variant="outline">View Calendar</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiries Pending</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiriesPending}</div>
            <p className="text-xs text-muted-foreground">
              +1 from yesterday
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Review Inquiries</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bands Passing Nearby</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bandsPassing}</div>
            <p className="text-xs text-muted-foreground">
              In the next 30 days
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/discovery">
              <Button className="w-full" variant="outline">Discover Artists</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Shows</CardTitle>
            <CardDescription>
              Your venue's upcoming scheduled performances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeVenue ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => {
                  const futureDate = new Date();
                  futureDate.setDate(futureDate.getDate() + (index + 1) * 5);
                  
                  const bandNames = [
                    "The Midnight Echoes", 
                    "Neon Horizon", 
                    "Crimson Cascade",
                    "Velvet Thunder",
                    "Lunar Tides"
                  ];
                  
                  return (
                    <div key={index} className="flex items-center justify-between space-x-4 rounded-md border p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{bandNames[index % bandNames.length]}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateMedium(futureDate)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border rounded bg-muted/10">
                <p className="text-muted-foreground">Select a venue to view upcoming shows</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/calendar">
              <Button variant="outline">View All Shows</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Artists You May Like</CardTitle>
            <CardDescription>
              Based on your venue's history and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeVenue ? (
                [...Array(5)].map((_, index) => {
                  const artistNames = [
                    "Frozen Echo", 
                    "Silver Pulse", 
                    "Neon Valley", 
                    "Cosmic Dawn",
                    "Electric Wind"
                  ];
                  const genres = ["Indie Rock", "Alternative", "Post-Punk", "Synth Pop", "Indie Folk"];
                  
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {artistNames[index % artistNames.length].split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {artistNames[index % artistNames.length]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {genres[index % genres.length]}
                        </p>
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        {80 - (index * 10)}% match
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-40 border rounded bg-muted/10">
                  <p className="text-muted-foreground">Select a venue to see recommendations</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/discovery">
              <Button variant="outline">Discover More</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;