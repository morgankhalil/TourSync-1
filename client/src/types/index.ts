// Type definitions for the application

export interface Band {
  id: number;
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  genre?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  genre?: string;
  dealType?: string;
  latitude: string;
  longitude: string;
}

export interface Tour {
  id: number;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  bandId: number;
  notes?: string;
  isActive: boolean;
}

export interface TourDate {
  id: number;
  tourId: number;
  venueId?: number;
  date: string | Date;
  city: string;
  state: string;
  status: string; // "open", "pending", "confirmed"
  notes?: string;
  venueName?: string;
  isOpenDate: boolean;
}

export interface VenueAvailability {
  id: number;
  venueId: number;
  date: string | Date;
  isAvailable: boolean;
}
