import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Calendar, 
  Users, 
  MessageSquare, 
  Zap, 
  Flame, 
  Star,
  ArrowUpRight,
  Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ArtistCardProps {
  id: string;
  name: string;
  genres?: string[] | null;
  imageUrl?: string | null;
  compatibility?: number;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ id, name, genres, imageUrl, compatibility }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square w-full bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Music className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        {compatibility !== undefined && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1 font-semibold">
              <Star className="h-3 w-3 fill-current" />
              {compatibility}% Match
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg truncate">{name}</CardTitle>
        <CardDescription className="truncate">
          {genres && genres.length > 0 
            ? genres.slice(0, 3).join(', ')
            : 'No genres'
          }
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button asChild className="w-full gap-1">
          <Link href={`/artists/${id}`}>
            View Profile
            <ArrowUpRight size={14} />
          </Link>
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
  collaborationOpen?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ id, artistName, venueName, location, date, collaborationOpen }) => {
  const eventDate = new Date(date);
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(eventDate);
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">{artistName}</CardTitle>
          {collaborationOpen && (
            <Badge variant="success" className="text-xs">Open for Collab</Badge>
          )}
        </div>
        <CardDescription className="truncate">{venueName}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Globe size={14} className="text-muted-foreground" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button asChild className="w-full gap-1">
          <Link href={`/events/${id}`}>
            View Details
            <ArrowUpRight size={14} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

interface RequestCardProps {
  id: number;
  artistName: string;
  message: string;
  type: 'received' | 'sent';
  status: string;
}

const RequestCard: React.FC<RequestCardProps> = ({ id, artistName, message, type, status }) => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">
            {type === 'received' ? 'From' : 'To'}: {artistName}
          </CardTitle>
          <Badge 
            variant={
              status === 'pending' ? 'outline' : 
              status === 'accepted' ? 'success' : 
              'destructive'
            }
            className="text-xs"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="text-sm line-clamp-3">{message}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button asChild className="w-full gap-1">
          <Link href={`/collaborations/${id}`}>
            View Request
            <ArrowUpRight size={14} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { data: artists, isLoading: isLoadingArtists } = useQuery({ 
    queryKey: ['/api/artists'],
    queryFn: async () => {
      const response = await fetch('/api/artists?limit=3');
      if (!response.ok) throw new Error('Failed to fetch artists');
      return response.json();
    }
  });

  const { data: eventData, isLoading: isLoadingEvents } = useQuery({ 
    queryKey: ['/api/events'],
    queryFn: async () => {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);
      
      const response = await fetch(`/api/events?startDate=${today.toISOString()}&endDate=${threeMonthsFromNow.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const { data: compatibleArtists, isLoading: isLoadingCompatible } = useQuery({ 
    queryKey: ['/api/artists/art1/compatibility'],
    queryFn: async () => {
      // In a real app we'd get the current user's artist ID
      const response = await fetch('/api/artists/art1/compatibility?minScore=50');
      if (!response.ok) throw new Error('Failed to fetch compatible artists');
      return response.json();
    },
    enabled: !!artists // Only run this query once we have artists data
  });

  const { data: collaborationRequests, isLoading: isLoadingRequests } = useQuery({ 
    queryKey: ['/api/collaboration-requests'],
    queryFn: async () => {
      // In a real app we'd get the current user's artist ID
      const response = await fetch('/api/collaboration-requests?artistId=art1&type=received');
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    }
  });

  const { data: opportunities, isLoading: isLoadingOpportunities } = useQuery({ 
    queryKey: ['/api/artists/art1/collaboration-opportunities'],
    queryFn: async () => {
      // In a real app we'd get the current user's artist ID
      const response = await fetch('/api/artists/art1/collaboration-opportunities?maxDistance=100');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      return response.json();
    }
  });

  const { data: statistics, isLoading: isLoadingStats } = useQuery({ 
    queryKey: ['/api/artists/art1/statistics'],
    queryFn: async () => {
      // In a real app we'd get the current user's artist ID
      const response = await fetch('/api/artists/art1/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    }
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">View your collaboration opportunities and activity</p>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <h3 className="text-2xl font-bold">{statistics?.upcomingEvents || 0}</h3>
            )}
            <p className="text-xs text-muted-foreground">Upcoming Events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <h3 className="text-2xl font-bold">{statistics?.pendingRequests || 0}</h3>
            )}
            <p className="text-xs text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-2">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            {isLoadingOpportunities ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <h3 className="text-2xl font-bold">{opportunities?.length || 0}</h3>
            )}
            <p className="text-xs text-muted-foreground">Opportunities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-2">
              <Star className="h-5 w-5 text-primary" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <h3 className="text-2xl font-bold">{statistics?.totalCompatibleArtists || 0}</h3>
            )}
            <p className="text-xs text-muted-foreground">Compatible Artists</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="artists">
        <TabsList className="mb-6">
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <Users size={16} />
            Compatible Artists
          </TabsTrigger>
          
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <Zap size={16} />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Collaboration Requests
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="artists" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Compatible Artists</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/artists/discovery">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {isLoadingCompatible ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : compatibleArtists?.length > 0 ? (
              compatibleArtists.slice(0, 3).map((item: any) => (
                <ArtistCard 
                  key={item.artist.id}
                  id={item.artist.id}
                  name={item.artist.name}
                  genres={item.artist.genres}
                  imageUrl={item.artist.imageUrl}
                  compatibility={item.compatibility.compatibilityScore}
                />
              ))
            ) : (
              <div className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No compatible artists found</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/artists/discovery">Discover Artists</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        
        
        <TabsContent value="opportunities" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Collaboration Opportunities</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/artists/discovery">Find More</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {isLoadingOpportunities ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : opportunities?.length > 0 ? (
              opportunities.slice(0, 3).map((opp: any) => (
                <EventCard 
                  key={opp.event.id}
                  id={opp.event.id}
                  artistName={opp.artist.name}
                  venueName={opp.event.venueName}
                  location={`${opp.event.venueCity}, ${opp.event.venueState || ''}`}
                  date={opp.event.eventDate}
                  collaborationOpen={opp.event.collaborationOpen}
                />
              ))
            ) : (
              <div className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No collaboration opportunities found</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/artists/discovery">Find Opportunities</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Collaboration Requests</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/collaborations">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {isLoadingRequests ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : collaborationRequests?.length > 0 ? (
              collaborationRequests.slice(0, 3).map((req: any) => (
                <RequestCard 
                  key={req.id}
                  id={req.id}
                  artistName={artists?.find((a: any) => a.id === req.requestingArtistId)?.name || "Unknown Artist"}
                  message={req.message || "No message provided."}
                  type="received"
                  status={req.status}
                />
              ))
            ) : (
              <div className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No collaboration requests found</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/artists/discovery">Find Artists to Collaborate With</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { Dashboard };