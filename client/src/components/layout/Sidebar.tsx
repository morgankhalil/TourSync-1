
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
  Compass,
  Star,
  UserCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar as UISidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
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
    title: "Main",
    items: [
      {
        title: "Home",
        href: "/",
        icon: Home,
      },
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: BarChart3,
      }
    ]
  },
  {
    title: "Venue Management",
    items: [
      {
        title: "Venues",
        href: "/venues",
        icon: Building2,
      },
      {
        title: "Calendar",
        href: "/venue-calendar",
        icon: Calendar,
      },
      {
        title: "Availability",
        href: "/venue-availability",
        icon: Clock,
      }
    ]
  },
  {
    title: "Artist Discovery",
    items: [
      {
        title: "Discover Artists",
        href: "/artist-discovery",
        icon: Search,
      },
      {
        title: "Enhanced Discovery",
        href: "/enhanced-artist-discovery",
        icon: Star,
      },
      {
        title: "Bandsintown Import",
        href: "/bandsintown-import",
        icon: Music,
      },
      {
        title: "Opportunities",
        href: "/opportunity-discovery",
        icon: Compass,
      }
    ]
  },
  {
    title: "Tour Planning",
    items: [
      {
        title: "Tour Dashboard",
        href: "/tour-dashboard",
        icon: Route,
      },
      {
        title: "Create Tour",
        href: "/create-tour",
        icon: MapPin,
      },
      {
        title: "Tour Wizard",
        href: "/tour-planning-wizard",
        icon: LineChart,
      }
    ]
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        href: "/profile",
        icon: UserCircle,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      }
    ]
  }
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

        {/* Navigation Groups */}
        {navItems.map((group, index) => (
          <div key={group.title} className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
              {group.title}
            </div>
            <TooltipProvider delayDuration={0}>
              {group.items.map((item) => (
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
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {index < navItems.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default Sidebar;
