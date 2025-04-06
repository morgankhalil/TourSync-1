import React, { useState, useEffect } from 'react';
import { Tour, TourDate, Band } from '../../types';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Spinner } from '../ui/spinner';

interface TourDetailModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
}

const TourDetailModal = ({ tour, isOpen, onClose }: TourDetailModalProps) => {
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [band, setBand] = useState<Band | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!tour) return;
    
    async function fetchTourDetails() {
      setIsLoading(true);
      try {
        // Fetch tour dates
        const datesResponse = await fetch(`/api/tours/${tour?.id}/dates`);
        if (!datesResponse.ok) throw new Error('Failed to fetch tour dates');
        const datesData = await datesResponse.json();
        setTourDates(datesData);
        
        // Fetch band details
        const bandResponse = await fetch(`/api/bands/${tour?.bandId}`);
        if (!bandResponse.ok) throw new Error('Failed to fetch band details');
        const bandData = await bandResponse.json();
        setBand(bandData);
      } catch (error) {
        console.error('Error fetching tour details:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTourDetails();
  }, [tour]);

  if (!tour) return null;

  const startDate = new Date(tour.startDate);
  const endDate = new Date(tour.endDate);
  
  // Calculate some basic stats
  const confirmedDates = tourDates.filter(date => date.status === 'confirmed').length;
  const pendingDates = tourDates.filter(date => date.status === 'pending').length;
  const openDates = tourDates.filter(date => date.isOpenDate).length;
  const totalDates = tourDates.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{tour.name}</DialogTitle>
          <DialogDescription>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Tour Details</TabsTrigger>
              <TabsTrigger value="dates">Tour Dates</TabsTrigger>
              <TabsTrigger value="band">Band Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Tour Status</h3>
                  <p>{tour.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Duration</h3>
                  <p>{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Tour Dates Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Confirmed:</span>
                      <Badge variant="secondary" className="bg-green-500 text-white">{confirmedDates}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <Badge variant="secondary" className="bg-yellow-500 text-white">{pendingDates}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Dates:</span>
                      <Badge variant="secondary" className="bg-purple-500 text-white">{openDates}</Badge>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{totalDates}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-sm">{tour.notes || 'No notes available.'}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dates">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tour Schedule</h3>
                
                {tourDates.length > 0 ? (
                  <div className="divide-y">
                    {tourDates.sort((a, b) => 
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    ).map(date => (
                      <div key={date.id} className="py-4 flex items-center">
                        <div className="w-24 font-medium">
                          {new Date(date.date).toLocaleDateString()}
                        </div>
                        
                        <div className="flex-grow px-4">
                          <div className="font-medium">
                            {date.venueName || `${date.city}, ${date.state}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {date.isOpenDate ? 'Open Date' : `${date.city}, ${date.state}`}
                          </div>
                        </div>
                        
                        <div>
                          <Badge className={
                            date.status === 'confirmed' ? 'bg-green-500' :
                            date.status === 'pending' ? 'bg-yellow-500' : 'bg-purple-500'
                          }>
                            {date.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No tour dates have been added yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="band">
              {band ? (
                <div className="space-y-6">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">{band.name}</h3>
                    <p className="mb-4">{band.description || 'No band description available.'}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Contact</h4>
                        <p className="text-sm">{band.contactEmail}</p>
                        {band.contactPhone && <p className="text-sm">{band.contactPhone}</p>}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Genre</h4>
                        <p className="text-sm">{band.genre || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {band.social && Object.keys(band.social).length > 0 && (
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-2">Social Media</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {band.social.website && (
                          <a href={band.social.website} target="_blank" rel="noopener noreferrer" 
                            className="text-primary hover:underline">
                            Website
                          </a>
                        )}
                        {band.social.twitter && (
                          <a href={band.social.twitter} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline">
                            Twitter
                          </a>
                        )}
                        {band.social.instagram && (
                          <a href={band.social.instagram} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline">
                            Instagram
                          </a>
                        )}
                        {band.social.facebook && (
                          <a href={band.social.facebook} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline">
                            Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">No band information available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TourDetailModal;