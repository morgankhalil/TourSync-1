import { 
  bands, type Band, type InsertBand,
  venues, type Venue, type InsertVenue,
  tours, type Tour, type InsertTour,
  tourDates, type TourDate, type InsertTourDate,
  venueAvailability, type VenueAvailability, type InsertVenueAvailability
} from "@shared/schema";

export interface IStorage {
  // Band operations
  getBand(id: number): Promise<Band | undefined>;
  getBands(): Promise<Band[]>;
  createBand(band: InsertBand): Promise<Band>;
  updateBand(id: number, band: Partial<InsertBand>): Promise<Band | undefined>;
  deleteBand(id: number): Promise<boolean>;
  
  // Venue operations
  getVenue(id: number): Promise<Venue | undefined>;
  getVenues(): Promise<Venue[]>;
  getVenuesByLocation(lat: number, lng: number, radius: number): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: number): Promise<boolean>;
  
  // Tour operations
  getTour(id: number): Promise<Tour | undefined>;
  getTours(bandId?: number): Promise<Tour[]>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: number): Promise<boolean>;
  
  // Tour date operations
  getTourDate(id: number): Promise<TourDate | undefined>;
  getTourDates(tourId: number): Promise<TourDate[]>;
  createTourDate(tourDate: InsertTourDate): Promise<TourDate>;
  updateTourDate(id: number, tourDate: Partial<InsertTourDate>): Promise<TourDate | undefined>;
  deleteTourDate(id: number): Promise<boolean>;
  
  // Venue availability operations
  getVenueAvailability(venueId: number): Promise<VenueAvailability[]>;
  createVenueAvailability(venueAvailability: InsertVenueAvailability): Promise<VenueAvailability>;
  updateVenueAvailability(id: number, venueAvailability: Partial<InsertVenueAvailability>): Promise<VenueAvailability | undefined>;
  deleteVenueAvailability(id: number): Promise<boolean>;
  
  // Specialized operations
  findAvailableVenuesBetweenDates(startDate: Date, endDate: Date, startLat: number, startLng: number, endLat: number, endLng: number, radius: number): Promise<Venue[]>;
  findVenuesAlongRoute(waypoints: {lat: number, lng: number}[], radius: number): Promise<Venue[]>;
  getTourStats(tourId: number): Promise<{totalShows: number, confirmed: number, pending: number, openDates: number}>;
}

// Helper to calculate distance between two points using haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export class MemStorage implements IStorage {
  private bandsData: Map<number, Band>;
  private venuesData: Map<number, Venue>;
  private toursData: Map<number, Tour>;
  private tourDatesData: Map<number, TourDate>;
  private venueAvailabilityData: Map<number, VenueAvailability>;
  private bandIdCounter: number;
  private venueIdCounter: number;
  private tourIdCounter: number;
  private tourDateIdCounter: number;
  private venueAvailabilityIdCounter: number;

  constructor() {
    this.bandsData = new Map();
    this.venuesData = new Map();
    this.toursData = new Map();
    this.tourDatesData = new Map();
    this.venueAvailabilityData = new Map();
    this.bandIdCounter = 1;
    this.venueIdCounter = 1;
    this.tourIdCounter = 1;
    this.tourDateIdCounter = 1;
    this.venueAvailabilityIdCounter = 1;

    // Initialize with sample data for demo purposes
    this.initializeSampleData();
  }

  // Band operations
  async getBand(id: number): Promise<Band | undefined> {
    return this.bandsData.get(id);
  }

  async getBands(): Promise<Band[]> {
    return Array.from(this.bandsData.values());
  }

  async createBand(band: InsertBand): Promise<Band> {
    const id = this.bandIdCounter++;
    const newBand = { ...band, id };
    this.bandsData.set(id, newBand);
    return newBand;
  }

  async updateBand(id: number, band: Partial<InsertBand>): Promise<Band | undefined> {
    const existingBand = this.bandsData.get(id);
    if (!existingBand) return undefined;
    
    const updatedBand = { ...existingBand, ...band };
    this.bandsData.set(id, updatedBand);
    return updatedBand;
  }

  async deleteBand(id: number): Promise<boolean> {
    return this.bandsData.delete(id);
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venuesData.get(id);
  }

  async getVenues(): Promise<Venue[]> {
    return Array.from(this.venuesData.values());
  }

  async getVenuesByLocation(lat: number, lng: number, radius: number): Promise<Venue[]> {
    const venues = Array.from(this.venuesData.values());
    return venues.filter(venue => {
      const distance = calculateDistance(
        lat, 
        lng, 
        parseFloat(venue.latitude), 
        parseFloat(venue.longitude)
      );
      return distance <= radius;
    });
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const id = this.venueIdCounter++;
    const newVenue = { ...venue, id };
    this.venuesData.set(id, newVenue);
    return newVenue;
  }

  async updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existingVenue = this.venuesData.get(id);
    if (!existingVenue) return undefined;
    
    const updatedVenue = { ...existingVenue, ...venue };
    this.venuesData.set(id, updatedVenue);
    return updatedVenue;
  }

  async deleteVenue(id: number): Promise<boolean> {
    return this.venuesData.delete(id);
  }

  // Tour operations
  async getTour(id: number): Promise<Tour | undefined> {
    return this.toursData.get(id);
  }

  async getTours(bandId?: number): Promise<Tour[]> {
    let tours = Array.from(this.toursData.values());
    if (bandId) {
      tours = tours.filter(tour => tour.bandId === bandId);
    }
    return tours;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const id = this.tourIdCounter++;
    const newTour = { ...tour, id };
    this.toursData.set(id, newTour);
    return newTour;
  }

  async updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const existingTour = this.toursData.get(id);
    if (!existingTour) return undefined;
    
    const updatedTour = { ...existingTour, ...tour };
    this.toursData.set(id, updatedTour);
    return updatedTour;
  }

  async deleteTour(id: number): Promise<boolean> {
    return this.toursData.delete(id);
  }

  // Tour date operations
  async getTourDate(id: number): Promise<TourDate | undefined> {
    return this.tourDatesData.get(id);
  }

  async getTourDates(tourId: number): Promise<TourDate[]> {
    const tourDates = Array.from(this.tourDatesData.values());
    return tourDates.filter(tourDate => tourDate.tourId === tourId);
  }

  async createTourDate(tourDate: InsertTourDate): Promise<TourDate> {
    const id = this.tourDateIdCounter++;
    const newTourDate = { ...tourDate, id };
    this.tourDatesData.set(id, newTourDate);
    return newTourDate;
  }

  async updateTourDate(id: number, tourDate: Partial<InsertTourDate>): Promise<TourDate | undefined> {
    const existingTourDate = this.tourDatesData.get(id);
    if (!existingTourDate) return undefined;
    
    const updatedTourDate = { ...existingTourDate, ...tourDate };
    this.tourDatesData.set(id, updatedTourDate);
    return updatedTourDate;
  }

  async deleteTourDate(id: number): Promise<boolean> {
    return this.tourDatesData.delete(id);
  }

  // Venue availability operations
  async getVenueAvailability(venueId: number): Promise<VenueAvailability[]> {
    const availabilities = Array.from(this.venueAvailabilityData.values());
    return availabilities.filter(availability => availability.venueId === venueId);
  }

  async createVenueAvailability(venueAvailability: InsertVenueAvailability): Promise<VenueAvailability> {
    const id = this.venueAvailabilityIdCounter++;
    const newVenueAvailability = { ...venueAvailability, id };
    this.venueAvailabilityData.set(id, newVenueAvailability);
    return newVenueAvailability;
  }

  async updateVenueAvailability(id: number, venueAvailability: Partial<InsertVenueAvailability>): Promise<VenueAvailability | undefined> {
    const existingVenueAvailability = this.venueAvailabilityData.get(id);
    if (!existingVenueAvailability) return undefined;
    
    const updatedVenueAvailability = { ...existingVenueAvailability, ...venueAvailability };
    this.venueAvailabilityData.set(id, updatedVenueAvailability);
    return updatedVenueAvailability;
  }

  async deleteVenueAvailability(id: number): Promise<boolean> {
    return this.venueAvailabilityData.delete(id);
  }

  // Specialized operations
  async findAvailableVenuesBetweenDates(
    startDate: Date, 
    endDate: Date, 
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number,
    radius: number
  ): Promise<Venue[]> {
    // Calculate midpoint between start and end locations
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    
    // Get venues near the midpoint
    const nearbyVenues = await this.getVenuesByLocation(midLat, midLng, radius);

    // Check availabilities within date range
    const availableVenues: Venue[] = [];
    
    for (const venue of nearbyVenues) {
      const availabilities = await this.getVenueAvailability(venue.id);
      
      // Check if venue has availabilities within the date range
      const hasAvailability = availabilities.some(a => {
        const availDate = new Date(a.date);
        return a.isAvailable && 
               availDate >= startDate && 
               availDate <= endDate;
      });
      
      if (hasAvailability) {
        availableVenues.push(venue);
      }
    }
    
    return availableVenues;
  }

  async findVenuesAlongRoute(waypoints: {lat: number, lng: number}[], radius: number): Promise<Venue[]> {
    const allVenues = await this.getVenues();
    const routeVenues = new Map<number, Venue>();
    
    // For each waypoint, find venues within radius
    for (const waypoint of waypoints) {
      const nearbyVenues = allVenues.filter(venue => {
        const distance = calculateDistance(
          waypoint.lat, 
          waypoint.lng, 
          parseFloat(venue.latitude), 
          parseFloat(venue.longitude)
        );
        return distance <= radius;
      });
      
      // Add to result map to avoid duplicates
      nearbyVenues.forEach(venue => routeVenues.set(venue.id, venue));
    }
    
    return Array.from(routeVenues.values());
  }

  async getTourStats(tourId: number): Promise<{totalShows: number, confirmed: number, pending: number, openDates: number}> {
    const tourDates = await this.getTourDates(tourId);
    
    const totalShows = tourDates.length;
    const confirmed = tourDates.filter(td => td.status === 'confirmed').length;
    const pending = tourDates.filter(td => td.status === 'pending').length;
    const openDates = tourDates.filter(td => td.status === 'open' || td.isOpenDate).length;
    
    return {
      totalShows,
      confirmed,
      pending,
      openDates
    };
  }

  private initializeSampleData() {
    // Create sample bands
    const bands: InsertBand[] = [
      {
        name: "The Sonic Waves",
        description: "An indie rock band from Seattle",
        contactEmail: "contact@sonicwaves.com",
        contactPhone: "206-555-1234",
        genre: "Indie Rock",
        social: { twitter: "@sonicwaves", instagram: "@thesonicwaves" }
      },
      {
        name: "Midnight Ramble",
        description: "Blues-rock quartet from Austin, TX",
        contactEmail: "bookings@midnightramble.com",
        contactPhone: "512-555-9876",
        genre: "Blues Rock",
        social: { instagram: "@midnightramble", website: "www.midnightramble.com" }
      },
      {
        name: "Electronic Dreams",
        description: "Synth-pop duo from Portland",
        contactEmail: "info@electronicdreams.com",
        contactPhone: "503-555-4321",
        genre: "Electronic, Synth-pop",
        social: { twitter: "@electronicdreams", instagram: "@electronic_dreams" }
      },
      {
        name: "Velvet Thunder",
        description: "Hard rock band with blues influences",
        contactEmail: "thunder@velvetthunder.com",
        contactPhone: "323-555-7890",
        genre: "Hard Rock",
        social: { facebook: "velvetthunderofficial", instagram: "@velvet_thunder" }
      }
    ];
    
    const createdBands: Band[] = [];
    bands.forEach(band => {
      const createdBand = { ...band, id: this.bandIdCounter++ };
      this.bandsData.set(createdBand.id, createdBand);
      createdBands.push(createdBand);
    });

    // Create sample venues
    const venues: InsertVenue[] = [
      {
        name: "Mercury Lounge",
        address: "217 E Houston St",
        city: "New York",
        state: "NY",
        zipCode: "10002",
        capacity: 250,
        contactName: "Booking Manager",
        contactEmail: "bookings@mercurylounge.com",
        contactPhone: "212-555-1234",
        description: "Intimate venue for indie acts",
        genre: "Indie, Rock",
        dealType: "Flat fee",
        latitude: "40.7222",
        longitude: "-73.9875"
      },
      {
        name: "Paradise Rock Club",
        address: "967 Commonwealth Ave",
        city: "Boston",
        state: "MA",
        zipCode: "02215",
        capacity: 933,
        contactName: "Booking Manager",
        contactEmail: "bookings@paradiserock.com",
        contactPhone: "617-555-1234",
        description: "Historic rock club near BU",
        genre: "Rock, Alternative",
        dealType: "70/30 Split",
        latitude: "42.3513",
        longitude: "-71.1304"
      },
      {
        name: "Grog Shop",
        address: "2785 Euclid Heights Blvd",
        city: "Cleveland",
        state: "OH",
        zipCode: "44106",
        capacity: 400,
        contactName: "Booking Manager",
        contactEmail: "bookings@grogshop.com",
        contactPhone: "216-555-1234",
        description: "Cleveland's premier indie rock venue",
        genre: "Indie, Rock, Alternative",
        dealType: "Guarantee + 60/40 Split",
        latitude: "41.5085",
        longitude: "-81.5799"
      },
      {
        name: "Empty Bottle",
        address: "1035 N Western Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60622",
        capacity: 400,
        contactName: "Booking Manager",
        contactEmail: "bookings@emptybottle.com",
        contactPhone: "773-555-1234",
        description: "Chicago's iconic indie venue",
        genre: "Indie, Punk, Rock",
        dealType: "60/40 Split",
        latitude: "41.9007",
        longitude: "-87.6869"
      },
      {
        name: "The Garage",
        address: "123 Main St",
        city: "Milwaukee",
        state: "WI",
        zipCode: "53202",
        capacity: 250,
        contactName: "John Smith",
        contactEmail: "bookings@thegarage.com",
        contactPhone: "414-555-7890",
        description: "Premier indie rock venue in Milwaukee",
        genre: "Indie, Rock",
        dealType: "70/30 Split",
        latitude: "43.0389",
        longitude: "-87.9065"
      },
      {
        name: "Cactus Club",
        address: "2496 S Wentworth Ave",
        city: "Milwaukee",
        state: "WI",
        zipCode: "53207",
        capacity: 175,
        contactName: "Booking Manager",
        contactEmail: "bookings@cactusclub.com",
        contactPhone: "414-555-1234",
        description: "Historic venue for indie acts",
        genre: "Indie, Punk, Rock",
        dealType: "60/40 Split",
        latitude: "42.9989",
        longitude: "-87.9065"
      },
      {
        name: "The Frequency",
        address: "121 W Main St",
        city: "Madison",
        state: "WI",
        zipCode: "53703",
        capacity: 200,
        contactName: "Booking Manager",
        contactEmail: "bookings@thefrequency.com",
        contactPhone: "608-555-1234",
        description: "Madison's favorite venue for indie rock",
        genre: "Indie, Rock",
        dealType: "50/50 Split",
        latitude: "43.0731",
        longitude: "-89.3838"
      },
      {
        name: "The Hideout",
        address: "321 Park Ave",
        city: "Rockford",
        state: "IL",
        zipCode: "61101",
        capacity: 150,
        contactName: "Booking Manager",
        contactEmail: "bookings@thehideout.com",
        contactPhone: "815-555-1234",
        description: "Cozy venue for intimate shows",
        genre: "Folk, Indie",
        dealType: "Negotiable",
        latitude: "42.2711",
        longitude: "-89.0940"
      }
    ];

    venues.forEach(venue => {
      const createdVenue = { ...venue, id: this.venueIdCounter++ };
      this.venuesData.set(createdVenue.id, createdVenue);
    });

    // Create sample tours for each band
    const today = new Date();
    
    // Tour 1: The Sonic Waves - East Coast to Midwest
    const tour1StartDate = new Date(today);
    tour1StartDate.setDate(tour1StartDate.getDate() - 5);
    const tour1EndDate = new Date(today);
    tour1EndDate.setDate(tour1EndDate.getDate() + 45);

    const tour1: InsertTour = {
      name: "Summer Vibes Tour",
      startDate: tour1StartDate,
      endDate: tour1EndDate,
      bandId: createdBands[0].id,
      notes: "Our first major tour of the year",
      isActive: true
    };
    const createdTour1 = { ...tour1, id: this.tourIdCounter++ };
    this.toursData.set(createdTour1.id, createdTour1);

    // Tour 2: Midnight Ramble - Southern Route
    const tour2StartDate = new Date(today);
    tour2StartDate.setDate(tour2StartDate.getDate() - 15);
    const tour2EndDate = new Date(today);
    tour2EndDate.setDate(tour2EndDate.getDate() + 30);

    const tour2: InsertTour = {
      name: "Blues Highway Tour",
      startDate: tour2StartDate,
      endDate: tour2EndDate,
      bandId: createdBands[1].id,
      notes: "Following the blues trail north",
      isActive: true
    };
    const createdTour2 = { ...tour2, id: this.tourIdCounter++ };
    this.toursData.set(createdTour2.id, createdTour2);

    // Tour 3: Electronic Dreams - West Coast to Midwest
    const tour3StartDate = new Date(today);
    tour3StartDate.setDate(tour3StartDate.getDate() - 2);
    const tour3EndDate = new Date(today);
    tour3EndDate.setDate(tour3EndDate.getDate() + 60);

    const tour3: InsertTour = {
      name: "Digital Horizons Tour",
      startDate: tour3StartDate,
      endDate: tour3EndDate,
      bandId: createdBands[2].id,
      notes: "Our biggest production yet",
      isActive: true
    };
    const createdTour3 = { ...tour3, id: this.tourIdCounter++ };
    this.toursData.set(createdTour3.id, createdTour3);

    // Tour 4: Velvet Thunder - Midwest Focus
    const tour4StartDate = new Date(today);
    tour4StartDate.setDate(tour4StartDate.getDate() + 10);
    const tour4EndDate = new Date(today);
    tour4EndDate.setDate(tour4EndDate.getDate() + 35);

    const tour4: InsertTour = {
      name: "Thunder Road Tour",
      startDate: tour4StartDate,
      endDate: tour4EndDate,
      bandId: createdBands[3].id,
      notes: "Hitting all the rock venues in the midwest",
      isActive: true
    };
    const createdTour4 = { ...tour4, id: this.tourIdCounter++ };
    this.toursData.set(createdTour4.id, createdTour4);

    // Create tour dates for Tour 1 (Sonic Waves)
    const tour1Dates: InsertTourDate[] = [
      {
        tourId: createdTour1.id,
        venueId: 1,
        date: new Date(tour1StartDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        city: "New York",
        state: "NY",
        status: "confirmed",
        venueName: "Mercury Lounge",
        isOpenDate: false
      },
      {
        tourId: createdTour1.id,
        venueId: 2,
        date: new Date(tour1StartDate.getTime() + 18 * 24 * 60 * 60 * 1000),
        city: "Boston",
        state: "MA",
        status: "confirmed",
        venueName: "Paradise Rock Club",
        isOpenDate: false
      },
      {
        tourId: createdTour1.id,
        venueId: 3,
        date: new Date(tour1StartDate.getTime() + 23 * 24 * 60 * 60 * 1000),
        city: "Cleveland",
        state: "OH",
        status: "pending",
        venueName: "Grog Shop",
        isOpenDate: false
      },
      {
        tourId: createdTour1.id,
        venueId: 4,
        date: new Date(tour1StartDate.getTime() + 28 * 24 * 60 * 60 * 1000),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        venueName: "Empty Bottle",
        isOpenDate: false
      },
      {
        tourId: createdTour1.id,
        venueId: undefined,
        date: new Date(tour1StartDate.getTime() + 31 * 24 * 60 * 60 * 1000),
        city: "",
        state: "",
        status: "open",
        venueName: undefined,
        isOpenDate: true,
        notes: "Need to find a venue between Chicago and Minneapolis"
      }
    ];

    // Create tour dates for Tour 2 (Midnight Ramble)
    const tour2Dates: InsertTourDate[] = [
      {
        tourId: createdTour2.id,
        venueId: 4,
        date: new Date(tour2StartDate.getTime() + 20 * 24 * 60 * 60 * 1000),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        venueName: "Empty Bottle",
        isOpenDate: false
      },
      {
        tourId: createdTour2.id,
        venueId: 5,
        date: new Date(tour2StartDate.getTime() + 23 * 24 * 60 * 60 * 1000),
        city: "Milwaukee",
        state: "WI",
        status: "confirmed",
        venueName: "The Garage",
        isOpenDate: false
      },
      {
        tourId: createdTour2.id,
        venueId: 7,
        date: new Date(tour2StartDate.getTime() + 25 * 24 * 60 * 60 * 1000),
        city: "Madison",
        state: "WI",
        status: "pending",
        venueName: "The Frequency",
        isOpenDate: false
      },
      {
        tourId: createdTour2.id,
        venueId: undefined,
        date: new Date(tour2StartDate.getTime() + 27 * 24 * 60 * 60 * 1000),
        city: "",
        state: "",
        status: "open",
        venueName: undefined,
        isOpenDate: true,
        notes: "Seeking venue in western Wisconsin"
      }
    ];

    // Create tour dates for Tour 3 (Electronic Dreams)
    const tour3Dates: InsertTourDate[] = [
      {
        tourId: createdTour3.id,
        venueId: 5,
        date: new Date(tour3StartDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        city: "Milwaukee",
        state: "WI",
        status: "confirmed",
        venueName: "The Garage",
        isOpenDate: false
      },
      {
        tourId: createdTour3.id,
        venueId: 6,
        date: new Date(tour3StartDate.getTime() + 12 * 24 * 60 * 60 * 1000),
        city: "Milwaukee",
        state: "WI",
        status: "pending",
        venueName: "Cactus Club",
        isOpenDate: false
      },
      {
        tourId: createdTour3.id,
        venueId: 4,
        date: new Date(tour3StartDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        venueName: "Empty Bottle",
        isOpenDate: false
      }
    ];

    // Create tour dates for Tour 4 (Velvet Thunder)
    const tour4Dates: InsertTourDate[] = [
      {
        tourId: createdTour4.id,
        venueId: 8,
        date: new Date(tour4StartDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        city: "Rockford",
        state: "IL",
        status: "confirmed",
        venueName: "The Hideout",
        isOpenDate: false
      },
      {
        tourId: createdTour4.id,
        venueId: 6,
        date: new Date(tour4StartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        city: "Milwaukee",
        state: "WI",
        status: "confirmed",
        venueName: "Cactus Club",
        isOpenDate: false
      },
      {
        tourId: createdTour4.id,
        venueId: 7,
        date: new Date(tour4StartDate.getTime() + 9 * 24 * 60 * 60 * 1000),
        city: "Madison",
        state: "WI",
        status: "pending",
        venueName: "The Frequency",
        isOpenDate: false
      }
    ];

    // Combine all tour dates
    const allTourDates = [
      ...tour1Dates,
      ...tour2Dates,
      ...tour3Dates,
      ...tour4Dates
    ];

    // Save all tour dates
    allTourDates.forEach(tourDate => {
      const createdTourDate = { ...tourDate, id: this.tourDateIdCounter++ };
      this.tourDatesData.set(createdTourDate.id, createdTourDate);
    });

    // Create sample venue availabilities
    const venueIds = Array.from(this.venuesData.keys());
    const today1 = new Date();
    
    venueIds.forEach(venueId => {
      for (let i = 0; i < 15; i++) {
        const availDate = new Date(today1);
        availDate.setDate(availDate.getDate() + i * 3);
        
        const availability: InsertVenueAvailability = {
          venueId,
          date: availDate,
          isAvailable: Math.random() > 0.3 // 70% chance of being available
        };
        
        const createdAvailability = { ...availability, id: this.venueAvailabilityIdCounter++ };
        this.venueAvailabilityData.set(createdAvailability.id, createdAvailability);
      }
    });

    // Explicitly make venues available for the "open date"
    const openDateTourDate = tour1Dates[4];
    const openDate = openDateTourDate.date;
    
    // Make Milwaukee venues available on the open date
    [5, 6].forEach(venueId => {
      const availability: InsertVenueAvailability = {
        venueId,
        date: openDate,
        isAvailable: true
      };
      
      const createdAvailability = { ...availability, id: this.venueAvailabilityIdCounter++ };
      this.venueAvailabilityData.set(createdAvailability.id, createdAvailability);
    });
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './storage/database';

// Export an instance of DatabaseStorage instead of MemStorage
export const storage = new MemStorage();
