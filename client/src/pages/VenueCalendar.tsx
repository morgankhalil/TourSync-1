import React, { useState, useMemo } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { X, CalendarIcon, ChevronLeft, ChevronRight, Plus, Music, Check, Ban, CalendarDays, MapPin, Clock, Calendar, MessageSquare } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface CalendarEvent {
  id: number;
  date: Date | string;
  title: string;
  type: 'show' | 'availability' | 'private';
  status: 'confirmed' | 'pending' | 'available' | 'unavailable';
  bandName?: string;
  genre?: string;
  notes?: string;
  tourId?: number;
  city?: string;
  state?: string;
}

export default function VenueCalendar() {
  const { toast } = useToast();
  const { activeVenue } = useActiveVenue();
  
  // State for calendar view and navigation
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState<Date>(new Date());
  
  // Event state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | undefined>(undefined);
  const [newEventType, setNewEventType] = useState<'show' | 'availability' | 'private'>('show');

  // The venue we're currently displaying the calendar for
  const venue = activeVenue;
  
  // Fetch events from the API
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['venue-calendar-events', venue?.id],
    queryFn: async () => {
      if (!venue) return [];
      
      try {
        // Fetch tour dates for the venue
        const response = await fetch(`/api/venues/${venue.id}/dates`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events for venue ${venue.id}`);
        }
        
        const tourDates = await response.json();
        
        // Fetch venue availability
        const availResponse = await fetch(`/api/venues/${venue.id}/availability`);
        let availabilityData: any[] = [];
        
        if (availResponse.ok) {
          availabilityData = await availResponse.json();
        }
        
        // Map tour dates to calendar events
        const tourDateEvents = tourDates.map((date: any) => ({
          id: date.id,
          date: new Date(date.date),
          title: date.venueName || (date.bandId ? `Band #${date.bandId}` : 'Unlabeled Event'),
          type: 'show' as const,
          status: date.status === 'confirmed' ? 'confirmed' as const : 'pending' as const,
          bandName: date.bandId ? `Band #${date.bandId}` : undefined,
          notes: date.notes || undefined,
          tourId: date.tourId,
          city: date.city,
          state: date.state
        }));
        
        // Map venue availability to calendar events
        const availabilityEvents = availabilityData.map((avail: any) => ({
          id: avail.id,
          date: new Date(avail.date),
          title: avail.isAvailable ? 'Available for Booking' : 'Unavailable',
          type: 'availability' as const,
          status: avail.isAvailable ? 'available' as const : 'unavailable' as const,
          notes: avail.notes || undefined
        }));
        
        // Combine both types of events
        return [...tourDateEvents, ...availabilityEvents];
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        return [];
      }
    },
    enabled: !!venue
  });

  // Calculate calendar days and handle date range
  const calendarDays = useMemo(() => {
    let start, end;
    
    if (view === 'month') {
      start = startOfMonth(date);
      end = endOfMonth(date);
      
      // Include days from previous/next month to fill the grid
      start = startOfWeek(start);
      end = endOfWeek(end);
    } else if (view === 'week') {
      start = startOfWeek(date);
      end = endOfWeek(date);
    } else {
      // Day view - just return a single day
      return [date];
    }
    
    return eachDayOfInterval({ start, end });
  }, [date, view]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  // Format date for display in headers
  const formatDateHeader = () => {
    if (view === 'month') {
      return format(date, 'MMMM yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  // Handle opening event details
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  // Handle date selection for adding a new event
  const handleDateClick = (day: Date) => {
    setNewEventDate(day);
    setIsAddEventOpen(true);
  };
  
  // Handle navigation between dates
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setDate(new Date());
      return;
    }
    
    if (view === 'month') {
      setDate(new Date(
        date.getFullYear(),
        direction === 'next' ? date.getMonth() + 1 : date.getMonth() - 1,
        1
      ));
    } else if (view === 'week') {
      setDate(addDays(date, direction === 'next' ? 7 : -7));
    } else {
      setDate(addDays(date, direction === 'next' ? 1 : -1));
    }
  };
  
  // Empty state card when no venue is selected
  if (!venue) {
    return (
      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Venue Selected</CardTitle>
            <CardDescription>
              Please select a venue to manage its calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <MapPin className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <p className="text-center text-muted-foreground mb-4">
              You need to select a venue from the dropdown in the top navigation
              to view and manage its calendar events.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              Select a Venue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage events and availability for {venue.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger 
              value="month" 
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary text-primary-foreground' : ''}
            >
              Month
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary text-primary-foreground' : ''}
            >
              Week
            </TabsTrigger>
            <TabsTrigger 
              value="day" 
              onClick={() => setView('day')}
              className={view === 'day' ? 'bg-primary text-primary-foreground' : ''}
            >
              Day
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('today')}
          >
            Today
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-medium mx-2 min-w-[150px] text-center">
            {formatDateHeader()}
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button onClick={() => setIsAddEventOpen(true)} className="md:ml-4">
            <Plus className="h-4 w-4 mr-2" /> 
            Add Event
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Panel */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-[500px]">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <p className="mt-2 text-muted-foreground">Loading calendar...</p>
                </div>
              </div>
            ) : view === 'month' ? (
              <div>
                {/* Day of week headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center p-2 text-sm font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-md overflow-hidden">
                  {calendarDays.map((day, dayIdx) => {
                    const dailyEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, date);
                    
                    return (
                      <div 
                        key={day.toString()} 
                        className={cn(
                          "min-h-[100px] bg-white p-2 relative cursor-pointer",
                          !isCurrentMonth && "bg-gray-50 text-gray-400",
                          isToday(day) && "border-l-4 border-primary"
                        )}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="flex justify-between">
                          <span className={cn(
                            "text-sm font-medium",
                            isToday(day) && "text-primary font-bold"
                          )}>
                            {format(day, 'd')}
                          </span>
                          {dailyEvents.length > 0 && (
                            <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                              {dailyEvents.length}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                          {dailyEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className={cn(
                                "text-xs py-1 px-2 rounded border truncate cursor-pointer",
                                statusColors[event.status]
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {statusIcons[event.status]}
                                <span className="truncate">{event.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : view === 'week' ? (
              <div>
                <div className="grid grid-cols-7 gap-4 mb-6">
                  {calendarDays.map((day) => (
                    <div 
                      key={day.toString()} 
                      className={cn(
                        "text-center p-2 rounded-md cursor-pointer hover:bg-gray-50",
                        isToday(day) && "bg-primary/10 text-primary"
                      )}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="font-medium">{format(day, 'EEE')}</div>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center mx-auto",
                        isToday(day) && "bg-primary text-primary-foreground"
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {getEventsForDay(day).length > 0 ? 
                          `${getEventsForDay(day).length} events` : 
                          'No events'
                        }
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    
                    if (dayEvents.length === 0) return null;
                    
                    return (
                      <div key={day.toString()} className="border rounded-md p-4">
                        <div className={cn(
                          "flex items-center mb-3",
                          isToday(day) && "text-primary"
                        )}>
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          <span className="font-medium">{format(day, 'EEEE, MMMM d')}</span>
                        </div>
                        
                        <div className="space-y-3">
                          {dayEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className={cn(
                                "flex justify-between items-start p-3 rounded-md border cursor-pointer",
                                statusColors[event.status]
                              )}
                              onClick={() => handleEventClick(event)}
                            >
                              <div>
                                <div className="font-medium">{event.title}</div>
                                {event.type === 'show' && (
                                  <div className="text-sm text-muted-foreground">
                                    {event.genre}
                                  </div>
                                )}
                              </div>
                              <Badge variant={event.status === 'confirmed' ? 'default' : 'outline'} className="capitalize">
                                {event.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {!calendarDays.some(day => getEventsForDay(day).length > 0) && (
                    <div className="text-center py-10 border rounded-md">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No events this week</h3>
                      <p className="text-muted-foreground mb-4">
                        There are no events scheduled for this week.
                      </p>
                      <Button onClick={() => setIsAddEventOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Day view
              <div>
                <div className={cn(
                  "flex items-center mb-4",
                  isToday(date) && "text-primary"
                )}>
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  <span className="text-lg font-medium">{format(date, 'EEEE, MMMM d')}</span>
                </div>
                
                <div className="space-y-4">
                  {getEventsForDay(date).length > 0 ? (
                    getEventsForDay(date).map((event) => (
                      <div 
                        key={event.id} 
                        className={cn(
                          "p-4 rounded-md border cursor-pointer",
                          statusColors[event.status]
                        )}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              {statusIcons[event.status]}
                              <span className="font-medium text-lg">{event.title}</span>
                            </div>
                            
                            {event.type === 'show' && (
                              <>
                                <div className="text-sm mt-1">{event.bandName}</div>
                                <div className="text-sm text-muted-foreground">{event.genre}</div>
                                {event.city && event.state && (
                                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.city}, {event.state}
                                  </div>
                                )}
                              </>
                            )}
                            
                            {event.notes && (
                              <div className="mt-3 text-sm p-2 bg-background/80 rounded-md">
                                {event.notes}
                              </div>
                            )}
                          </div>
                          
                          <Badge variant={event.status === 'confirmed' ? 'default' : 'outline'} className="capitalize">
                            {event.status}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          {event.status === 'pending' && (
                            <Button size="sm">Confirm</Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border rounded-md bg-gray-50">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium text-lg">No events scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        There are no events scheduled for this day
                      </p>
                      <Button onClick={() => handleDateClick(date)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
              <CardDescription>Add events to your calendar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start"
                onClick={() => {
                  setNewEventType('show');
                  setIsAddEventOpen(true);
                }}
              >
                <Music className="mr-2 h-4 w-4" />
                Schedule Performance
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEventType('availability');
                  setIsAddEventOpen(true);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark Available
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEventType('private');
                  setIsAddEventOpen(true);
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Block Date
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your next scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </div>
                      <div className="mt-1 font-medium">{event.title}</div>
                      {event.type === 'show' && event.bandName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.bandName}
                        </div>
                      )}
                    </div>
                  ))}
                
                {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming events scheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Venue Stats</CardTitle>
              <CardDescription>Overview for {venue.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total events this month</span>
                  <span className="font-medium">{events.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.getMonth() === new Date().getMonth() && 
                           eventDate.getFullYear() === new Date().getFullYear();
                  }).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Confirmed bookings</span>
                  <span className="font-medium">{events.filter(event => event.status === 'confirmed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending bookings</span>
                  <span className="font-medium">{events.filter(event => event.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available dates</span>
                  <span className="font-medium">{events.filter(event => event.status === 'available').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Event Details Dialog */}
      <Dialog 
        open={isEventDetailsOpen} 
        onOpenChange={setIsEventDetailsOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                  <Badge variant={selectedEvent.status === 'confirmed' ? 'default' : 'outline'} className="capitalize">
                    {selectedEvent.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedEvent.type === 'show' && (
                  <div className="space-y-3">
                    {selectedEvent.bandName && (
                      <div className="flex items-start gap-2">
                        <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Band</div>
                          <div className="text-sm text-muted-foreground">{selectedEvent.bandName}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.genre && (
                      <div className="flex items-start gap-2">
                        <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Genre</div>
                          <div className="text-sm text-muted-foreground">{selectedEvent.genre}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.city && selectedEvent.state && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="text-sm text-muted-foreground">{selectedEvent.city}, {selectedEvent.state}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedEvent.notes && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Notes</div>
                      <div className="text-sm text-muted-foreground">{selectedEvent.notes}</div>
                    </div>
                  </div>
                )}
                
                {selectedEvent.tourId && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Tour</div>
                      <div className="text-sm text-muted-foreground">Part of tour #{selectedEvent.tourId}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex sm:justify-between">
                <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
                  Close
                </Button>
                
                <div className="space-x-2">
                  <Button variant="outline">Edit</Button>
                  {selectedEvent.status === 'pending' && (
                    <Button>Confirm</Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Event Dialog */}
      <Dialog 
        open={isAddEventOpen} 
        onOpenChange={setIsAddEventOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {newEventType === 'show' ? 'Schedule Performance' : 
               newEventType === 'availability' ? 'Mark Availability' : 
               'Block Date'}
            </DialogTitle>
            <DialogDescription>
              {newEventType === 'show' ? 'Add a new performance to your calendar' : 
               newEventType === 'availability' ? 'Set availability for booking' : 
               'Block a date for private use'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="event-date">Date</Label>
                <DatePicker
                  date={newEventDate}
                  setDate={(date) => setNewEventDate(date)}
                />
              </div>
              
              <div className="col-span-4">
                <Label htmlFor="event-type">Event Type</Label>
                <Select
                  value={newEventType}
                  onValueChange={(value: any) => setNewEventType(value)}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Performance</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                    <SelectItem value="private">Private/Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newEventType === 'show' && (
                <>
                  <div className="col-span-4">
                    <Label htmlFor="band">Band Name</Label>
                    <Input id="band" placeholder="Enter band name" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input id="genre" placeholder="Genre" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="pending">
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {newEventType === 'availability' && (
                <div className="col-span-4">
                  <Label htmlFor="available">Availability</Label>
                  <Select defaultValue="available">
                    <SelectTrigger id="available">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="col-span-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Additional information"
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // In a real implementation, this would send the data to the server
              toast({
                title: "Event added",
                description: `Successfully added new ${newEventType} on ${newEventDate ? format(newEventDate, 'MMM d, yyyy') : 'selected date'}`,
              });
              setIsAddEventOpen(false);
            }}>
              Save Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Status colors for different event types
const statusColors = {
  confirmed: "bg-green-50 border-green-200 text-green-700",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  available: "bg-blue-50 border-blue-200 text-blue-700",
  unavailable: "bg-gray-50 border-gray-200 text-gray-500"
};

// Icons for different statuses
const statusIcons = {
  confirmed: <Check className="h-3 w-3 text-green-500" />,
  pending: <Clock className="h-3 w-3 text-yellow-500" />,
  available: <Check className="h-3 w-3 text-blue-500" />,
  unavailable: <Ban className="h-3 w-3 text-gray-400" />
};

// Form label component
const Label = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    {children}
  </label>
);