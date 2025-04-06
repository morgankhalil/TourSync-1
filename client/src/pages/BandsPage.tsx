
import { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import MapView from "@/components/maps/BandMapView";
import Sidebar from "@/components/layout/Sidebar";

const BandsPage = () => {
  const { openSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isMobile) {
      openSidebar();
    }
  }, [isMobile, openSidebar]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <MapView />
    </div>
  );
};

export default BandsPage;
