
import { ReactNode } from "react";
import VenueSidebar from "./VenueSidebar";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="flex flex-1">
      <VenueSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
