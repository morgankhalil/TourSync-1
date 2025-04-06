// Re-export types from shared schema
import {
  Band,
  InsertBand,
  Venue,
  InsertVenue,
  Tour,
  InsertTour,
  TourDate,
  InsertTourDate,
  VenueAvailability,
  InsertVenueAvailability
} from '../../shared/schema';

// Export all types
export type {
  Band,
  InsertBand,
  Venue,
  InsertVenue,
  Tour,
  InsertTour,
  TourDate,
  InsertTourDate,
  VenueAvailability,
  InsertVenueAvailability
};

// Add any client-specific types below
export interface PastPerformance {
  id: string;
  bandName: string;
  date: Date | string;
  attendance: number;
  revenue: number;
  notes: string;
}

export interface VenueWithPerformances extends Venue {
  pastPerformances?: PastPerformance[];
}

export interface BandWithTourDates extends Band {
  tourDates?: TourDate[];
}