
import React from "react";
import { Link, useLocation } from "wouter";
import { Building2, BarChart3, Network, Calendar, ExternalLink, Mail, Phone, Menu, MapPin } from "lucide-react";
import VenueSelector from "@/components/venue/VenueSelector";
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
        <div className="flex flex-col gap-4 p-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">TourSync</h2>
          <VenueSelector />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-manager'}
              tooltip="Venue Manager"
              size="lg"
            >
              <Link href="/venue-manager" className="w-full">
                <Building2 className="h-5 w-5" />
                <span>Venue Manager</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-analytics'}
              tooltip="Analytics"
              size="lg"
            >
              <Link href="/venue-analytics" className="w-full">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/venue-connections'}
              tooltip="Connections"
              size="lg"
            >
              <Link href="/venue-connections" className="w-full">
                <Network className="h-5 w-5" />
                <span>Network</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/calendar'}
              tooltip="Calendar"
              size="lg"
            >
              <Link href="/calendar" className="w-full">
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === '/tour-finder'}
              tooltip="Tour Finder"
              size="lg"
            >
              <Link href="/tour-finder" className="w-full">
                <MapPin className="h-5 w-5" />
                <span>Tour Finder</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {activeVenue && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mt-4 p-4 space-y-4 bg-card rounded-xl border shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium truncate">{activeVenue.name}</span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {activeVenue.address}
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    Capacity {activeVenue.capacity}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <a href={`mailto:${activeVenue.email}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{activeVenue.email}</span>
                  </a>
                  <a href={`tel:${activeVenue.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{activeVenue.phone}</span>
                  </a>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 h-9">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-9">
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
