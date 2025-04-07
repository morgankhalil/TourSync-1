
import React, { useState } from 'react';
import { Link } from 'wouter';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useVenues } from '@/hooks/useVenues';
import { 
  Calendar, 
  Search, 
  Bell,
  Settings,
  User,
  Music,
  MapPin,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TopNav() {
  const { activeVenue, setActiveVenue } = useActiveVenue();
  const { venues, isLoading } = useVenues();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
      <div className="h-full mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="font-bold text-lg md:text-xl flex items-center gap-2">
              <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center text-white">
                <Music className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">Venue Connect</span>
            </div>
          </Link>
          
          {!searchOpen && (
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-sm font-medium">Dashboard</Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-sm font-medium">Calendar</Button>
              </Link>
              <Link href="/discovery">
                <Button variant="ghost" size="sm" className="text-sm font-medium">Discovery</Button>
              </Link>
              <Link href="/tours">
                <Button variant="ghost" size="sm" className="text-sm font-medium">Tours</Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative w-full md:w-64">
              <Input 
                placeholder="Search venues, artists, tours..." 
                className="w-full pr-8"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto py-1">
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="flex flex-col items-start py-2 cursor-pointer">
                    <div className="font-medium">New booking request</div>
                    <div className="text-sm text-muted-foreground">The Velvet Echoes want to perform at your venue</div>
                    <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
                {activeVenue ? (
                  <>
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="max-w-28 truncate">{activeVenue.name}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>Select Venue</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Your Venues</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <DropdownMenuItem disabled>
                  Loading venues...
                </DropdownMenuItem>
              ) : venues && venues.length > 0 ? (
                venues.map(venue => (
                  <DropdownMenuItem 
                    key={venue.id} 
                    onClick={() => {
                      setActiveVenue(venue);
                      console.log('Selected venue:', venue);
                    }}
                  >
                    {venue.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No venues found
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <Link href="/venues/add">
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Venue
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
