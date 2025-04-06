import { Link, useLocation } from "wouter";
import { CalendarDays, Map, Music, User, Building2 } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="md:hidden bg-white border-t border-gray-200 flex justify-around py-2">
      <Link href="/">
        <button className={`p-2 flex flex-col items-center ${isActive("/") || isActive("/dashboard") ? "text-primary" : "text-gray-500"}`}>
          <CalendarDays size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </button>
      </Link>
      
      <Link href="/venues">
        <button className={`p-2 flex flex-col items-center ${isActive("/venues") || isActive("/venue") ? "text-primary" : "text-gray-500"}`}>
          <Building2 size={20} />
          <span className="text-xs mt-1">Venues</span>
        </button>
      </Link>
      
      <Link href="/bands">
        <button className={`p-2 flex flex-col items-center ${isActive("/bands") ? "text-primary" : "text-gray-500"}`}>
          <Music size={20} />
          <span className="text-xs mt-1">Bands</span>
        </button>
      </Link>
      
      <Link href="/profile">
        <button className={`p-2 flex flex-col items-center ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </Link>
    </div>
  );
};

export default MobileNavigation;
