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
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-fixed';

export function Header() {
  const [location] = useLocation();
  const { activeVenueId, venueData } = useActiveVenue();
  const { toggleSidebar } = useSidebar();

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
        
        <nav className="hidden md:flex items-center gap-5 mx-6">
          <Link href="/" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
          </Link>
          
          <Link href="/artists/discovery" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/artists/discovery" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Search className="h-4 w-4" />
              Artist Discovery
          </Link>
          
          <Link href="/venues/tour-finder" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/venues/tour-finder" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Route className="h-4 w-4" />
              Tour Finder Pro
          </Link>
          
          <Link href="/calendar" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/calendar" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Calendar className="h-4 w-4" />
              Calendar
          </Link>
          
          <Link href="/venues" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/venues" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Building className="h-4 w-4" />
              Venues
          </Link>
          
          <Link href="/venue-network" className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              location === "/venue-network" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <Users className="h-4 w-4" />
              Venue Network
          </Link>
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