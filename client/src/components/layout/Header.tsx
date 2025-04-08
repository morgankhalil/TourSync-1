import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Music, 
  Calendar, 
  Users, 
  Route,
  Search,
  Building,
  Handshake,
  Menu,
  Network,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-fixed';

export function Header() {
  const [location] = useLocation();
  const { activeVenueId, venueData } = useActiveVenue();
  const { toggleSidebar } = useSidebar();

  // Navigation items shared between mobile and desktop
  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/artists/discovery', label: 'Artist Discovery', icon: <Music className="h-4 w-4" /> },
    { href: '/venues/tour-finder', label: 'Tour Finder Pro', icon: <Route className="h-4 w-4" /> },
    { href: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
    { href: '/venues', label: 'Venues', icon: <Building className="h-4 w-4" /> },
    { href: '/venue-network', label: 'Venue Network', icon: <Network className="h-4 w-4" /> },
    { href: '/tours/route-visualization', label: 'Tour Routes', icon: <MapPin className="h-4 w-4" /> },
    { href: '/collaboration-requests', label: 'Collaborations', icon: <Handshake className="h-4 w-4" /> },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
      <div className="flex h-16 items-center px-6">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 font-semibold">
          <Music className="h-6 w-6 text-primary" />
          <span>BandConnect</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-5 mx-6 overflow-x-auto">
          {navigationItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap",
                (location === item.href || location.startsWith(item.href + '/'))
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="ml-auto flex items-center gap-4">
          {activeVenueId && venueData && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">{venueData.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}