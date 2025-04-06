import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Venue } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import PastPerformancesManager from "@/components/venue/PastPerformancesManager";
import { Loader2, MapPin, Users, Calendar, Info } from "lucide-react";
// Import VenueMapView as a fallback if VenueMap is unavailable
import VenueMapView from "../components/maps/VenueMapView";

export default function VenueProfile() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const venueId = params.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!venueId) {
      setLocation("/venues");
    }
  }, [venueId, setLocation]);

  const {
    data: venue,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/venues", venueId],
    queryFn: async () => {
      const result = await apiRequest(`/api/venues/${venueId}`);
      return result as Venue;
    },
    enabled: !!venueId,
    staleTime: 60000
  });

  if (!venueId) {
    return <div>Invalid venue ID. Redirecting...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading venue details...</span>
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Error Loading Venue</h2>
        <p className="text-red-500 mb-4">{(error as Error)?.message || "An error occurred while loading venue data."}</p>
        <Button onClick={() => setLocation("/venues")}>Back to Venues</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{venue.name}</h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
          </p>
        </div>
        <Button onClick={() => setLocation("/venues")}>Back to Venues</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Venue Details</TabsTrigger>
          <TabsTrigger value="performances">Past Performances</TabsTrigger>
          <TabsTrigger value="calendar">Availability Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                  <CardDescription>Details about {venue.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Capacity</h3>
                      <p className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {venue.capacity || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Venue Type</h3>
                      <p>{venue.venueType || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Deal Type</h3>
                      <p>{venue.dealType || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Preferred Genres</h3>
                      <p>{venue.genre || "All genres"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Description</h3>
                      <p>{venue.description || "No description provided."}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Contact Information</h3>
                      <p>{venue.contactName || "No contact name provided"}</p>
                      <p>{venue.contactEmail || "No email provided"}</p>
                      <p>{venue.contactPhone || "No phone provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                  <CardDescription>Stage, sound, and venue details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Technical Specs</h3>
                      <p>{venue.technicalSpecs ? JSON.stringify(venue.technicalSpecs) : "No technical specs provided."}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Amenities</h3>
                      <p>{venue.amenities ? JSON.stringify(venue.amenities) : "No amenities listed."}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Loading Information</h3>
                      <p>{venue.loadingInfo || "No loading information provided."}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-1">Accommodation Information</h3>
                      <p>{venue.accommodations || "No accommodation information provided."}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <VenueMapView 
                    venue={{
                      ...venue,
                      capacity: venue.capacity === null ? undefined : venue.capacity
                    }}
                    onTourClick={() => {}}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("performances")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Past Performances
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("calendar")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Availability Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performances">
          <PastPerformancesManager venueId={venueId} />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Venue Availability Calendar</CardTitle>
              <CardDescription>Manage dates when your venue is available for booking</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Using a simplified version of VenueAvailability component */}
              <div className="flex flex-col gap-4">
                <div className="calendar-container border rounded-md p-4">
                  <Calendar
                    mode="multiple"
                    selected={[]}
                    className="rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button>
                    Save Changes
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Note: Select dates to mark your venue as available. Currently this is a preview - full calendar functionality will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}