import { 
  Plus, 
  Calendar, 
  Clock, 
  Music, 
  Users, 
  MapPin, 
  Star, 
  Mail, 
  Settings, 
  BarChart3, 
  LayoutDashboard,
  Search,
  X,
  Sparkles,
  Inbox,
  Building
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Link, useLocation } from "wouter";
import { format, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Define the performance type
interface Performance {
  id: string;
  artistName: string;
  date: string | Date;
  status?: string;
  drawSize?: number;
  ticketPrice?: number;
}

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeVenue } = useActiveVenue();
  const [location] = useLocation();

  // Fetch upcoming performances for this venue
  const { data: performances = [], isLoading: isPerformancesLoading } = useQuery<Performance[]>({
    queryKey: ["/api/venues", activeVenue?.id, "performances"],
    enabled: !!activeVenue?.id,
  });

  // Get upcoming performances (just for display in sidebar)
  const upcomingPerformances = performances
    .filter((p) => new Date(p.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Helper to check if a navigation item is active
  const isActive = (path: string) => {
    if (path === "/") return location === "/" || location === "/dashboard";
    return location.startsWith(path);
  };

  // Classes for sidebar based on mobile and open state
  const sidebarClasses = cn(
    "bg-background border-r flex flex-col h-full",
    isMobile ? 
      "fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-200 ease-in-out" + 
      (isSidebarOpen ? " translate-x-0" : " -translate-x-full") : 
      "hidden md:flex md:w-64 flex-shrink-0"
  );

  // Navigation items
  const navigationItems = [
    { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { href: "/artist-discovery", icon: <Music className="h-4 w-4" />, label: "Artist Discovery" },
    { href: "/calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendar" },
    { href: "/tours", icon: <BarChart3 className="h-4 w-4" />, label: "Tours" },
    { href: "/performances", icon: <Star className="h-4 w-4" />, label: "Performances" },
  ];

  // Admin items
  const adminItems = [
    { href: "/venues", icon: <Building className="h-4 w-4" />, label: "Venues" },
    { href: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
  ];

  return (
    <aside className={sidebarClasses}>
      {/* Mobile overlay & close button */}
      {isMobile && isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={closeSidebar}
          />
          <button 
            onClick={closeSidebar} 
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Sidebar Content - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Venue Info - Only show in sidebar */}
          {activeVenue ? (
            <div className="flex flex-col items-center mb-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-medium text-base line-clamp-1">{activeVenue.name}</h2>
              <p className="text-xs text-muted-foreground">
                {activeVenue.city}, {activeVenue.state}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-4">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          {/* Main Navigation */}
          <div>
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <nav className="space-y-1">
              {navigationItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                    isActive(item.href) ? 
                      "bg-primary/10 text-primary" : 
                      "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Upcoming Shows */}
          <div>
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Upcoming Shows</span>
              <Badge variant="outline" className="text-xs">
                {upcomingPerformances.length}
              </Badge>
            </h3>

            {isPerformancesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : upcomingPerformances.length > 0 ? (
              <>
                <div className="space-y-2">
                  {upcomingPerformances.map((performance) => (
                    <Card key={performance.id} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{performance.artistName}</p>
                          <p className="text-xs text-muted-foreground">
                            {isToday(new Date(performance.date))
                              ? 'Today'
                              : isTomorrow(new Date(performance.date))
                                ? 'Tomorrow'
                                : format(new Date(performance.date), "EEE, MMM d")}
                          </p>
                        </div>
                        {performance.status && (
                          <Badge variant={performance.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {performance.status}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                <Link 
                  href="/performances"
                  className="text-xs text-primary font-medium hover:underline block text-center mt-1"
                >
                  View all performances
                </Link>
              </>
            ) : (
              <div className="border rounded-md p-3 text-center bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">No upcoming shows</p>
                <Link href="/performances/add">
                  <Button variant="outline" size="sm" className="text-xs w-full">
                    <Plus className="h-3 w-3 mr-1" />
                    Add a Show
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div>
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/performances/add">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Add Show</span>
                </Button>
              </Link>
              <Link href="/calendar/manage">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Update Calendar</span>
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Admin Section */}
          <div>
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Admin
            </h3>
            <nav className="space-y-1">
              {adminItems.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                    isActive(item.href) ? 
                      "bg-primary/10 text-primary" : 
                      "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>
      
      {/* User Profile/Account at bottom of sidebar */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Venue Manager</p>
            <p className="text-xs text-muted-foreground truncate">venue@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;