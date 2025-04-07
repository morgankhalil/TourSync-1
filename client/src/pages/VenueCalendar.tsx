import React, { useState, useMemo } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Music, 
  MapPin, 
  ArrowRight,
  CalendarDays,
  Clock,
  Check,
  Ban,
  Info,
  Users,
  Tag,
  MessageSquare
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TourDate } from '@shared/schema';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';


// Event types and utilities
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

const statusColors: Record<string, string> = {
  'confirmed': 'bg-green-100 text-green-800 border-green-200',
  'pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'available': 'bg-blue-100 text-blue-800 border-blue-200',
  'unavailable': 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons: Record<string, React.ReactNode> = {
  'confirmed': <Check className="h-4 w-4" />,
  'pending': <Clock className="h-4 w-4" />,
  'available': <Check className="h-4 w-4" />,
  'unavailable': <Ban className="h-4 w-4" />
};

const VenueCalendar: React.FC = () => {
  const { activeVenue } = useActiveVenue();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'list' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | undefined>(undefined);
  const [newEventType, setNewEventType] = useState<'show' | 'availability' | 'private'>('show');

  // Sample events to display
  const mockEvents: CalendarEvent[] = [
    {
      id: 1,
      date: addDays(new Date(), 2),
      title: 'The Electric Echoes',
      type: 'show',
      status: 'confirmed',
      bandName: 'The Electric Echoes',
      genre: 'Indie Rock',
      notes: 'Full lineup confirmed. Opening act: The Crystal Cascade',
      city: 'Seattle',
      state: 'WA'
    },
    {
      id: 2,
      date: addDays(new Date(), 5),
      title: 'Violet Sunset',
      type: 'show',
      status: 'pending',
      bandName: 'Violet Sunset',
      genre: 'Alternative',
      notes: 'Waiting for final contract approval',
      city: 'Portland',
      state: 'OR'
    },
    {
      id: 3,
      date: addDays(new Date(), -3),
      title: 'Neon Horizon',
      type: 'show',
      status: 'confirmed',
      bandName: 'Neon Horizon',
      genre: 'Synthwave',
      notes: 'Special lighting setup required',
      city: 'Seattle',
      state: 'WA'
    },
    {
      id: 4,
      date: addDays(new Date(), 7),
      title: 'Venue Maintenance',
      type: 'private',
      status: 'unavailable',
      notes: 'Sound system upgrade'
    },
    {
      id: 5,
      date: addDays(new Date(), 10),
      title: 'Available for Booking',
      type: 'availability',
      status: 'available',
      notes: 'Prime weekend slot'
    }
  ];

  // Simulate API request
  const { data: events = mockEvents, isLoading } = useQuery({
    queryKey: ['venue-calendar-events', activeVenue?.id],
    queryFn: async () => mockEvents,
    enabled: !!activeVenue
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
  if (!activeVenue) {
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
            Manage events and availability for {activeVenue.name}
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
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{event.title}</div>
                        <Badge
                          variant={event.status === 'confirmed' ? 'default' : 'outline'}
                          className="ml-2 shrink-0 capitalize"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(event.date), 'EEE, MMM d')}
                      </div>
                    </div>
                  ))}
                
                {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No upcoming events
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Events
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
              <CardDescription>Event status indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-green-100 border border-green-200 rounded"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-amber-100 border border-amber-200 rounded"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-red-100 border border-red-200 rounded"></div>
                  <span>Unavailable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent && format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Status</div>
                <Badge className={cn(
                  "capitalize",
                  selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                  selectedEvent.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                  selectedEvent.status === 'available' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                  'bg-red-100 text-red-700 hover:bg-red-100'
                )}>
                  {selectedEvent.status}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {selectedEvent.type === 'show' && (
                  <>
                    <div>
                      <Label>Band/Artist</Label>
                      <div className="font-medium mt-1">{selectedEvent.bandName}</div>
                    </div>
                    
                    <div>
                      <Label>Genre</Label>
                      <div className="font-medium mt-1">{selectedEvent.genre}</div>
                    </div>
                    
                    {selectedEvent.city && selectedEvent.state && (
                      <div>
                        <Label>Location</Label>
                        <div className="font-medium mt-1">{selectedEvent.city}, {selectedEvent.state}</div>
                      </div>
                    )}
                  </>
                )}
                
                {selectedEvent.notes && (
                  <div>
                    <Label>Notes</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                      {selectedEvent.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" size="sm">
              Cancel Event
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
                Close
              </Button>
              <Button>
                Edit Event
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {newEventType === 'show' ? 'Schedule Performance' : 
               newEventType === 'availability' ? 'Set Availability' : 
               'Block Date'}
            </DialogTitle>
            <DialogDescription>
              {newEventType === 'show' ? 'Add a new performance to your venue calendar' : 
               newEventType === 'availability' ? 'Mark dates as available for booking' : 
               'Block a date for private events or maintenance'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
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
                  <SelectItem value="private">Private/Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={newEventDate}
                onSelect={setNewEventDate}
                className="border rounded-md p-3"
              />
            </div>
            
            {newEventType === 'show' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="band-name">Band/Artist Name</Label>
                  <Input id="band-name" placeholder="Enter band or artist name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input id="genre" placeholder="Enter music genre" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="pending">
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {newEventType === 'availability' && (
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select defaultValue="available">
                  <SelectTrigger id="availability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Add additional details" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddEventOpen(false)}>
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueCalendar;