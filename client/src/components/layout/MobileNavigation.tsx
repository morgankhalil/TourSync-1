
import { Link, useLocation } from "wouter";
import { CalendarDays, Map, Music, User, Building2, BarChart3 } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50">
      <Link href="/">
        <a className={`p-2 flex flex-col items-center ${isActive("/") || isActive("/dashboard") ? "text-primary" : "text-gray-500"}`}>
          <CalendarDays size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </a>
      </Link>
      
      <Link href="/venues">
        <a className={`p-2 flex flex-col items-center ${isActive("/venues") || isActive("/venue") ? "text-primary" : "text-gray-500"}`}>
          <Building2 size={20} />
          <span className="text-xs mt-1">Venues</span>
        </a>
      </Link>
      
      <Link href="/bands">
        <a className={`p-2 flex flex-col items-center ${isActive("/bands") ? "text-primary" : "text-gray-500"}`}>
          <Music size={20} />
          <span className="text-xs mt-1">Bands</span>
        </a>
      </Link>
      
      <Link href="/tour-dashboard">
        <a className={`p-2 flex flex-col items-center ${isActive("/tour-dashboard") ? "text-primary" : "text-gray-500"}`}>
          <BarChart3 size={20} />
          <span className="text-xs mt-1">Tour</span>
        </a>
      </Link>
      
      <Link href="/profile">
        <a className={`p-2 flex flex-col items-center ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </a>
      </Link>
    </nav>
  );
};

export default MobileNavigation;
