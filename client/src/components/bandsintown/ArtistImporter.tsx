import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface ArtistUpdate {
  type: 'artist' | 'event';
  data: any;
  timestamp: string;
}

export function ArtistImporter() {
  const [artistName, setArtistName] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [subscribedArtists, setSubscribedArtists] = useState<string[]>([]);
  const [updates, setUpdates] = useState<ArtistUpdate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//0.0.0.0:8080`);

    ws.onopen = () => {
      setSocket(ws);
      toast({
        title: 'Connected',
        description: 'Real-time updates enabled',
      });

      // Resubscribe to artists after reconnection
      subscribedArtists.forEach(artist => {
        ws.send(JSON.stringify({ type: 'subscribe', artistName: artist }));
      });
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setUpdates(prev => [update, ...prev].slice(0, 50)); // Keep last 50 updates
    };

    ws.onclose = () => {
      setSocket(null);
      toast({ title: 'Disconnected', description: 'Real-time updates disabled', variant: 'destructive' });
    };

    return () => {
      if (ws) ws.close();
    };
  }, [subscribedArtists]); // Ensure subscribedArtists is correctly referenced

  const handleSubscribe = () => {
    if (!artistName.trim() || !socket) return;

    socket.send(JSON.stringify({ type: 'subscribe', artistName: artistName.trim() }));
    setSubscribedArtists(prev => [...prev, artistName.trim()]);
    setArtistName('');

    toast({ title: 'Subscribed', description: `Now tracking ${artistName}` });
  };

  const handleUnsubscribe = (artist: string) => {
    if (!socket) return;

    socket.send(JSON.stringify({ type: 'unsubscribe', artistName: artist }));
    setSubscribedArtists(prev => prev.filter(a => a !== artist));

    toast({ title: 'Unsubscribed', description: `Stopped tracking ${artist}` });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Real-time Artist Updates</CardTitle>
        <CardDescription>
          Get live updates from Bandsintown for your subscribed artists
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Enter artist name (e.g., Radiohead)"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
          />
          <Button onClick={handleSubscribe} disabled={!socket}>
            Subscribe
          </Button>
        </div>

        {subscribedArtists.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Subscribed Artists</h3>
            <div className="flex flex-wrap gap-2">
              {subscribedArtists.map(artist => (
                <Badge 
                  key={artist}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleUnsubscribe(artist)}
                >
                  {artist} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {updates.map((update, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-md ${
                  update.type === 'artist' ? 'bg-primary/10' : 'bg-secondary/10'
                } border`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={update.type === 'artist' ? 'default' : 'secondary'}>
                      {update.type === 'artist' ? 'Artist Update' : 'New Event'}
                    </Badge>
                    <h4 className="font-medium mt-1">{update.data.name}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(update.timestamp), 'HH:mm:ss')}
                  </span>
                </div>

                {update.type === 'event' && (
                  <div className="mt-2 text-sm">
                    <p>Venue: {update.data.venue.name}</p>
                    <p>Date: {format(new Date(update.data.datetime), 'PPP')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {socket ? '🟢 Connected' : '🔴 Disconnected'} - Real-time updates from Bandsintown
        </p>
      </CardFooter>
    </Card>
  );
}