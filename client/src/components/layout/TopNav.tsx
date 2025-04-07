
import React from 'react';
import { Link, useLocation } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { 
  Calendar, 
  Search, 
  Music, 
  Settings,
  Bell, 
  LayoutDashboard, 
  BarChart3,
  Menu,
  LogOut
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useSidebar } from '@/context/SidebarContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TopNav() {
  const { activeVenue, setVenueId } = useActiveVenue();
  const { toggleSidebar } = useSidebar();
  const [location] = useLocation();

  // Function to determine if a navigation item is active
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo */}
          <Link href="/" className="font-bold text-xl flex items-center">
            <span className="text-primary">Venue</span>
            <span>Connect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive("/dashboard") 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/calendar" className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive("/calendar") 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}>
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Link>
            
            <Link href="/artist-discovery" className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              (isActive("/artist-discovery") || isActive("/discovery")) 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}>
              <Music className="h-4 w-4" />
              <span>Discovery</span>
            </Link>
            
            <Link href="/tours" className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive("/tour") 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}>
              <BarChart3 className="h-4 w-4" />
              <span>Tours</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search button */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">3</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 py-2">
                  <div className="font-medium">New booking request</div>
                  <div className="text-xs text-muted-foreground">The Midnight Echoes requested Apr 15</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 py-2">
                  <div className="font-medium">Calendar update</div>
                  <div className="text-xs text-muted-foreground">Your availability was updated</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 py-2">
                  <div className="font-medium">Artist match found</div>
                  <div className="text-xs text-muted-foreground">We found a 95% match with Neon Horizon</div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-center justify-center text-primary">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Active venue & user menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 font-medium">
                {activeVenue ? (
                  <span className="max-w-32 truncate">{activeVenue.name}</span>
                ) : (
                  <span>Select Venue</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Your Venues</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer" 
                onClick={() => setVenueId(1)}
              >
                Beat Kitchen
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setVenueId(2)}
              >
                Empty Bottle
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setVenueId(3)}
              >
                Sleeping Village
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
