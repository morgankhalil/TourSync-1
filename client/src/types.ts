// Core entity types

export interface Band {
  id: number;
  name: string;
  contactEmail: string;
  contactPhone: string | null;
  description: string | null;
  genre: string | null;
  location?: string;
  formationYear?: number;
  bandsintownId?: string;
  website?: string;
  social: any;
  drawSize: number | null;
  pastVenues: any;
  technicalRequirements: any;
  imageUrl: string | null;
  videoUrl: string | null;
  preferredVenueTypes: any;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  capacity: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  genre: string | null;
  location?: string;
  imageUrl: string | null;
  website: string | null;
  socialMedia: any;
  paymentTerms: any;
  minimumDraw: number | null;
  amenities: any;
  stageDimensions: any;
  technicalSpecs: any;
  accessibility: any;
  parkingInfo: any;
  nearbyAccommodation: any;
  foodOptions: any;
  loadingInfo: any;
  priceRange: any;
}

export interface Tour {
  id: number;
  name: string;
  bandId: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  isActive: boolean | null;
  description?: string;
  estimatedShowCount?: number;
  estimatedDurationDays?: number;
  distanceToVenue?: number;
}

export interface TourDate {
  id: number;
  tourId: number;
  date: string;
  city: string;
  state: string;
  venueId: number | null;
  venueName: string | null;
  status: string | null;
  notes: string | null;
  isOpenDate: boolean | null;
  title?: string;
  bandId?: number;
  latitude?: string | number;
  longitude?: string | number;
}

export interface VenueAvailability {
  id: number;
  venueId: number;
  date: string;
  isAvailable: boolean;
  notes: string | null;
}

export interface PastPerformance {
  id: string;
  bandName: string;
  date: Date | string;
  attendance: number;
  revenue: number;
  notes: string;
}

// Extended types with relationships

export interface VenueWithPerformances extends Venue {
  pastPerformances?: PastPerformance[];
}

export interface BandWithTourDates extends Band {
  tourDates?: TourDate[];
}

// Route and mapping types

export interface RouteAnalysis {
  origin: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  destination: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  distanceToVenue: number;
  detourDistance: number;
  daysAvailable: number;
}

export interface BandPassingNearby {
  band: Band;
  route: RouteAnalysis;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type: 'venue' | 'tourDate' | 'origin' | 'destination' | 'detour';
  icon?: string;
  venue?: Venue;
  tourDate?: TourDate;
}

export interface MapPolyline {
  id: string;
  path: Array<{
    lat: number;
    lng: number;
  }>;
  options?: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    geodesic?: boolean;
  };
}

// Bandsintown API types

export interface ArtistEvent {
  id: string;
  url: string;
  datetime: string;
  title: string;
  description: string | null;
  venue: {
    name: string;
    location: string;
    city: string;
    region: string;
    country: string;
    latitude: string;
    longitude: string;
  };
  lineup: string[];
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
}

export interface Artist {
  id: string;
  name: string;
  url: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url: string;
  mbid: string;
  tracker_count: number;
  upcoming_event_count: number;
}

export interface ImportResult {
  band: Band | null;
  tour: Tour | null;
  tourDates: TourDate[];
  success: boolean;
  message: string;
}

export interface VenueImportResult {
  venue: Venue;
  isNew: boolean;
}

export interface DiscoveryResult {
  band: Band;
  route: RouteAnalysis;
  tour: Tour;
  alreadyContacted?: boolean;
}

export interface BandDiscoveryResult {
  name: string;
  image: string;
  url: string;
  upcomingEvents: number;
  route: RouteAnalysis;
  events: any[];
}