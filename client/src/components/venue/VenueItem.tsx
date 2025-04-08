import { Venue } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, DollarSign, Music } from "lucide-react";
import { cn } from "../../lib/utils";

interface VenueItemProps {
  venue: Venue;
  onClick?: () => void;
  isSelected?: boolean;
}

const VenueItem = ({ venue, onClick, isSelected = false }: VenueItemProps) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex flex-col">
            <h4 className="text-base font-medium">{venue.name}</h4>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {venue.capacity && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{venue.capacity}</span>
              </Badge>
            )}
            
            {venue.dealType && (
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{venue.dealType}</span>
              </Badge>
            )}
            
            {venue.genre && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                <span>{venue.genre}</span>
              </Badge>
            )}
          </div>
        </div>
        
        {venue.description && (
          <p className="text-sm text-muted-foreground mt-2">{venue.description}</p>
        )}
        
        {venue.contactName && (
          <div className="text-sm mt-2">
            <span className="font-medium">Contact:</span> {venue.contactName} 
            {venue.contactEmail && <span> ({venue.contactEmail})</span>}
            {venue.contactPhone && <span> | {venue.contactPhone}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueItem;