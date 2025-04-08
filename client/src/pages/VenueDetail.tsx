import React from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Users, Music, Tag, ArrowLeft, Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVenue } from '@/hooks/useVenues';

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use our custom hook to fetch venue details
  const { data: venue, isLoading, error } = useVenue(id);
  
  // Handle error with toast notification
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching venue details",
        description: "There was a problem loading the venue information. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/venues')}
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Venues
        </Button>
        
        <div className="text-center p-12 bg-muted/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground">
            The venue you're looking for doesn't exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Button 
        variant="outline" 
        onClick={() => setLocation('/venues')}
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Venues
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-md border-primary/10">
            <CardHeader className="pb-2 bg-primary/5">
              <CardTitle className="text-2xl">{venue.name}</CardTitle>
              <CardDescription className="flex items-center text-sm">
                <MapPin size={16} className="mr-1" />
                {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {venue.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">About</h3>
                  <p className="text-sm">{venue.description}</p>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Venue Details</h3>
                  
                  <div className="flex items-center mb-2">
                    <Users size={16} className="mr-2 text-primary" />
                    <span className="text-sm">Capacity: {venue.capacity || 'Not specified'}</span>
                  </div>
                  
                  {venue.venueType && (
                    <div className="flex items-center mb-2">
                      <Tag size={16} className="mr-2 text-primary" />
                      <span className="text-sm">Type: {venue.venueType}</span>
                    </div>
                  )}
                  
                  {venue.dealType && (
                    <div className="flex items-center mb-2">
                      <Tag size={16} className="mr-2 text-primary" />
                      <span className="text-sm">Deal Type: {venue.dealType}</span>
                    </div>
                  )}
                  
                  {venue.genre && (
                    <div className="flex items-center mb-2">
                      <Music size={16} className="mr-2 text-primary" />
                      <span className="text-sm">Primary Genre: {venue.genre}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                  
                  {venue.contactName && (
                    <div className="flex items-center mb-2">
                      <span className="text-sm">{venue.contactName}</span>
                    </div>
                  )}
                  
                  {venue.contactEmail && (
                    <div className="flex items-center mb-2">
                      <Mail size={16} className="mr-2 text-primary" />
                      <a 
                        href={`mailto:${venue.contactEmail}`} 
                        className="text-sm text-primary hover:underline"
                      >
                        {venue.contactEmail}
                      </a>
                    </div>
                  )}
                  
                  {venue.contactPhone && (
                    <div className="flex items-center mb-2">
                      <Phone size={16} className="mr-2 text-primary" />
                      <a 
                        href={`tel:${venue.contactPhone}`} 
                        className="text-sm text-primary hover:underline"
                      >
                        {venue.contactPhone}
                      </a>
                    </div>
                  )}
                  
                  {venue.website && (
                    <div className="flex items-center mb-2">
                      <LinkIcon size={16} className="mr-2 text-primary" />
                      <a 
                        href={venue.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {venue.technicalSpecs && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Technical Specifications</h3>
                    <p className="text-sm">{venue.technicalSpecs}</p>
                  </div>
                </>
              )}
              
              {venue.amenities && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Amenities</h3>
                    <p className="text-sm">{venue.amenities}</p>
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between bg-muted/10 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/venues')}
              >
                <ArrowLeft size={16} className="mr-2" /> Back to Venues
              </Button>
              
              <Button 
                variant="default"
                onClick={() => setLocation(`/calendar?venueId=${venue.id}`)}
              >
                <Calendar size={16} className="mr-2" /> View Calendar
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card className="shadow-md h-full border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Simple static map display */}
              <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                <MapPin size={32} className="text-primary" />
                <p className="text-xs text-center mt-2">
                  {venue.latitude}, {venue.longitude}
                  <br />
                  {venue.address}, {venue.city}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h3>
                
                {venue.loadingInfo && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Loading Info:</span>
                    <p className="text-xs">{venue.loadingInfo}</p>
                  </div>
                )}
                
                {venue.accommodations && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Accommodations:</span>
                    <p className="text-xs">{venue.accommodations}</p>
                  </div>
                )}
                
                {venue.priceRange && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Price Range:</span>
                    <p className="text-xs">{venue.priceRange}</p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`, '_blank')}
              >
                <MapPin size={16} className="mr-2" /> Open in Maps
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;