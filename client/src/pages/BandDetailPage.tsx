import React from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle,
  CalendarDays,
  Globe,
  MapPin,
  Music,
  Users,
  Link as LinkIcon,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';
import { Band, Tour, TourDate } from '@shared/schema';
import { formatDate } from '@/lib/utils';

const BandDetailPage: React.FC = () => {
  const [match, params] = useRoute('/bands/:id');
  const { venue } = useActiveVenue();
  const bandId = params?.id ? parseInt(params.id) : undefined;
  
  // Get band details
  const { data: band, isLoading: isBandLoading, error: bandError } = useQuery({
    queryKey: [`/api/bands/${bandId}`],
    queryFn: async () => {
      if (!bandId) return null;
      const response = await axios.get(`/api/bands/${bandId}`);
      return response.data as Band;
    },
    enabled: !!bandId,
  });
  
  // Get tours for the band
  const { data: tours, isLoading: isToursLoading } = useQuery({
    queryKey: [`/api/bands/${bandId}/tours`],
    queryFn: async () => {
      if (!bandId) return [];
      const response = await axios.get(`/api/bands/${bandId}/tours`);
      return response.data as Tour[];
    },
    enabled: !!bandId,
  });
  
  // Get upcoming tour dates
  const { data: tourDates, isLoading: isTourDatesLoading } = useQuery({
    queryKey: [`/api/bands/${bandId}/tour-dates`],
    queryFn: async () => {
      if (!bandId) return [];
      const response = await axios.get(`/api/bands/${bandId}/tour-dates`);
      return response.data as TourDate[];
    },
    enabled: !!bandId,
  });

  // Show loading state
  if (isBandLoading || isToursLoading || isTourDatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading band information...</p>
        </div>
      </div>
    );
  }

  // Show error if band not found
  if (bandError || !band) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Band not found or error loading band information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-3 text-muted-foreground">
          <Link href="/discovery">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Artist Discovery
          </Link>
        </Button>
      </div>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{band.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center">
            <Music className="h-4 w-4 inline mr-1" />
            {band.genre || 'Unknown genre'}
            {band.location && (
              <>
                <span className="mx-2">•</span>
                <MapPin className="h-4 w-4 inline mr-1" />
                {band.location}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>Contact</Button>
          <Button variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Request Booking
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Band Info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Band Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Genre</h3>
                <p>{band.genre || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Location</h3>
                <p>{band.location || 'Unknown'}</p>
              </div>
              
              {band.formationYear && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Formed</h3>
                  <p>{band.formationYear}</p>
                </div>
              )}
              
              {band.website && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Website</h3>
                  <a 
                    href={band.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    {band.website}
                    <LinkIcon className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {band.contactEmail && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Contact</h3>
                  <a 
                    href={`mailto:${band.contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {band.contactEmail}
                  </a>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {band.bandsintownId && (
                <Button variant="outline" className="w-full" asChild>
                  <a 
                    href={`https://www.bandsintown.com/a/${band.bandsintownId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    View on Bandsintown
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Tours and Events */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tours & Upcoming Shows</CardTitle>
              <CardDescription>
                {tourDates && tourDates.length > 0 
                  ? `${tourDates.length} upcoming shows` 
                  : 'No upcoming shows found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tours">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tours">Current Tours</TabsTrigger>
                  <TabsTrigger value="shows">All Shows</TabsTrigger>
                </TabsList>
                <TabsContent value="tours" className="space-y-4 mt-4">
                  {tours && tours.length > 0 ? (
                    tours.map(tour => (
                      <Card key={tour.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{tour.name}</CardTitle>
                          <CardDescription>
                            {tour.startDate && tour.endDate ? (
                              `${formatDate(tour.startDate)} - ${formatDate(tour.endDate)}`
                            ) : 'Dates not specified'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{tour.description || 'No description available'}</p>
                          
                          {/* Tour stats */}
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{tour.estimatedShowCount || '?'}</div>
                              <p className="text-xs text-muted-foreground">Shows</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{tour.estimatedDurationDays || '?'}</div>
                              <p className="text-xs text-muted-foreground">Days</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{venue ? `${tour.distanceToVenue || '?'} mi` : 'N/A'}</div>
                              <p className="text-xs text-muted-foreground">From venue</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium">No tours found</h3>
                      <p className="text-muted-foreground mt-1">
                        This band doesn't have any active tours at the moment
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="shows" className="mt-4">
                  {tourDates && tourDates.length > 0 ? (
                    <div className="space-y-3">
                      {tourDates
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(date => (
                          <div key={date.id} className="flex justify-between border-b pb-3">
                            <div>
                              <h3 className="font-medium">{date.title || 'Untitled Show'}</h3>
                              <p className="text-sm text-muted-foreground">{formatDate(date.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {date.venueName || date.venueId ? `Venue: ${date.venueName || date.venueId}` : 'No venue info'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {date.city && date.state ? `${date.city}, ${date.state}` : 'Location not specified'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium">No upcoming shows</h3>
                      <p className="text-muted-foreground mt-1">
                        This band doesn't have any scheduled shows at the moment
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              {venue && (
                <Button className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  Check Fit with {venue.name}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BandDetailPage;