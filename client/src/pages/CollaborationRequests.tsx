import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Check, X, MessageSquare, ArrowUpRight } from 'lucide-react';

const CollaborationRequests = () => {
  const [requestType, setRequestType] = useState<'received' | 'sent'>('received');

  // Get artists to display names
  const { data: artists } = useQuery({
    queryKey: ['/api/artists'],
    queryFn: async () => {
      const response = await fetch('/api/artists');
      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }
      return response.json();
    }
  });

  // Get received collaboration requests
  const { 
    data: receivedRequests,
    isLoading: isLoadingReceived
  } = useQuery({
    queryKey: ['/api/collaboration-requests', 'received'],
    queryFn: async () => {
      // In a real app, we would use the current user's artist ID
      const response = await fetch('/api/collaboration-requests?artistId=art1&type=received');
      if (!response.ok) {
        throw new Error('Failed to fetch received requests');
      }
      return response.json();
    },
    enabled: requestType === 'received'
  });

  // Get sent collaboration requests
  const { 
    data: sentRequests,
    isLoading: isLoadingSent
  } = useQuery({
    queryKey: ['/api/collaboration-requests', 'sent'],
    queryFn: async () => {
      // In a real app, we would use the current user's artist ID
      const response = await fetch('/api/collaboration-requests?artistId=art1&type=sent');
      if (!response.ok) {
        throw new Error('Failed to fetch sent requests');
      }
      return response.json();
    },
    enabled: requestType === 'sent'
  });

  // Get events to display details
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    }
  });

  const renderRequestCard = (request: any, isReceived: boolean) => {
    const otherArtistId = isReceived 
      ? request.requestingArtistId 
      : request.receivingArtistId;
    
    const artist = artists?.find((a: any) => a.id === otherArtistId);
    const event = events?.find((e: any) => e.id === request.eventId);
    
    return (
      <Card key={request.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {artist?.imageUrl ? (
                  <AvatarImage src={artist.imageUrl} alt={artist.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {artist?.name?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{artist?.name || 'Unknown Artist'}</CardTitle>
                <CardDescription>
                  {isReceived ? 'Sent you a request' : 'You sent a request'}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={
                request.status === 'pending' ? 'outline' : 
                request.status === 'accepted' ? 'secondary' : 
                'destructive'
              }
              className="capitalize"
            >
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {request.message && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{request.message}</p>
            </div>
          )}
          
          {event && (
            <div className="p-3 rounded-md bg-muted">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium">{event.venueName}</h4>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(event.eventDate).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {event.venueCity}, {event.venueState || event.venueCountry}
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            {request.status === 'pending' && isReceived && (
              <>
                <Button variant="outline" size="sm" className="gap-1">
                  <X className="h-4 w-4" />
                  Decline
                </Button>
                <Button size="sm" className="gap-1">
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
              </>
            )}
            
            {!isReceived && request.status === 'pending' && (
              <Button variant="outline" size="sm" className="gap-1 text-destructive">
                <X className="h-4 w-4" />
                Cancel Request
              </Button>
            )}
            
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link href={`/artists/${otherArtistId}`}>
                View Artist
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestSkeleton = () => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        
        <Skeleton className="h-20 w-full rounded-md mb-4" />
        
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Collaboration Requests</h1>
          <p className="text-muted-foreground">
            Manage your collaboration requests with other artists
          </p>
        </div>
        
        <Button className="gap-2">
          <MessageSquare className="h-4 w-4" />
          New Request
        </Button>
      </div>
      
      <Tabs defaultValue="received" onValueChange={(value) => setRequestType(value as 'received' | 'sent')}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {isLoadingReceived ? (
            Array(3).fill(0).map((_, i) => renderRequestSkeleton())
          ) : receivedRequests?.length > 0 ? (
            receivedRequests.map((request: any) => renderRequestCard(request, true))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="font-semibold mb-2">No Requests Received</h3>
              <p className="text-muted-foreground mb-4">
                You haven't received any collaboration requests yet.
              </p>
              <Button asChild>
                <Link href="/artists/discovery">
                  Discover Artists
                </Link>
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sent">
          {isLoadingSent ? (
            Array(3).fill(0).map((_, i) => renderRequestSkeleton())
          ) : sentRequests?.length > 0 ? (
            sentRequests.map((request: any) => renderRequestCard(request, false))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="font-semibold mb-2">No Requests Sent</h3>
              <p className="text-muted-foreground mb-4">
                You haven't sent any collaboration requests yet.
              </p>
              <Button asChild>
                <Link href="/artists/discovery">
                  Discover Artists
                </Link>
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborationRequests;