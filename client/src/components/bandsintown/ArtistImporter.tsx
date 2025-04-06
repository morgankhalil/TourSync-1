import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BandsintownUpdate {
  artist: any;
  events: any[];
  timestamp: string;
}

export function ArtistImporter() {
  const [artistName, setArtistName] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [updates, setUpdates] = useState<BandsintownUpdate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8080`);

    ws.onopen = () => {
      setSocket(ws);
      toast({
        title: 'Connected',
        description: 'Real-time updates enabled',
      });
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setUpdates(prev => [update, ...prev]);
    };

    ws.onclose = () => {
      setSocket(null);
      toast({
        title: 'Disconnected',
        description: 'Real-time updates disabled',
        variant: 'destructive',
      });
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSubscribe = () => {
    if (!artistName.trim() || !socket) return;

    socket.send(JSON.stringify({
      type: 'subscribe',
      artistName: artistName.trim()
    }));

    toast({
      title: 'Subscribed',
      description: `Now tracking ${artistName}`,
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Real-time Bandsintown Updates</CardTitle>
        <CardDescription>
          Get live updates from Bandsintown for your favorite artists
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

        <div className="border rounded-md p-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Live Updates</h3>
          <div className="space-y-3">
            {updates.map((update, idx) => (
              <div key={idx} className="p-3 rounded-md bg-green-50 border border-green-200">
                <div className="flex justify-between">
                  <h4 className="font-medium">{update.artist.name}</h4>
                  <span className="text-sm text-muted-foreground">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  Upcoming shows: {update.events.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {socket ? '🟢 Connected' : '🔴 Disconnected'} - Real-time updates from Bandsintown
        </p>
      </CardFooter>
    </Card>
  );
}