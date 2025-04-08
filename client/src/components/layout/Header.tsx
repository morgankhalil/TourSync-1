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
  ChevronDown,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define a type for navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Header() {
  const [location, setLocation] = useLocation();
  const { activeVenueId, venueData } = useActiveVenue();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();

  // Updated navigation structure with categories
  const mainNavItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
  ];

  // Venue-focused navigation
  const venueNavItems: NavItem[] = [
    { href: '/venues/search', label: 'Find Venues', icon: <Search className="h-4 w-4" /> },
    { href: '/venues/tour-finder', label: 'Tour Finder', icon: <Route className="h-4 w-4" /> },
    { href: '/venue-network', label: 'Venue Network', icon: <Network className="h-4 w-4" /> },
  ];

  // Artist-focused navigation
  const artistNavItems: NavItem[] = [
    { href: '/artists/discovery', label: 'Discover Artists', icon: <Music className="h-4 w-4" /> },
    { href: '/tours/route-visualization', label: 'Tour Routes', icon: <MapPin className="h-4 w-4" /> },
    { href: '/collaboration-requests', label: 'Collaborations', icon: <Handshake className="h-4 w-4" /> },
  ];

  // Helper function to render nav links with active state
  const renderNavLink = (item: NavItem) => (
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
          <span>TourSync</span>
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
              {venueNavItems.map((item: NavItem) => (
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
              {artistNavItems.map((item: NavItem) => (
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
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => {
                    await logout();
                    setLocation('/login');
                  }}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}