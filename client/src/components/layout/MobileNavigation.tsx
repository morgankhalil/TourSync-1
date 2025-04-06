import { Link, useLocation } from "wouter";
import { CalendarDays, Map, Compass, User, Building2 } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="md:hidden bg-white border-t border-gray-200 flex justify-around py-2">
      <Link href="/">
        <button className={`p-2 flex flex-col items-center ${isActive("/") ? "text-primary" : "text-gray-500"}`}>
          <CalendarDays size={20} />
          <span className="text-xs mt-1">Schedule</span>
        </button>
      </Link>
      
      <Link href="/venue">
        <button className={`p-2 flex flex-col items-center ${isActive("/venue") ? "text-primary" : "text-gray-500"}`}>
          <Building2 size={20} />
          <span className="text-xs mt-1">Venue</span>
        </button>
      </Link>
      
      <Link href="/discover">
        <button className={`p-2 flex flex-col items-center ${isActive("/discover") ? "text-primary" : "text-gray-500"}`}>
          <Compass size={20} />
          <span className="text-xs mt-1">Discover</span>
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
