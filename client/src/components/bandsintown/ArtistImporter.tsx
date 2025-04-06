import React, { useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ImportResponse {
  artist: string;
  success: boolean;
  message: string;
  band?: {
    id: number;
    name: string;
    description: string;
  };
  tour?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export function ArtistImporter() {
  const [artistName, setArtistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importedArtists, setImportedArtists] = useState<ImportResponse[]>([]);
  const { toast } = useToast();

  // Single artist import
  const handleImportArtist = async () => {
    if (!artistName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an artist name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/api/bandsintown/import/artist', { 
        artistName: artistName.trim() 
      });
      
      const result = {
        artist: artistName,
        success: true,
        message: `Successfully imported ${artistName}`,
        band: response.data.data.band,
        tour: response.data.data.tour
      };
      
      setImportedArtists(prev => [result, ...prev]);
      
      toast({
        title: 'Success!',
        description: `Imported ${artistName} successfully`,
      });
      
      setArtistName('');
    } catch (error: any) {
      console.error('Error importing artist:', error);
      
      const errorResponse = {
        artist: artistName,
        success: false,
        message: error.response?.data?.error || 'Failed to import artist',
      };
      
      setImportedArtists(prev => [errorResponse, ...prev]);
      
      toast({
        title: 'Import Failed',
        description: `Could not import ${artistName}. ${error.response?.data?.error || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Batch import multiple artists
  const handleBatchImport = async () => {
    const popularRockBands = [
      'Foo Fighters', 
      'Radiohead', 
      'The Killers', 
      'Arctic Monkeys', 
      'Muse'
    ];
    
    try {
      setIsLoading(true);
      const response = await axios.post('/api/bandsintown/import/batch', { 
        artistNames: popularRockBands 
      });
      
      const results = response.data.data.map((result: any) => ({
        artist: result.artistName,
        success: result.success,
        message: result.success 
          ? `Successfully imported ${result.artistName}` 
          : `Failed to import ${result.artistName}`,
        band: result.band,
        tour: result.tour
      }));
      
      setImportedArtists(prev => [...results, ...prev]);
      
      toast({
        title: 'Batch Import Complete',
        description: `Imported ${response.data.data.filter((r: any) => r.success).length} out of ${popularRockBands.length} artists`,
      });
    } catch (error: any) {
      console.error('Error batch importing artists:', error);
      
      toast({
        title: 'Batch Import Failed',
        description: error.response?.data?.error || 'Failed to import artists batch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Import Artists from Bandsintown</CardTitle>
        <CardDescription>
          Search for and import artists along with their tour data from Bandsintown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Enter artist name (e.g., Radiohead)"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleImportArtist()}
          />
          <Button onClick={handleImportArtist} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Artist'
            )}
          </Button>
        </div>
        
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={handleBatchImport} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Batch...
              </>
            ) : (
              'Import Popular Rock Bands'
            )}
          </Button>
        </div>

        <div className="border rounded-md p-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Import Results</h3>
          {importedArtists.length === 0 ? (
            <p className="text-muted-foreground">No imports yet. Use the form above to import artists.</p>
          ) : (
            <div className="space-y-3">
              {importedArtists.map((result, idx) => (
                <div 
                  key={`${result.artist}-${idx}`} 
                  className={`p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{result.artist}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {result.band && (
                    <p className="text-sm mt-1">
                      Band ID: {result.band.id}, Name: {result.band.name}
                    </p>
                  )}
                  {result.tour && (
                    <p className="text-sm mt-1">
                      Tour: {result.tour.name} ({result.tour.startDate} to {result.tour.endDate})
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Powered by Bandsintown API. Imported data is saved to the database.
        </p>
      </CardFooter>
    </Card>
  );
}