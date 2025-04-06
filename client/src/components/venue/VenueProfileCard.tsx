import React from 'react';
import { Venue } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Music, Calendar, Info, Phone, Mail, Settings, Package, DollarSign, Link as LinkIcon } from 'lucide-react';

interface VenueProfileCardProps {
  venue: Venue;
  className?: string;
}

export const VenueProfileCard: React.FC<VenueProfileCardProps> = ({ venue, className = '' }) => {
  // Extract basic venue information
  const { 
    name, 
    address, 
    city, 
    state, 
    capacity,
    contactName,
    contactEmail,
    contactPhone,
    website,
    description,
    genre,
    technicalSpecs = {},
    venueType = '',
    amenities = [],
    preferredGenres = []
  } = venue;

  // Convert JSON data to proper format
  const techSpecs = technicalSpecs as Record<string, any> || {};
  const venueAmenities = amenities as string[] || [];
  const preferredGenresList = preferredGenres as string[] || [];
  const genresToShow = preferredGenresList.length > 0 ? preferredGenresList : (genre ? [genre] : []);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-xl flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          {name}
        </CardTitle>
        <CardDescription className="text-primary-foreground/90">
          {address}, {city}, {state}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Venue Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            {description || "No description available."}
          </p>
          
          <div className="flex items-center text-sm mt-2">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{capacity || 'Unknown'} capacity</span>
          </div>
          
          {venueType && (
            <div className="flex items-center text-sm">
              <Package className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{venueType} venue</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Genre Preferences */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <Music className="mr-2 h-4 w-4" />
            Music Preferences
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {genresToShow.length > 0 ? (
              genresToShow.map((g, i) => (
                <Badge key={i} variant="secondary">{g}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No genre preferences specified</span>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Technical Specs */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Technical Specifications
          </h3>
          
          {Object.keys(techSpecs).length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(techSpecs).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Technical specifications not available</p>
          )}
        </div>
        
        {/* Amenities */}
        {venueAmenities.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {venueAmenities.map((amenity, i) => (
                  <Badge key={i} variant="outline">{amenity}</Badge>
                ))}
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Contact Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Contact Information</h3>
          
          {contactName && (
            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{contactName}</span>
            </div>
          )}
          
          {contactEmail && (
            <div className="flex items-center text-sm">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{contactEmail}</span>
            </div>
          )}
          
          {contactPhone && (
            <div className="flex items-center text-sm">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{contactPhone}</span>
            </div>
          )}
          
          {website && (
            <div className="flex items-center text-sm">
              <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Check Availability
          </Button>
          <Button size="sm" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Contact Venue
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};