
import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, Calendar, Search, Network } from "lucide-react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export default function VenueSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Venue Management</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <a className={`flex items-center gap-2 ${location === '/' ? 'text-primary' : ''}`}>
                <Menu size={20} />
                Dashboard
              </a>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/calendar">
              <a className={`flex items-center gap-2 ${location === '/calendar' ? 'text-primary' : ''}`}>
                <Calendar size={20} />
                Calendar
              </a>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venues/search">
              <a className={`flex items-center gap-2 ${location === '/venues/search' ? 'text-primary' : ''}`}>
                <Search size={20} />
                Find Venues
              </a>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/venue-network">
              <a className={`flex items-center gap-2 ${location === '/venue-network' ? 'text-primary' : ''}`}>
                <Network size={20} />
                Venue Network
              </a>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
