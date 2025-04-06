import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tour, Venue } from '../types';
import VenueMapView from '../components/maps/VenueMapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Music, MapPin, Users, Tag } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import TourDetailModal from '../components/tour/TourDetailModal';
import { Badge } from '@/components/ui/badge';

const VenueView = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTour, setSelectedTour] = React.useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || null);
  };

  const { data: venue, isLoading: isVenueLoading } = useQuery<Venue>({
    queryKey: [`/api/venues/${id}`],
    enabled: !!id,
  });

  const { data: availabilities } = useQuery({
    queryKey: [`/api/venues/${id}/availability`],
    enabled: !!id,
  });

  const { data: nearbyTours } = useQuery({
    queryKey: [`/api/venues/${id}/nearby-tours`],
    enabled: !!id,
  });

  if (isVenueLoading || !venue) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleTourClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Left Column - Venue Details */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-2xl">{venue.name}</CardTitle>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            {venue.address}, {venue.city}, {venue.state}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-primary" />
              <span>Capacity: {venue.capacity}</span>
            </div>
            {venue.dealType && (
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-primary" />
                <span>Deal: {venue.dealType}</span>
              </div>
            )}
            {venue.genre && (
              <div className="flex items-center col-span-2">
                <Music className="w-4 h-4 mr-2 text-primary" />
                <Badge variant="secondary">{venue.genre}</Badge>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{venue.description || "No description available."}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-1 text-sm">
                {venue.contactName && <p>Contact: {venue.contactName}</p>}
                {venue.contactEmail && <p>Email: {venue.contactEmail}</p>}
                {venue.contactPhone && <p>Phone: {venue.contactPhone}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Column - Map */}
      <Card className="h-[calc(100vh-7rem)]">
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <VenueMapView venue={venue} onTourClick={handleTourClick} selectedDate={selectedDate} />
        </CardContent>
      </Card>

      {/* Right Column - Availability & Tours */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {availabilities && availabilities.length > 0 ? (
              <div className="space-y-2">
                {availabilities.map((availability, index) => (
                  <Button key={index} onClick={() => handleDateSelect(new Date(availability.date))} className="w-full justify-start text-left">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(availability.date), 'MMM d, yyyy')}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No available dates</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nearby Tours</CardTitle>
          </CardHeader>
          <CardContent>
            {nearbyTours && nearbyTours.length > 0 ? (
              <div className="space-y-2">
                {nearbyTours.map((tour) => (
                  <Button
                    key={tour.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleTourClick(tour)}
                  >
                    <div>
                      <p className="font-medium">{tour.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tour.startDate), 'MMM d')} - {format(new Date(tour.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No nearby tours</p>
            )}
          </CardContent>
        </Card>
      </div>

      <TourDetailModal
        tour={selectedTour}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default VenueView;