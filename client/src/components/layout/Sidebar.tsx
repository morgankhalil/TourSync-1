import { Plus, Edit, MoreVertical } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Link } from "wouter";
import TourDatesList from "../tour/TourDatesList";
import TourStats from "../tour/TourStats";
import { useTours } from "@/hooks/useTours";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeTour, isLoading } = useTours();

  // Determine the sidebar classes based on mobile and open state
  const sidebarClasses = isMobile
    ? `${isSidebarOpen ? "fixed inset-0 z-50" : "hidden"} bg-sidebar-bg w-full overflow-y-auto custom-scrollbar`
    : "hidden md:block bg-sidebar-bg w-80 border-r border-gray-200 flex-shrink-0 overflow-y-auto custom-scrollbar";

  return (
    <aside className={sidebarClasses}>
      {isMobile && isSidebarOpen && (
        <button 
          onClick={closeSidebar} 
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      )}

      <div className="p-4">
        <div className="mb-6">
          <h2 className="font-inter font-semibold text-lg mb-4">Tour Schedule</h2>
          <Link href="/create-tour">
            <Button className="w-full bg-primary text-white py-2 px-4 rounded-md font-inter font-medium flex items-center justify-center">
              <Plus size={16} className="mr-2" />
              Create New Tour
            </Button>
          </Link>
          
          {/* Current Tour */}
          {isLoading ? (
            <div className="mt-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : activeTour ? (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-inter font-medium">{activeTour.name}</h3>
                <div className="flex">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-700 ml-1">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {format(new Date(activeTour.startDate), "MMM d")} - {format(new Date(activeTour.endDate), "MMM d, yyyy")}
              </p>
            </div>
          ) : (
            <div className="mt-4 text-gray-500">No active tour found</div>
          )}
        </div>

        {/* Tour Dates */}
        <TourDatesList />

        {/* Tour Stats */}
        <TourStats />
      </div>
    </aside>
  );
};

export default Sidebar;
