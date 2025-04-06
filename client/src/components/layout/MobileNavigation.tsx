import { Link, useLocation } from "wouter";
import { CalendarDays, Star, Music, User, Bell, Inbox, Compass } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const MobileNavigation = () => {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  const isActive = (path: string) => {
    return location === path;
  };

  // Check if we're on a venue profile page
  const isOnVenueProfile = location.startsWith('/venues/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border shadow-lg flex justify-around items-center py-3 z-50">
      <Link href="/dashboard">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/dashboard") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <CalendarDays size={20} />
          <span className="text-[0.7rem] mt-1">Dashboard</span>
        </span>
      </Link>

      <Link href="/artist-discovery">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/artist-discovery") || isActive("/opportunities") || isActive("/bands") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <Music size={20} />
          <span className="text-[0.7rem] mt-1">Discovery</span>
        </span>
      </Link>

      {/* Link to the active venue's profile */}
      <Link href={activeVenue ? `/venues/${activeVenue.id}` : "/venues"}>
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isOnVenueProfile ? "text-primary font-medium" : "text-foreground/60"}`}>
          <Star size={20} />
          <span className="text-xs mt-1">My Venue</span>
        </span>
      </Link>

      <Link href="/calendar">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/calendar") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <CalendarDays size={20} />
          <span className="text-xs mt-1">Calendar</span>
        </span>
      </Link>
    </nav>
  );
};

export default MobileNavigation;