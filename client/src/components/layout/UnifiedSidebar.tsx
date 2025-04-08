
import React from "react";
import { Link, useLocation } from "wouter";
import { Building2, BarChart3, Network, Calendar, ExternalLink, Mail, Phone, Menu } from "lucide-react";
import { 
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function UnifiedSidebar() {
  const [location] = useLocation();
  const { activeVenue } = useActiveVenue();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">TourSync</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-manager'}
              tooltip="Venue Manager"
            >
              <Link href="/venue-manager" className="w-full">
                <Building2 className="h-4 w-4" />
                <span>Venue Manager</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-analytics'}
              tooltip="Analytics"
            >
              <Link href="/venue-analytics" className="w-full">
                <BarChart3 className="h-4 w-4" />
                <span>Venue Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-connections'}
              tooltip="Connections"
            >
              <Link href="/venue-connections" className="w-full">
                <Network className="h-4 w-4" />
                <span>Venue Connections</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {activeVenue && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-4 space-y-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">{activeVenue.name}</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {activeVenue.address}
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="outline">Capacity {activeVenue.capacity}</Badge>
                </div>
                
                <div className="space-y-2">
                  <a href={`mailto:${activeVenue.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Mail className="h-4 w-4" />
                    {activeVenue.email}
                  </a>
                  <a href={`tel:${activeVenue.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Phone className="h-4 w-4" />
                    {activeVenue.phone}
                  </a>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Network className="h-4 w-4 mr-2" />
                    Network
                  </Button>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
