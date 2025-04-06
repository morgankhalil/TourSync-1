import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Tour, Venue } from '../types';
import VenueMapView from '../components/maps/VenueMapView';
import VenueBookingsList from '../components/venue/VenueBookingsList';
import TourDetailModal from '../components/tour/TourDetailModal';
import { Spinner } from '../components/ui/spinner';

const VenueView = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    async function fetchVenue() {
      if (!id) return;
      
      try {
        const venueId = parseInt(id);
        if (isNaN(venueId)) {
          console.error('Invalid venue ID');
          return;
        }
        
        const response = await fetch(`/api/venues/${venueId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch venue');
        }
        
        const data = await response.json();
        setVenue(data);
      } catch (error) {
        console.error('Error fetching venue:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVenue();
  }, [id]);
  
  const handleTourClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  if (!venue) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground">The venue you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Map section (left side on desktop, top on mobile) */}
      <div className="w-full md:w-1/2 h-[400px] md:h-full">
        <VenueMapView venue={venue} onTourClick={handleTourClick} />
      </div>
      
      {/* Bookings list (right side on desktop, bottom on mobile) */}
      <div className="w-full md:w-1/2 p-6 overflow-auto">
        <VenueBookingsList venueId={venue.id} onTourClick={handleTourClick} />
      </div>
      
      {/* Tour detail modal */}
      <TourDetailModal 
        tour={selectedTour} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default VenueView;