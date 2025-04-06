import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, MapPin, Music, Calendar } from 'lucide-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiRequest } from '@/lib/queryClient';

// Result types
interface ImportResult {
  artistName: string;
  success: boolean;
  band?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  tour?: {
    id: number;
    name: string;
    [key: string]: any;
  };
}

interface VenueResult {
  venueName: string;
  city: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
}

interface ImportedVenue {
  id: number;
  name: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  [key: string]: any;
}

export function BandsintownImport() {
  const { toast } = useToast();
  const [artistInput, setArtistInput] = useState('');
  const [artistsList, setArtistsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const [results, setResults] = useState<Array<ImportResult>>([]);
  const [venueResults, setVenueResults] = useState<VenueResult[]>([]);
  const [importedVenues, setImportedVenues] = useState<ImportedVenue[]>([]);
  const [activeTab, setActiveTab] = useState('artists');

  const handleAddArtist = () => {
    if (!artistInput.trim()) return;
    
    if (!artistsList.includes(artistInput.trim())) {
      setArtistsList([...artistsList, artistInput.trim()]);
      setArtistInput('');
    } else {
      toast({
        title: "Artist already added",
        description: `${artistInput} is already in your list.`,
        variant: "destructive"
      });
    }
  };

  const handleRemoveArtist = (artist: string) => {
    setArtistsList(artistsList.filter(a => a !== artist));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArtist();
    }
  };

  const importArtists = async () => {
    if (artistsList.length === 0) {
      toast({
        title: "No artists to import",
        description: "Please add at least one artist to import.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/bandsintown/import/batch', {
        method: 'POST',
        data: { artistNames: artistsList }
      });

      setResults((response as any).data.data);
      toast({
        title: "Import complete",
        description: (response as any).data.message,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing the artists. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractVenues = async () => {
    if (artistsList.length === 0) {
      toast({
        title: "No artists specified",
        description: "Please add at least one artist to extract venues from.",
        variant: "destructive"
      });
      return;
    }

    setIsVenueLoading(true);
    try {
      const response = await apiRequest('/api/bandsintown/extract-venues', {
        method: 'POST',
        data: { artistNames: artistsList }
      });

      setVenueResults((response as any).data.data);
      toast({
        title: "Venues extracted",
        description: `Successfully extracted ${(response as any).data.data.length} venues.`,
      });
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: "There was an error extracting venues. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVenueLoading(false);
    }
  };

  const importVenues = async () => {
    if (artistsList.length === 0) {
      toast({
        title: "No artists specified",
        description: "Please add at least one artist to import venues from.",
        variant: "destructive"
      });
      return;
    }

    setIsVenueLoading(true);
    try {
      const response = await apiRequest('/api/bandsintown/import-venues', {
        method: 'POST',
        data: { artistNames: artistsList }
      });

      setImportedVenues((response as any).data.data);
      toast({
        title: "Venues imported",
        description: `Successfully imported ${(response as any).data.data.length} venues.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing venues. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVenueLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Import from Bandsintown</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="artists">
              <Music className="h-4 w-4 mr-2" />
              Import Artists & Tours
            </TabsTrigger>
            <TabsTrigger value="venues">
              <MapPin className="h-4 w-4 mr-2" />
              Extract Venues
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="artist-input">Add Artist</Label>
                <Input
                  id="artist-input"
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter artist name"
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddArtist}>Add</Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {artistsList.map(artist => (
                <Badge key={artist} variant="secondary" className="px-3 py-1">
                  {artist}
                  <button 
                    className="ml-2 text-xs hover:text-destructive" 
                    onClick={() => handleRemoveArtist(artist)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {artistsList.length === 0 && (
                <p className="text-muted-foreground text-sm italic">
                  No artists added yet. Add some artists to get started.
                </p>
              )}
            </div>
          </div>
          
          <TabsContent value="artists" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Artists and Tours</CardTitle>
                <CardDescription>
                  Import artists and their tour data from Bandsintown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={importArtists} disabled={isLoading || artistsList.length === 0}>
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    Import Artists and Tours
                  </Button>
                </div>
                
                {results.length > 0 && (
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="font-medium mb-2">Import Results</h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {results.map((result, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center">
                                  {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                  )}
                                  <h4 className="font-medium">{result.artistName}</h4>
                                </div>
                                
                                {result.band && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Band ID: {result.band.id}
                                  </p>
                                )}
                                
                                {result.tour && (
                                  <div className="mt-2 flex items-center">
                                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span className="text-sm">{result.tour.name}</span>
                                  </div>
                                )}
                              </div>
                              
                              <Badge variant={result.success ? "outline" : "destructive"}>
                                {result.success ? "Success" : "Failed"}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="venues" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Extract and Import Venues</CardTitle>
                <CardDescription>
                  Extract venues from artist tour data and import them into your database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Button onClick={extractVenues} disabled={isVenueLoading || artistsList.length === 0}>
                    {isVenueLoading && venueResults.length === 0 ? <Spinner className="mr-2" /> : null}
                    Extract Venues
                  </Button>
                  <Button 
                    onClick={importVenues} 
                    disabled={isVenueLoading || artistsList.length === 0}
                    variant="secondary"
                  >
                    {isVenueLoading && importedVenues.length === 0 ? <Spinner className="mr-2" /> : null}
                    Import Venues
                  </Button>
                </div>
                
                {venueResults.length > 0 && (
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="font-medium mb-2">Extracted Venues</h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {venueResults.map((venue, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-medium">{venue.venueName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {venue.city}, {venue.region}, {venue.country}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {venue.latitude}, {venue.longitude}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                {importedVenues.length > 0 && (
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="font-medium mb-2">Imported Venues</h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {importedVenues.map((venue) => (
                          <Card key={venue.id} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex">
                                <MapPin className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-medium">{venue.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {venue.city}, {venue.state}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {venue.id}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">Imported</Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Note: If a venue already exists in the database with the same location, it will not be duplicated.
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}

export default BandsintownImport;