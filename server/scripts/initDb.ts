import { db } from '../db';
import { bands, venues, tours, tourDates, venueAvailability } from '../../shared/schema';
import { storage } from '../storage';

/**
 * Script to initialize the database with sample data.
 * This should be run using `npx tsx server/scripts/initDb.ts`
 */
async function initializeDatabase() {
  console.log('Initializing database...');

  // Create a sample band
  const band = await storage.createBand({
    name: "The Sonic Waves",
    description: "An indie rock band from Seattle",
    contactEmail: "contact@sonicwaves.com",
    contactPhone: "206-555-1234",
    genre: "Indie Rock",
    social: { twitter: "@sonicwaves", instagram: "@thesonicwaves" }
  });
  console.log(`Created band: ${band.name} with ID ${band.id}`);

  // Create sample venues
  const venueData = [
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
    }
  ];

  const venues = [];
  for (const venueInfo of venueData) {
    const venue = await storage.createVenue(venueInfo);
    venues.push(venue);
    console.log(`Created venue: ${venue.name} with ID ${venue.id}`);
  }

  // Create a tour
  const tour = await storage.createTour({
    name: "Summer Vibes Tour",
    startDate: new Date("2025-06-15").toISOString(),
    endDate: new Date("2025-08-15").toISOString(),
    bandId: band.id,
    notes: "First national headline tour",
    isActive: true
  });
  console.log(`Created tour: ${tour.name} with ID ${tour.id}`);

  // Create tour dates
  const tourDateData = [
    {
      tourId: tour.id,
      venueId: venues[0].id,
      date: new Date("2025-06-20").toISOString(),
      city: "New York",
      state: "NY",
      status: "confirmed",
      notes: "Sold out show",
      isOpenDate: false
    },
    {
      tourId: tour.id,
      venueId: venues[1].id,
      date: new Date("2025-06-27").toISOString(),
      city: "Boston",
      state: "MA",
      status: "confirmed",
      notes: "Early and late show",
      isOpenDate: false
    },
    {
      tourId: tour.id,
      venueId: venues[2].id,
      date: new Date("2025-07-05").toISOString(),
      city: "Cleveland",
      state: "OH",
      status: "pending",
      notes: "Waiting on contract",
      isOpenDate: false
    },
    {
      tourId: tour.id,
      venueId: null,
      date: new Date("2025-07-10").toISOString(),
      city: "Detroit",
      state: "MI",
      status: "open",
      notes: "Need to find venue",
      isOpenDate: true
    },
    {
      tourId: tour.id,
      venueId: venues[3].id,
      date: new Date("2025-07-15").toISOString(),
      city: "Chicago",
      state: "IL",
      status: "confirmed",
      notes: "Co-headline with local act",
      isOpenDate: false
    }
  ];

  for (const dateInfo of tourDateData) {
    const tourDate = await storage.createTourDate(dateInfo);
    console.log(`Created tour date: ${new Date(tourDate.date).toLocaleDateString()} in ${tourDate.city} with ID ${tourDate.id}`);
  }

  // Create venue availability
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    
    // Add some random available dates
    for (let j = 0; j < 5; j++) {
      const date = new Date("2025-06-15");
      date.setDate(date.getDate() + Math.floor(Math.random() * 60)); // Random date in summer 2025
      
      const availability = await storage.createVenueAvailability({
        venueId: venue.id,
        date: date.toISOString(),
        isAvailable: Math.random() > 0.3 // 70% chance of being available
      });
      
      console.log(`Created venue availability for ${venue.name} on ${new Date(availability.date).toLocaleDateString()}`);
    }
  }

  console.log('Database initialization complete!');
}

// Run the initialization
initializeDatabase()
  .catch(error => {
    console.error('Error initializing database:', error);
  })
  .finally(() => {
    console.log('Database connection will close automatically');
    // Using the Drizzle ORM, the connection is managed by the PostgreSQL driver
    // and doesn't need an explicit end call
  });