import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Music, 
  Calendar, 
  Search, 
  MapPin, 
  Users, 
  Building,
  Network,
  Route,
  Menu,
  X,
  Info,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  BarChart,
  Handshake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useVenues } from '@/hooks/useVenues';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import VenueSelector from '@/components/venue/VenueSelector';

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Setup listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <SidebarContext.Provider value={{ 
      collapsed, 
      toggleSidebar, 
      mobileOpen, 
      setMobileOpen 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { activeVenueId, venueData } = useActiveVenue();
  const { data: allVenues, isLoading: venuesLoading } = useVenues();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when navigating
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [location, isMobile, mobileOpen, setMobileOpen]);

  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/artists/discovery', label: 'Artist Discovery', icon: <Music className="h-5 w-5" /> },
    { href: '/calendar', label: 'Event Calendar', icon: <Calendar className="h-5 w-5" /> },
    { href: '/venues', label: 'Venue Search', icon: <Search className="h-5 w-5" /> },
    { href: '/venue-network', label: 'Venue Network', icon: <Network className="h-5 w-5" /> },
    { href: '/tours/route-visualization', label: 'Tour Routes', icon: <Route className="h-5 w-5" /> },
    { href: '/collaboration-requests', label: 'Collaborations', icon: <Handshake className="h-5 w-5" /> },
  ];

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger */}
        <div className="fixed top-4 left-4 z-40">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="relative flex w-[280px] max-w-[80%] flex-col overflow-y-auto bg-background p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">BandConnect</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Venue Selector */}
              <div className="mb-4">
                <VenueSelector />
              </div>
              
              <Separator className="my-2" />
              
              <nav className="flex flex-col gap-2 mt-4">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a 
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location === item.href || location.startsWith(item.href + '/') 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                ))}
              </nav>
              
              {/* Show active venue info in mobile too */}
              {venueData && (
                <div className="mt-6">
                  <VenueInfoCard venue={venueData} isMobile={true} />
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div 
      className={cn(
        "hidden md:flex flex-col border-r bg-background h-screen z-30 fixed overflow-hidden",
        collapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className="flex h-14 items-center px-4 border-b">
        {!collapsed && <h2 className="text-lg font-bold">BandConnect</h2>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={collapsed ? "mx-auto" : "ml-auto"}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Venue Selector */}
      {!collapsed && (
        <div className="p-4 pb-2">
          <VenueSelector />
        </div>
      )}
      
      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <nav className="flex flex-col gap-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a 
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    (location === item.href || location.startsWith(item.href + '/'))
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted",
                    collapsed && "justify-center"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </a>
              </Link>
            ))}
          </nav>
          
          {/* Active Venue Information */}
          {!collapsed && venueData && (
            <div className="mt-6">
              <VenueInfoCard venue={venueData} />
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Mini version of venue info when collapsed */}
      {collapsed && venueData && (
        <div className="p-2 mb-2 border-t">
          <div className="flex flex-col items-center gap-1 text-center">
            <Building className="h-6 w-6 text-primary" />
            <Badge className="px-1 py-0 text-[10px]" variant="outline">
              {venueData.capacity || '?'} cap
            </Badge>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// Venue information card component
interface VenueInfoCardProps {
  venue: any;
  isMobile?: boolean;
}

function VenueInfoCard({ venue, isMobile = false }: VenueInfoCardProps) {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="bg-muted/20">
      <CardContent className={cn("p-3", isMobile && "p-2")}>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-sm flex items-center">
                <Building className="h-4 w-4 mr-1 text-primary" />
                {venue.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {venue.city}, {venue.state}
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => setLocation(`/venues/${venue.id}`)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <Badge variant="outline" className="mb-1">Capacity</Badge>
              <p className="font-medium">{venue.capacity || 'Unknown'}</p>
            </div>
            
            <div>
              <Badge variant="outline" className="mb-1">Genre</Badge>
              <p className="font-medium">{venue.genre || 'Various'}</p>
            </div>
          </div>
          
          {(venue.contactEmail || venue.contactPhone) && (
            <>
              <Separator />
              
              <div className="space-y-1 text-xs">
                {venue.contactName && (
                  <div>
                    <Badge variant="outline" className="mb-1">Contact</Badge>
                    <p className="font-medium">{venue.contactName}</p>
                  </div>
                )}
                
                <div className="flex flex-col gap-1 mt-1">
                  {venue.contactEmail && (
                    <a 
                      href={`mailto:${venue.contactEmail}`}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {venue.contactEmail}
                    </a>
                  )}
                  
                  {venue.contactPhone && (
                    <a 
                      href={`tel:${venue.contactPhone}`}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {venue.contactPhone}
                    </a>
                  )}
                  
                  {venue.website && (
                    <a 
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setLocation(`/calendar?venueId=${venue.id}`)}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Calendar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setLocation(`/venue-network?venueId=${venue.id}`)}
            >
              <Network className="h-3 w-3 mr-1" />
              Network
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}