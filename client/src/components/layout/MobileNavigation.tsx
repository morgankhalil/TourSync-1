import { Link, useLocation } from "wouter";
import { CalendarDays, Map, Music, User, Building2, BarChart3 } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border shadow-lg flex justify-around items-center py-3 z-50">
      <Link href="/">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/") || isActive("/dashboard") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <CalendarDays size={20} />
          <span className="text-[0.7rem] mt-1">Dashboard</span>
        </span>
      </Link>

      <Link href="/venues">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/venues") || isActive("/venue") ? "text-primary font-medium" : "text-foreground/60"}`}>
          <Building2 size={20} />
          <span className="text-xs mt-1">Venues</span>
        </span>
      </Link>

      <Link href="/bands">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/bands") ? "text-primary" : "text-gray-500"}`}>
          <Music size={20} />
          <span className="text-xs mt-1">Bands</span>
        </span>
      </Link>

      <Link href="/tour-dashboard">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/tour-dashboard") ? "text-primary" : "text-gray-500"}`}>
          <BarChart3 size={20} />
          <span className="text-xs mt-1">Tour</span>
        </span>
      </Link>

      <Link href="/profile">
        <span className={`p-2 flex flex-col items-center cursor-pointer ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </span>
      </Link>
    </nav>
  );
};

export default MobileNavigation;