import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getVenueClusters, 
  getRoutingGaps, 
  getSharedBookings, 
  getCollaborativeOffers
} from "../services/venue-network-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { MapPin, Calendar, Users, TrendingUp, Music, ArrowRight, Clock, AlertTriangle, Share2, Handshake } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function VenueNetworkHub() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch clusters
  const { 
    data: clusters = [], 
    isLoading: clustersLoading,
    error: clustersError
  } = useQuery({
    queryKey: ['venue-network-clusters'],
    queryFn: getVenueClusters
  });

  // Fetch routing gaps
  const { 
    data: routingGaps = [], 
    isLoading: gapsLoading,
    refetch: refetchGaps
  } = useQuery({
    queryKey: ['/api/venue-network/routing-gaps'],
    queryFn: () => getRoutingGaps({ status: 'open' })
  });

  // Fetch shared bookings
  const { 
    data: sharedBookings = [], 
    isLoading: bookingsLoading 
  } = useQuery({
    queryKey: ['/api/venue-network/shared-bookings'],
    queryFn: () => getSharedBookings()
  });

  // Fetch collaborative offers
  const { 
    data: collaborativeOffers = [], 
    isLoading: offersLoading 
  } = useQuery({
    queryKey: ['/api/venue-network/collaborative-offers'],
    queryFn: () => getCollaborativeOffers()
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Venue Network Hub</h1>
        <p className="text-muted-foreground">
          Collaborative tools for venues to coordinate bookings and touring routes
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clusters">Venue Clusters</TabsTrigger>
          <TabsTrigger value="gaps">Routing Gaps</TabsTrigger>
          <TabsTrigger value="bookings">Shared Bookings</TabsTrigger>
          <TabsTrigger value="offers">Collaborative Offers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Network Stats</CardTitle>
                <CardDescription>Current venue collaboration metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <span className="text-2xl font-bold">{clusters.length}</span>
                    <span className="text-sm text-muted-foreground">Venue Clusters</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mb-2 text-orange-500" />
                    <span className="text-2xl font-bold">{routingGaps.length}</span>
                    <span className="text-sm text-muted-foreground">Open Routing Gaps</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <Share2 className="h-8 w-8 mb-2 text-blue-500" />
                    <span className="text-2xl font-bold">{sharedBookings.length}</span>
                    <span className="text-sm text-muted-foreground">Shared Bookings</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <Handshake className="h-8 w-8 mb-2 text-green-500" />
                    <span className="text-2xl font-bold">{collaborativeOffers.length}</span>
                    <span className="text-sm text-muted-foreground">Collaborative Offers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Network Activity</CardTitle>
                <CardDescription>Latest updates across the venue network</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[240px] pr-4">
                  <div className="space-y-4">
                    {sharedBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 mt-0.5 text-blue-500" />
                        <div>
                          <p className="font-medium">{booking.bandName} Booking Shared</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.sourceVenue?.name} venue for {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {routingGaps.slice(0, 2).map((gap) => (
                      <div key={gap.id} className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-500" />
                        <div>
                          <p className="font-medium">Routing Gap Identified</p>
                          <p className="text-sm text-muted-foreground">
                            {gap.bandName} has a {getDateDiffInDays(gap.gapStartDate, gap.gapEndDate)} day gap
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {collaborativeOffers.slice(0, 2).map((offer) => (
                      <div key={offer.id} className="flex items-start space-x-3">
                        <Handshake className="h-5 w-5 mt-0.5 text-green-500" />
                        <div>
                          <p className="font-medium">New Collaborative Offer</p>
                          <p className="text-sm text-muted-foreground">
                            {offer.initiatingVenue?.name} created offer for {offer.bandName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Links & Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard 
              title="Identify Routing Opportunities" 
              description="Find gaps in tour schedules that your venue could fill"
              icon={<TrendingUp className="h-5 w-5" />}
              buttonText="View Routing Gaps"
              onClick={() => setActiveTab("gaps")}
            />
            
            <QuickActionCard 
              title="Share Your Bookings" 
              description="Let other venues know about your confirmed shows"
              icon={<Share2 className="h-5 w-5" />}
              buttonText="Share Bookings"
              onClick={() => setActiveTab("bookings")}
            />
            
            <QuickActionCard 
              title="View Venue Clusters" 
              description="Explore regional venue groups for better tour routing"
              icon={<MapPin className="h-5 w-5" />}
              buttonText="View Clusters"
              onClick={() => setActiveTab("clusters")}
            />
          </div>
        </TabsContent>

        {/* Venue Clusters Tab */}
        <TabsContent value="clusters" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Regional Venue Clusters</h2>
            <div className="flex space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                Pre-defined Regions
              </Badge>
            </div>
          </div>
          
          {clustersLoading ? (
            <div className="text-center py-8">Loading regional venue clusters...</div>
          ) : clusters.length === 0 ? (
            <Alert className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No regional venue clusters found</AlertTitle>
              <AlertDescription>
                Regional clusters are pre-defined geographic groupings that organize venues into standard US regions for improved tour routing.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((cluster) => (
                <Card key={cluster.id}>
                  <CardHeader>
                    <CardTitle>{cluster.name}</CardTitle>
                    <CardDescription>{cluster.description || "Geographic venue cluster"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Radius: {cluster.radiusKm || "Unknown"} km
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {cluster.members?.length || 0} member venues
                      </span>
                    </div>
                    {cluster.members && cluster.members.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium">Members:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cluster.members.slice(0, 5).map((member) => (
                            <Badge key={member.venueId} variant="outline">
                              {member.venue?.name || `Venue #${member.venueId}`}
                            </Badge>
                          ))}
                          {cluster.members.length > 5 && (
                            <Badge variant="outline">+{cluster.members.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Cluster Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routing Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Routing Gaps</h2>
            <Button variant="outline">
              Create New Gap Alert
            </Button>
          </div>
          
          {gapsLoading ? (
            <div className="text-center py-8">Loading routing gaps...</div>
          ) : routingGaps.length === 0 ? (
            <Alert className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No open routing gaps found</AlertTitle>
              <AlertDescription>
                Routing gaps appear when artists have schedule openings between confirmed shows.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {routingGaps.map((gap) => (
                <Card key={gap.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{gap.bandName}</CardTitle>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {getDateDiffInDays(gap.gapStartDate, gap.gapEndDate)} Day Gap
                      </Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(gap.gapStartDate), 'MMM d, yyyy')} to {format(new Date(gap.gapEndDate), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center">
                        <span className="font-medium">{gap.priorVenue?.name || 'Unknown Venue'}</span>
                        <ArrowRight className="h-4 w-4 mx-2" />
                        <span className="font-medium">{gap.nextVenue?.name || 'Unknown Venue'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-sm font-medium">Eligible Venues:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {gap.eligibleVenues && gap.eligibleVenues.length > 0 ? (
                          <>
                            {gap.eligibleVenues.slice(0, 5).map((venueId) => (
                              <Badge key={venueId} variant="outline">
                                Venue #{venueId}
                              </Badge>
                            ))}
                            {gap.eligibleVenues.length > 5 && (
                              <Badge variant="outline">+{gap.eligibleVenues.length - 5} more</Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No eligible venues specified</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">View Details</Button>
                    <Button>Express Interest</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shared Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Shared Bookings</h2>
            <Button>
              Share New Booking
            </Button>
          </div>
          
          {bookingsLoading ? (
            <div className="text-center py-8">Loading shared bookings...</div>
          ) : sharedBookings.length === 0 ? (
            <Alert className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No shared bookings found</AlertTitle>
              <AlertDescription>
                Share your confirmed bookings to help other venues in your network plan tour routes.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {sharedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{booking.bandName}</CardTitle>
                      <Badge variant={
                        booking.confirmedStatus === "confirmed" ? "default" : 
                        booking.confirmedStatus === "pending" ? "outline" : "destructive"
                      }>
                        {capitalizeFirstLetter(booking.confirmedStatus)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Shared by {booking.sourceVenue?.name || `Venue #${booking.sourceVenueId}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    
                    {booking.contactInfo && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Contact: </span>
                        {booking.contactInfo}
                      </div>
                    )}
                    
                    <div className="mt-4 flex space-x-2">
                      <Badge variant="outline" className={
                        booking.sharingLevel === "public" ? "bg-green-100 text-green-800" :
                        booking.sharingLevel === "trusted" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {capitalizeFirstLetter(booking.sharingLevel)}
                      </Badge>
                      
                      {booking.routeEligible && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Route Eligible
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Collaborative Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Collaborative Offers</h2>
            <Button>
              Create New Offer
            </Button>
          </div>
          
          {offersLoading ? (
            <div className="text-center py-8">Loading collaborative offers...</div>
          ) : collaborativeOffers.length === 0 ? (
            <Alert className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No collaborative offers found</AlertTitle>
              <AlertDescription>
                Create multi-venue offers to provide artists with complete routing solutions.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {collaborativeOffers.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{offer.name}</CardTitle>
                      <Badge variant={
                        offer.status === "sent" ? "default" : 
                        offer.status === "accepted" ? "outline" : 
                        offer.status === "declined" ? "destructive" : "outline"
                      }>
                        {capitalizeFirstLetter(offer.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      For {offer.bandName}, initiated by {offer.initiatingVenue?.name || `Venue #${offer.initiatingVenueId}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(offer.dateRange.start), 'MMM d')} - {format(new Date(offer.dateRange.end), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {offer.expiresAt && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Expires: {format(new Date(offer.expiresAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <span className="text-sm font-medium">Participating Venues:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {offer.participants && offer.participants.length > 0 ? (
                          <>
                            {offer.participants.map((participant) => (
                              <Badge key={participant.venueId} variant={
                                participant.confirmationStatus === "confirmed" ? "default" :
                                participant.confirmationStatus === "pending" ? "outline" :
                                "destructive"
                              }>
                                {participant.venue?.name || `Venue #${participant.venueId}`}
                              </Badge>
                            ))}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No participants yet</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">View Details</Button>
                    <Button>Join Offer</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs removed - now using static regional clusters */}
    </div>
  );
}

// Helper components
function QuickActionCard({ 
  title, 
  description, 
  icon, 
  buttonText, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  buttonText: string; 
  onClick: () => void; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="bg-primary/10 p-2 rounded-full mr-2 text-primary">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onClick} className="w-full">{buttonText}</Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions
function getDateDiffInDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}