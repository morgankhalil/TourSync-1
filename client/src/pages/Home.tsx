import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MapView from "@/components/maps/MapView";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";

const Home = () => {
  const { openSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Automatically open sidebar on desktop, ensure closed on mobile
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isMobile, openSidebar, closeSidebar]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <MapView />
    </div>
  );
};

export default Home;
