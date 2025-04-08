import React from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Calendar, 
  MessageSquare, 
  Users, 
  Globe,
  ExternalLink,
  Mail
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ArtistProfile: React.FC = () => {
  const [, params] = useRoute('/artists/:id');
  const artistId = params?.id || '';
  
  const { data: artist, isLoading: isLoadingArtist } = useQuery({
    queryKey: ['/api/artists', artistId],
    queryFn: async () => {
      const response = await fetch(`/api/artists/${artistId}`);
      if (!response.ok) throw new Error('Failed to fetch artist');
      return response.json();
    },
    enabled: !!artistId
  });
  
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/artists', artistId, 'events'],
    queryFn: async () => {
      const response = await fetch(`/api/artists/${artistId}/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!artistId
  });

  if (isLoadingArtist) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Skeleton className="aspect-square w-full rounded-xl" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex flex-wrap gap-2 my-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
        <p className="text-muted-foreground">
          We couldn't find the artist you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Artist Image and Quick Info */}
        <div className="md:w-1/3">
          {artist.imageUrl ? (
            <img 
              src={artist.imageUrl} 
              alt={artist.name}
              className="w-full rounded-xl aspect-square object-cover"
            />
          ) : (
            <div className="w-full rounded-xl aspect-square bg-primary/10 flex items-center justify-center">
              <Music className="h-24 w-24 text-primary/40" />
            </div>
          )}
          
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {artist.location && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Based in {artist.location}</span>
                  </div>
                )}
                
                {artist.drawSize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Typical Draw: {artist.drawSize} fans</span>
                  </div>
                )}
                
                {artist.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {artist.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Button className="w-full gap-2">
              <MessageSquare className="h-4 w-4" />
              Request Collaboration
            </Button>
            
            <Button variant="outline" className="w-full gap-2">
              <Mail className="h-4 w-4" />
              Contact Artist
            </Button>
          </div>
        </div>
        
        {/* Artist Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          {artist.genres && artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 my-4">
              {artist.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
          
          {artist.description && (
            <p className="text-muted-foreground mt-4">
              {artist.description}
            </p>
          )}
          
          {/* Collaboration Info */}
          {artist.lookingToCollaborate && (
            <Card className="my-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Open to Collaboration</CardTitle>
                <CardDescription>
                  This artist is actively looking for collaboration opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {artist.collaborationTypes && artist.collaborationTypes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Interested in:</h4>
                    <div className="flex flex-wrap gap-2">
                      {artist.collaborationTypes.map((type: string) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Tabs for Events, Compatibility, etc. */}
          <Tabs defaultValue="events" className="mt-8">
            <TabsList>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Events
              </TabsTrigger>
              <TabsTrigger value="compatibility" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Compatible Artists
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="mt-4">
              {isLoadingEvents ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event: any) => (
                    <Card key={event.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{event.venueName}</CardTitle>
                          <Badge variant="outline" className="font-mono">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </Badge>
                        </div>
                        <CardDescription>
                          {event.venueCity}, {event.venueState || event.venueCountry}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {event.collaborationOpen && (
                          <Badge variant="secondary" className="mb-2">
                            Open for Collaboration
                          </Badge>
                        )}
                        
                        {event.ticketUrl && (
                          <Button 
                            variant="link" 
                            className="px-0 h-auto" 
                            asChild
                          >
                            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                              Get Tickets
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <h3 className="font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground">
                    This artist doesn't have any upcoming events.
                  </p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="compatibility" className="mt-4">
              <Card className="p-8">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Artist compatibility analysis will be available soon.
                  </p>
                  <Button>Analyze Compatibility</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;