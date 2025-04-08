
import { ReactNode } from "react";
import UnifiedSidebar from "./UnifiedSidebar";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="flex flex-1">
      <UnifiedSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
