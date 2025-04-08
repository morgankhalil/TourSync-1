import { Link, useLocation } from "wouter";
import { 
  Calendar, Clock, Music, MapPin, LineChart, 
  Route, Users, Search, MessageSquareText, 
  BarChart3, Home, Building2, Settings, 
  Compass, Star, UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  const NavItem = ({ href, icon: Icon, children }: any) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2",
          location === href && "bg-accent"
        )}
        onClick={onNavClick}
      >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
      </Button>
    </Link>
  );

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          <NavItem href="/" icon={Home}>Home</NavItem>
          <NavItem href="/dashboard" icon={BarChart3}>Dashboard</NavItem>

          <Separator className="my-2" />

          <div className="px-2 py-1.5 text-sm font-semibold">Venues</div>
          <NavItem href="/venues" icon={Building2}>All Venues</NavItem>
          {activeVenue && (
            <>
              <NavItem href={`/venue/${activeVenue.id}/dashboard`} icon={LineChart}>
                Venue Dashboard
              </NavItem>
              <NavItem href={`/venue/${activeVenue.id}/calendar`} icon={Calendar}>
                Calendar
              </NavItem>
              <NavItem href={`/venue/${activeVenue.id}/availability`} icon={Clock}>
                Availability
              </NavItem>
            </>
          )}

          <Separator className="my-2" />

          <div className="px-2 py-1.5 text-sm font-semibold">Artists</div>
          <NavItem href="/bands" icon={Music}>Bands</NavItem>
          <NavItem href="/discovery" icon={Search}>Artist Discovery</NavItem>
          <NavItem href="/discovery/enhanced" icon={Star}>Enhanced Discovery</NavItem>
          <NavItem href="/bandsintown" icon={Users}>Bandsintown</NavItem>

          <Separator className="my-2" />

          <div className="px-2 py-1.5 text-sm font-semibold">Touring</div>
          <NavItem href="/tours" icon={Route}>Tours</NavItem>
          <NavItem href="/tour/create" icon={MapPin}>Create Tour</NavItem>
          <NavItem href="/opportunities" icon={Compass}>Opportunities</NavItem>
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-1">
        <NavItem href="/profile" icon={UserCircle}>Profile</NavItem>
        <NavItem href="/settings" icon={Settings}>Settings</NavItem>
      </div>
    </div>
  );
}