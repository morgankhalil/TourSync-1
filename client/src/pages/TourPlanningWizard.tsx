import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tour, TourDate, Venue, Band } from '@/types';
import { useTours } from '@/hooks/useTours';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';
import TourOptimizationPanel from '@/components/tour/TourOptimizationPanel';

const TourPlanningWizard = () => {
  const [, setLocation] = useLocation();
  const { tourId } = useParams();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [tourName, setTourName] = useState('');
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDate | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBandId, setCurrentBandId] = useState<number | null>(null);

  // Fetch bands to get current band
  const { data: bands = [] as Band[] } = useQuery<Band[]>({
    queryKey: ['/api/bands'],
  });

  // Set current band ID (in real app this would come from auth context)
  useEffect(() => {
    if (bands && bands.length > 0) {
      setCurrentBandId(bands[0].id);
    }
  }, [bands]);

  // Fetch tour details if editing an existing tour
  const { data: tourDetails } = useQuery({
    queryKey: ['/api/tours', tourId],
    queryFn: async () => {
      if (!tourId) return null;
      const response = await fetch(`/api/tours/${tourId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!tourId,
  });

  // Fetch tour dates if editing an existing tour
  const { data: existingTourDates = [] } = useQuery({
    queryKey: ['/api/tours', tourId, 'dates'],
    queryFn: async () => {
      if (!tourId) return [];
      const response = await fetch(`/api/tours/${tourId}/dates`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tourId,
  });

  // Fetch venues for dropdowns and suggestions
  const { data: venues = [] as Venue[] } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
  });

  // Mutation to create a new tour
  const createTourMutation = useMutation({
    mutationFn: async (newTour: { 
      name: string;
      startDate: Date;
      endDate: Date;
      bandId: number;
      isActive: boolean;
      notes?: string;
    }) => {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTour),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tour');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      return data;
    },
  });

  // Mutation to create tour dates
  const createTourDateMutation = useMutation({
    mutationFn: async (newTourDate: {
      tourId: number;
      date: Date;
      city: string;
      state: string;
      venueId?: number;
      status: string;
      venueName?: string;
      isOpenDate: boolean;
      notes?: string;
    }) => {
      const response = await fetch('/api/tour-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTourDate),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tour date');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
    },
  });

  // Set up initial state when editing an existing tour
  useEffect(() => {
    if (tourDetails && tourId) {
      setIsEditing(true);
      setTourName(tourDetails.name);
      
      if (tourDetails.startDate && tourDetails.endDate) {
        const startDate = new Date(tourDetails.startDate);
        const endDate = new Date(tourDetails.endDate);
        
        // Create an array of dates between start and end
        const dateRange: Date[] = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          dateRange.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setSelectedDates(dateRange);
      }
    }
  }, [tourDetails, tourId]);

  // Update tour dates when existing tour dates are loaded
  useEffect(() => {
    if (existingTourDates && existingTourDates.length > 0) {
      setTourDates(existingTourDates);
    }
  }, [existingTourDates]);

  // Create empty tour date slots when dates are selected
  useEffect(() => {
    if (selectedDates.length > 0 && !isEditing) {
      const newTourDates = selectedDates.map((date, index) => ({
        id: index,
        date: date.toISOString(),
        city: '',
        state: '',
        status: 'open',
        tourId: 0, // This will be updated after tour creation
        isOpenDate: true,
        notes: '',
      }));
      
      setTourDates(newTourDates);
    }
  }, [selectedDates, isEditing]);

  const handleDragEnd = (result: any) => {
    // Dropped outside a droppable area
    if (!result.destination) {
      return;
    }
    
    // Reorder the tour dates
    const items = Array.from(tourDates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the dates based on the new order
    const updatedItems = items.map((item, index) => {
      if (selectedDates.length > 0) {
        const startDate = selectedDates[0];
        const newDate = addDays(startDate, index);
        return { ...item, date: newDate.toISOString() };
      }
      return item;
    });
    
    setTourDates(updatedItems);
  };

  const handleVenueSearch = async (city: string, state: string, date: string | Date) => {
    if (!venues || venues.length === 0) return;
    
    // In a real app, this would be a backend call to find venues with availability
    // For now, we'll filter venues by city/state
    const filteredVenues = venues.filter(venue => 
      venue.city.toLowerCase().includes(city.toLowerCase()) ||
      venue.state.toLowerCase().includes(state.toLowerCase())
    );
    
    setAvailableVenues(filteredVenues);
    setShowVenueDialog(true);
  };

  const handleSelectVenue = (venue: Venue) => {
    if (!selectedTourDate) return;
    
    const updatedTourDates = tourDates.map(td => {
      if (td.id === selectedTourDate.id) {
        return {
          ...td,
          venueId: venue.id,
          venueName: venue.name,
          city: venue.city,
          state: venue.state,
          isOpenDate: false,
          status: 'pending',
        };
      }
      return td;
    });
    
    setTourDates(updatedTourDates);
    setShowVenueDialog(false);
  };

  const handleTourDateUpdate = (id: number, field: string, value: string) => {
    const updatedTourDates = tourDates.map(td => {
      if (td.id === id) {
        return { ...td, [field]: value };
      }
      return td;
    });
    
    setTourDates(updatedTourDates);
  };

  const handleSaveTour = async () => {
    if (!currentBandId || !selectedDates.length) return;
    
    // Make sure we're on the review step
    if (currentStep !== 4) {
      setCurrentStep(4);
      return;
    }
    
    try {
      // Create the tour first
      const newTour = {
        name: tourName,
        startDate: selectedDates[0],
        endDate: selectedDates[selectedDates.length - 1],
        bandId: currentBandId,
        isActive: true,
        notes: 'Created using tour planning wizard',
      };
      
      const createdTour = await createTourMutation.mutateAsync(newTour);
      
      // Then create all the tour dates
      const tourDatePromises = tourDates.map(td => 
        createTourDateMutation.mutateAsync({
          tourId: createdTour.id,
          date: new Date(td.date),
          city: td.city,
          state: td.state,
          venueId: td.venueId,
          status: td.status,
          venueName: td.venueName,
          isOpenDate: td.isOpenDate,
          notes: td.notes,
        })
      );
      
      await Promise.all(tourDatePromises);
      
      // Navigate to the tour view after successful creation
      setLocation('/');
    } catch (error) {
      console.error('Error saving tour:', error);
    }
  };

  const { toast } = useToast();
  
  const handleNextStep = () => {
    if (currentStep === 2 && tourDates.length === 0) {
      toast({
        title: "No tour dates",
        description: "Please add at least one tour date before proceeding",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Render different steps of the wizard
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 1: Basic Tour Information</h2>
              <p className="text-muted-foreground">Let's start with some basic details about your tour.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tourName">Tour Name</Label>
                <Input 
                  id="tourName" 
                  placeholder="e.g., Summer Tour 2025" 
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Tour Dates</Label>
                <div className="border rounded-md p-4">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    className="rounded-md border"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedDates.length} days selected. From {selectedDates.length ? format(selectedDates[0], 'PP') : '–'} to {selectedDates.length ? format(selectedDates[selectedDates.length - 1], 'PP') : '–'}.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleNextStep} disabled={!tourName || selectedDates.length === 0}>
                Next: Plan Tour Dates
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 2: Plan Your Tour Dates</h2>
              <p className="text-muted-foreground">
                Drag and drop to reorder. Click on a date to add venue and details.
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tourDates">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {tourDates.map((tourDate, index) => (
                      <Draggable key={tourDate.id} draggableId={`date-${tourDate.id}`} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`border ${tourDate.status === 'confirmed' ? 'border-green-500' : tourDate.status === 'pending' ? 'border-yellow-500' : 'border-red-500'}`}
                          >
                            <CardHeader className="p-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">{format(new Date(tourDate.date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  tourDate.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                  tourDate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tourDate.status.charAt(0).toUpperCase() + tourDate.status.slice(1)}
                                </span>
                              </div>
                              {tourDate.venueName ? (
                                <CardDescription>
                                  {tourDate.venueName} • {tourDate.city}, {tourDate.state}
                                </CardDescription>
                              ) : (
                                <CardDescription className="text-muted-foreground italic">
                                  No venue selected
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`city-${tourDate.id}`} className="text-xs">City</Label>
                                  <Input
                                    id={`city-${tourDate.id}`}
                                    placeholder="City"
                                    className="mt-1"
                                    value={tourDate.city}
                                    onChange={(e) => handleTourDateUpdate(tourDate.id, 'city', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`state-${tourDate.id}`} className="text-xs">State</Label>
                                  <Input
                                    id={`state-${tourDate.id}`}
                                    placeholder="State"
                                    className="mt-1"
                                    value={tourDate.state}
                                    onChange={(e) => handleTourDateUpdate(tourDate.id, 'state', e.target.value)}
                                  />
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedTourDate(tourDate);
                                  handleVenueSearch(tourDate.city, tourDate.state, tourDate.date);
                                }}
                              >
                                Find Venue
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={tourDate.isOpenDate ? 'text-red-500' : 'text-gray-500'}
                                onClick={() => {
                                  const updatedTourDates = tourDates.map(td => {
                                    if (td.id === tourDate.id) {
                                      return {
                                        ...td,
                                        isOpenDate: !td.isOpenDate,
                                        status: td.isOpenDate ? 'pending' : 'open',
                                      };
                                    }
                                    return td;
                                  });
                                  setTourDates(updatedTourDates);
                                }}
                              >
                                {tourDate.isOpenDate ? 'Open Date' : 'Mark as Open'}
                              </Button>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next: Optimize Tour
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 3: Optimize Your Tour</h2>
              <p className="text-muted-foreground">
                Find venues to fill tour gaps and optimize your routing.
              </p>
            </div>
            
            <TourOptimizationPanel 
              tour={tourDetails || null}
              tourDates={tourDates}
              onSelectVenue={(venue) => {
                // Find the first open date to assign this venue to
                const openTourDateIndex = tourDates.findIndex(td => 
                  td.isOpenDate || td.status === 'open' || !td.venueId
                );
                
                if (openTourDateIndex >= 0) {
                  const updatedTourDates = [...tourDates];
                  updatedTourDates[openTourDateIndex] = {
                    ...updatedTourDates[openTourDateIndex],
                    venueId: venue.id,
                    venueName: venue.name,
                    city: venue.city,
                    state: venue.state,
                    isOpenDate: false,
                    status: 'pending',
                  };
                  setTourDates(updatedTourDates);
                }
              }}
            />
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next: Review Tour
              </Button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 4: Review & Save Tour</h2>
              <p className="text-muted-foreground">Review your tour details before saving.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{tourName}</CardTitle>
                <CardDescription>
                  {selectedDates.length} days • {format(selectedDates[0], 'MMM d, yyyy')} to {format(selectedDates[selectedDates.length - 1], 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Tour Stats</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="border rounded-md p-3 text-center">
                        <div className="text-2xl font-bold">{tourDates.length}</div>
                        <div className="text-sm text-muted-foreground">Total Dates</div>
                      </div>
                      <div className="border rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {tourDates.filter(td => td.status === 'confirmed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Confirmed</div>
                      </div>
                      <div className="border rounded-md p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {tourDates.filter(td => td.isOpenDate).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Open Dates</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Tour Dates</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {tourDates.map((td) => (
                        <div key={td.id} className="flex justify-between p-2 border rounded-md">
                          <div>
                            <div className="font-medium">{format(new Date(td.date), 'EEE, MMM d')}</div>
                            <div className="text-sm text-muted-foreground">
                              {td.venueName ? `${td.venueName} • ${td.city}, ${td.state}` : 'No venue selected'}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs self-center ${
                            td.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            td.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {td.status.charAt(0).toUpperCase() + td.status.slice(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePreviousStep}>
                  Back
                </Button>
                <Button onClick={handleSaveTour}>
                  {isEditing ? 'Update Tour' : 'Save Tour'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container py-8 max-w-4xl h-screen overflow-y-auto pb-32">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tour Planning Wizard</h1>
        <p className="text-muted-foreground">Create and manage your tour in a few easy steps.</p>
      </div>
      
      <div className="space-y-6">
        <div className="border rounded-md p-4 bg-muted/50">
          <div className="flex justify-between">
            <div className="flex space-x-4 md:space-x-8">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <span className="text-sm mt-1">Details</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className="text-sm mt-1">Schedule</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <span className="text-sm mt-1">Optimize</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  4
                </div>
                <span className="text-sm mt-1">Review</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pb-20">
          {renderStep()}
        </div>
      </div>
      
      <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Venue</DialogTitle>
            <DialogDescription>
              Choose a venue for your tour date. These venues are available on your selected date.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            {availableVenues.length > 0 ? (
              availableVenues.map((venue) => (
                <Card key={venue.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectVenue(venue)}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <CardDescription>
                      {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between text-sm">
                      <span>Capacity: {venue.capacity || 'Not specified'}</span>
                      <span>Genre: {venue.genre || 'Any'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No venues found matching your criteria.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVenueDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourPlanningWizard;