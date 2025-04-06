import React from 'react';
import { Band, Venue } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Music, Calendar, User, Mail, Phone, HeadphonesIcon, 
  Users, DollarSign, Ticket, BarChart, Building, MapPin 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getMatchDetails, calculateBandVenueMatch } from '@/utils/matchingAlgorithm';
import { format } from 'date-fns';

interface BandDetailCardProps {
  band: Band;
  venue?: Venue; // Optional venue for matching
  className?: string;
  showMatchDetails?: boolean;
}

export const BandDetailCard: React.FC<BandDetailCardProps> = ({ 
  band, 
  venue, 
  className = '',
  showMatchDetails = false
}) => {
  // Extract band information
  const { 
    name, 
    description, 
    contactEmail, 
    contactPhone, 
    genre,
    social,
    drawSize,
    technicalRequirements,
    mediaLinks,
    lastTourDate,
    avgTicketPrice,
    pressKit
  } = band;

  // Format social media links
  const socialLinks = social as Record<string, string> || {};
  
  // Format technical requirements
  const techRequirements = technicalRequirements as Record<string, any> || {};
  
  // Format media links
  const media = mediaLinks as Record<string, string> || {};
  
  // Calculate match if venue is provided
  const matchPercentage = venue ? calculateBandVenueMatch(band, venue) : null;
  const matchDetails = venue && showMatchDetails ? getMatchDetails(band, venue) : [];

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Music className="mr-2 h-5 w-5" />
              {name}
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              {genre || 'Genre not specified'} • {drawSize ? `${drawSize} average draw` : 'Draw size unknown'}
            </CardDescription>
          </div>
          
          {matchPercentage !== null && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {matchPercentage}% match
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Band Overview</h3>
          <p className="text-sm text-muted-foreground">
            {description || "No description available."}
          </p>
        </div>
        
        {/* Match Details (if venue provided) */}
        {venue && showMatchDetails && matchDetails.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Why This Band Matches {venue.name}</h3>
              
              {matchDetails.map((detail, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{detail.criteria}</span>
                    <span>{Math.round(detail.score)}%</span>
                  </div>
                  <Progress value={detail.score} className="h-1.5 w-full" />
                  <p className="text-xs text-muted-foreground">{detail.explanation}</p>
                </div>
              ))}
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Technical Requirements */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Technical Requirements</h3>
          
          {Object.keys(techRequirements).length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(techRequirements).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Technical requirements not specified</p>
          )}
        </div>
        
        <Separator />
        
        {/* Draw and Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Audience Draw
            </h3>
            <div className="text-2xl font-bold">
              {drawSize ? drawSize.toLocaleString() : 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">Average attendance</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Ticket className="mr-2 h-4 w-4" />
              Typical Pricing
            </h3>
            <div className="text-2xl font-bold">
              {avgTicketPrice ? `$${(avgTicketPrice / 100).toFixed(2)}` : 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">Average ticket price</p>
          </div>
        </div>
        
        {/* Last Tour Date */}
        {lastTourDate && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Recent Activity
              </h3>
              <div className="flex items-center text-sm">
                <span className="font-medium mr-2">Last tour date:</span>
                <span>{format(new Date(lastTourDate), 'MMMM d, yyyy')}</span>
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Contact Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Contact Information</h3>
          
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
        </div>
        
        {/* Media Links */}
        {Object.keys(media).length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <HeadphonesIcon className="mr-2 h-4 w-4" />
                Media Links
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(media).map(([platform, url]) => (
                  <a 
                    key={platform} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between w-full">
          {pressKit ? (
            <Button variant="outline" size="sm" className="flex items-center" 
              onClick={() => window.open(pressKit, '_blank', 'noopener,noreferrer')}>
              <User className="mr-2 h-4 w-4" />
              Press Kit
            </Button>
          ) : (
            <span></span>
          )}
          
          <Button size="sm" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};