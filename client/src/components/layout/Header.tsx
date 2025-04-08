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
  MapPin,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-fixed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [location] = useLocation();
  const { activeVenueId, venueData } = useActiveVenue();
  const { toggleSidebar } = useSidebar();

  // Updated navigation structure with categories
  const mainNavItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  ];
  
  // Venue-focused navigation
  const venueNavItems = [
    { href: '/venues/search', label: 'Find Venues', icon: <Search className="h-4 w-4" /> },
    { href: '/venues/tour-finder', label: 'Tour Finder', icon: <Route className="h-4 w-4" /> },
    { href: '/venue-network', label: 'Venue Network', icon: <Network className="h-4 w-4" /> },
  ];
  
  // Artist-focused navigation
  const artistNavItems = [
    { href: '/artists/discovery', label: 'Discover Artists', icon: <Music className="h-4 w-4" /> },
    { href: '/tours/route-visualization', label: 'Tour Routes', icon: <MapPin className="h-4 w-4" /> },
    { href: '/collaboration-requests', label: 'Collaborations', icon: <Handshake className="h-4 w-4" /> },
  ];

  // Helper function to render nav links with active state
  const renderNavLink = (item) => (
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
  );

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
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Music className="h-6 w-6 text-primary" />
          <span>BandConnect</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 mx-6 overflow-x-auto">
          {/* Main Navigation Items */}
          {mainNavItems.map(renderNavLink)}
          
          {/* Venue Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1 h-auto p-0",
                  location.startsWith('/venues') || location.startsWith('/venue-network')
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building className="h-4 w-4" />
                Venues
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Venue Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {venueNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link 
                    href={item.href}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Artist Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1 h-auto p-0",
                  location.startsWith('/artists') || location.startsWith('/tours') || location === '/collaboration-requests'
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Music className="h-4 w-4" />
                Artists
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Artist Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {artistNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link 
                    href={item.href}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        {/* Right Side Elements */}
        <div className="ml-auto flex items-center gap-4">
          {/* Active Venue Display */}
          {activeVenueId && venueData && (
            <Link 
              href={`/venues/${activeVenueId}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">{venueData.name}</span>
            </Link>
          )}
          
          {/* User Profile Area */}
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