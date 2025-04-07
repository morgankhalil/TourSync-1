import { 
  Calendar, 
  Clock, 
  Music, 
  MapPin, 
  LineChart, 
  Route, 
  Users, 
  LogIn, 
  Search,
  MessageSquareText,
  BarChart3,
  Home,
  Building2,
  Settings,
  Compass
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  onNavClick?: () => void;
}

const navItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Artist Discovery",
    href: "/discovery",
    icon: Music,
  },
  {
    title: "Tour Manager",
    href: "/tours",
    icon: Route,
  },
  {
    title: "Venues",
    href: "/venues",
    icon: Building2,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquareText,
    badge: "4"
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
  },
];

const Sidebar = ({ onNavClick }: SidebarProps) => {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  // Helper to check if a navigation item is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Generate mock upcoming shows for the sidebar
  const upcomingShows = [
    { id: 1, name: "Electric Dreams", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "confirmed" },
    { id: 2, name: "Midnight Echoes", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: "confirmed" },
    { id: 3, name: "Velvet Thunder", date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), status: "pending" },
  ];

  return (
    <ScrollArea className="h-full py-3">
      <div className="px-3 py-2 flex-1">
        {/* App Logo & Title */}
        <Link href="/">
          <div className="flex items-center px-2 mb-6 h-12">
            <div className="flex items-center gap-2 font-semibold">
              <div className="bg-primary rounded w-8 h-8 flex items-center justify-center text-primary-foreground">
                <Music className="h-4 w-4" />
              </div>
              <span className="font-semibold">Venue Connect</span>
            </div>
          </div>
        </Link>

        {/* Active Venue */}
        {activeVenue && (
          <div className="mb-4 bg-muted/40 rounded-lg p-4">
            <div className="flex flex-col items-center mb-2">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-2 font-medium truncate text-center">{activeVenue.name}</h3>
              <p className="text-xs text-muted-foreground">
                {activeVenue.city}, {activeVenue.state}
              </p>
              <Link href={`/venue/${activeVenue.id}`}>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">
                  Manage Venue
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="space-y-1 py-2">
          <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Main
          </div>
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive(item.href) && "bg-secondary font-medium"
                      )}
                      onClick={onNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="default" className="ml-auto h-5 px-1.5 bg-primary">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
        
        <Separator className="my-4" />
        
        {/* Upcoming Shows */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground px-2 pb-2">
            Upcoming Shows
          </div>
          
          {upcomingShows.length > 0 ? (
            <div className="space-y-2 px-2">
              {upcomingShows.map((show) => (
                <div
                  key={show.id}
                  className="flex items-start justify-between rounded-md border p-2 text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium truncate pr-4">{show.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {show.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant={show.status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                    {show.status}
                  </Badge>
                </div>
              ))}
              
              <Link href="/performances">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View All Shows
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-3 px-2">
              <p className="text-xs text-muted-foreground">No upcoming shows</p>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Settings & Help */}
        <div className="space-y-1 py-2">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          </Link>
          <Link href="/help">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Compass className="h-4 w-4" />
              <span>Help & Resources</span>
            </Button>
          </Link>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Sidebar;