
import { Link, useLocation } from "wouter";
import { CalendarDays, Home, Music, Search, MapPin } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const MobileNavigation = () => {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  // Check if we're on a venue profile page
  const isOnVenueProfile = location.startsWith('/venues/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border shadow-lg flex justify-around items-center py-2 z-50">
      <Link href="/dashboard">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/dashboard") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <Home size={20} strokeWidth={2} />
          <span className="text-[0.6rem] mt-1">Dashboard</span>
        </span>
      </Link>

      <Link href="/artist-discovery">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/artist-discovery") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <Search size={20} strokeWidth={2} />
          <span className="text-[0.6rem] mt-1">Discover</span>
        </span>
      </Link>

      {/* Link to the active venue's profile */}
      <Link href={activeVenue ? `/venues/${activeVenue.id}` : "/venues"}>
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isOnVenueProfile ? "text-primary font-medium" : "text-foreground/60"}`}>
          <MapPin size={20} strokeWidth={2} />
          <span className="text-[0.6rem] mt-1">My Venue</span>
        </span>
      </Link>

      <Link href="/calendar">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/calendar") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <CalendarDays size={20} strokeWidth={2} />
          <span className="text-[0.6rem] mt-1">Calendar</span>
        </span>
      </Link>
    </nav>
  );
};

export default MobileNavigation;
