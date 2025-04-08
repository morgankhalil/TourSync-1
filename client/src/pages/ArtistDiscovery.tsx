import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Music, 
  Search, 
  Loader2, 
  Star, 
  PlusCircle, 
  Calendar, 
  MapPin,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalArtist } from '@shared/schema';

interface ArtistCardProps {
  artist: ExternalArtist;
  onImport?: () => void;
  isImporting?: boolean;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onImport, isImporting }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square w-full bg-muted relative overflow-hidden">
        {artist.image_url ? (
          <img 
            src={artist.image_url} 
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Music className="h-12 w-12 text-primary/50" />
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg truncate">{artist.name}</CardTitle>
        <CardDescription className="truncate">
          {artist.genres && artist.genres.length > 0 
            ? artist.genres.slice(0, 3).join(', ')
            : 'No genres'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-2">
        {artist.draw_size && (
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={14} className="text-muted-foreground" />
            <span>Typical audience: {artist.draw_size}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button 
          onClick={onImport} 
          disabled={isImporting} 
          className="w-full gap-1"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Import Artist
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

interface EventCardProps {
  id: string;
  artistName: string;
  venueName: string;
  location: string;
  date: string;
}

const EventCard: React.FC<EventCardProps> = ({ id, artistName, venueName, location, date }) => {
  const eventDate = new Date(date);
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(eventDate);
  
  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{artistName}</h3>
          <p className="text-sm text-muted-foreground">{venueName}</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {formattedDate}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <MapPin size={14} className="text-muted-foreground" />
        <span className="truncate">{location}</span>
      </div>
    </Card>
  );
};

const ArtistDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [artistId, setArtistId] = useState('');
  const { toast } = useToast();
  
  // Search for artists (from Bandsintown)
  const { 
    data: searchResults, 
    isLoading: isSearching,
    refetch: searchArtists
  } = useQuery({
    queryKey: ['bandsintown', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      try {
        const response = await fetch(`/api/bandsintown/artist/${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to search for artists');
        }
        return response.json();
      } catch (error) {
        console.error('Error searching artists:', error);
        return [];
      }
    },
    enabled: false // Don't run automatically
  });
  
  // Get artist events (from Bandsintown)
  const { 
    data: artistEvents, 
    isLoading: isLoadingEvents 
  } = useQuery({
    queryKey: ['bandsintown', 'events', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      try {
        const response = await fetch(`/api/bandsintown/artist/${encodeURIComponent(artistId)}/events`);
        if (!response.ok) {
          throw new Error('Failed to fetch artist events');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
    enabled: !!artistId // Only run when we have an artistId
  });
  
  // Get compatible artists
  const { 
    data: compatibleArtists, 
    isLoading: isLoadingCompatible 
  } = useQuery({
    queryKey: ['/api/artists/art1/compatibility'],
    queryFn: async () => {
      // In a real app we'd get the current user's artist ID
      const response = await fetch('/api/artists/art1/compatibility?minScore=50');
      if (!response.ok) {
        throw new Error('Failed to fetch compatible artists');
      }
      return response.json();
    }
  });
  
  // Import artist mutation
  const { mutate: importArtist, isPending: isImporting } = useMutation({
    mutationFn: async (artist: ExternalArtist) => {
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          imageUrl: artist.image_url,
          url: artist.url,
          website: artist.website,
          drawSize: artist.draw_size
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to import artist');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Artist Imported",
        description: `${data.name} has been successfully imported.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchArtists();
    }
  };
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Artist Discovery</h1>
      <p className="text-muted-foreground mb-8">
        Find and connect with artists for potential collaborations
      </p>
      
      <Tabs defaultValue="search" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search size={16} />
            Search New Artists
          </TabsTrigger>
          <TabsTrigger value="compatible" className="flex items-center gap-2">
            <Star size={16} />
            Compatible Artists
          </TabsTrigger>
          <TabsTrigger value="tours" className="flex items-center gap-2">
            <Calendar size={16} />
            Upcoming Tours
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search for Artists</CardTitle>
              <CardDescription>
                Search for artists on Bandsintown and import them into your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search by artist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {searchResults.map((artist: ExternalArtist) => (
                <ArtistCard 
                  key={artist.id}
                  artist={artist}
                  onImport={() => importArtist(artist)}
                  isImporting={isImporting}
                />
              ))}
            </div>
          ) : searchResults && searchResults.length === 0 && !isSearching ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No artists found. Try a different search term.
              </p>
            </Card>
          ) : isSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Search for an artist to see results.
              </p>
            </Card>
          ) : null}
          
          {artistId && (
            <>
              <h2 className="text-xl font-semibold mt-12 mb-4">
                Upcoming Events for {searchResults?.find((a: any) => a.id === artistId)?.name}
              </h2>
              
              <div className="space-y-4">
                {isLoadingEvents ? (
                  Array(3).fill(0).map((_, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </Card>
                  ))
                ) : artistEvents && artistEvents.length > 0 ? (
                  artistEvents.map((event: any) => (
                    <EventCard 
                      key={event.id}
                      id={event.id}
                      artistName={searchResults?.find((a: any) => a.id === artistId)?.name || ""}
                      venueName={event.venue.name}
                      location={`${event.venue.city}, ${event.venue.region}`}
                      date={event.datetime}
                    />
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No upcoming events found for this artist.
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="compatible">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Most Compatible Artists</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingCompatible ? (
              Array(6).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </Card>
              ))
            ) : compatibleArtists?.length > 0 ? (
              compatibleArtists.map((item: any) => (
                <Card key={item.artist.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <Avatar className="h-16 w-16">
                      {item.artist.imageUrl ? (
                        <AvatarImage src={item.artist.imageUrl} alt={item.artist.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {item.artist.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.artist.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.artist.genres && item.artist.genres.length > 0 
                          ? item.artist.genres.slice(0, 3).join(', ')
                          : 'No genres'
                        }
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Users size={14} className="text-muted-foreground" />
                        <span className="text-sm">
                          {item.artist.drawSize || 'Unknown'} audience
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="rounded-full bg-primary/10 h-12 w-12 flex items-center justify-center">
                        <span className="font-semibold text-primary text-sm">
                          {item.compatibility.compatibilityScore}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Match</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">
                  No compatible artists found yet.
                </p>
                <Button variant="link" className="mt-2">
                  Import artists to find compatibility
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="tours">
          <Card className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Tour Discovery</h3>
            <p className="text-muted-foreground mb-4">
              Find artists with upcoming tours in your area.
            </p>
            <Button>Explore Nearby Tours</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { ArtistDiscovery };