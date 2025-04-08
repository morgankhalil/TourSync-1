import { db } from "../db";
import { tours, tourDates, bands, venues } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function createSampleTourData() {
  console.log("Creating sample tour data...");
  
  // First, check if we already have tours in the database
  const existingTours = await db.select().from(tours);
  if (existingTours.length > 0) {
    console.log(`Found ${existingTours.length} existing tours. Skipping sample tour data creation.`);
    return;
  }
  
  // Create sample bands first if they don't exist
  const existingBands = await db.select().from(bands);
  
  let bandIds: number[] = [];
  
  if (existingBands.length > 0) {
    bandIds = existingBands.map(band => band.id);
    console.log(`Using ${bandIds.length} existing bands.`);
  } else {
    // Create some sample bands
    const sampleBands = [
      { name: "The Midnight Echoes", genre: "Indie Rock", bio: "Indie rock band known for their atmospheric sound and introspective lyrics" },
      { name: "Neon Pulse", genre: "Synthwave", bio: "Electronic music project with retro-futuristic vibes and driving beats" },
      { name: "Sierra Sound", genre: "Folk", bio: "Acoustic folk ensemble with harmonious vocals and storytelling traditions" }
    ];
    
    for (const band of sampleBands) {
      const result = await db.insert(bands).values(band).returning({ id: bands.id });
      if (result.length > 0) {
        bandIds.push(result[0].id);
      }
    }
    
    console.log(`Created ${bandIds.length} new bands.`);
  }
  
  if (bandIds.length === 0) {
    console.log("No bands available. Cannot create tours.");
    return;
  }
  
  // Create sample tours
  const sampleTours = [
    {
      name: "Summer Horizon Tour 2025",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-08-15"),
      bandId: bandIds[0], // The Midnight Echoes
      notes: "Summer tour across major US cities",
      isActive: true
    },
    {
      name: "Neon Nights Tour",
      startDate: new Date("2025-09-10"),
      endDate: new Date("2025-11-20"),
      bandId: bandIds.length > 1 ? bandIds[1] : bandIds[0], // Neon Pulse or fallback
      notes: "Tour focused on electronic music venues",
      isActive: true
    },
    {
      name: "Acoustic Journey 2025",
      startDate: new Date("2025-03-15"),
      endDate: new Date("2025-05-30"),
      bandId: bandIds.length > 2 ? bandIds[2] : bandIds[0], // Sierra Sound or fallback
      notes: "Intimate acoustic shows at small venues",
      isActive: true
    }
  ];
  
  const createdTours: number[] = [];
  
  for (const tour of sampleTours) {
    const result = await db.insert(tours).values(tour).returning({ id: tours.id });
    if (result.length > 0) {
      createdTours.push(result[0].id);
    }
  }
  
  console.log(`Created ${createdTours.length} tours.`);
  
  // Get some venue IDs to use for tour dates
  const venuesList = await db.select({ 
      id: venues.id, 
      name: venues.name, 
      city: venues.city, 
      state: venues.state 
    })
    .from(venues)
    .limit(15);
  
  if (venuesList.length === 0) {
    console.log("No venues found. Cannot create tour dates.");
    return;
  }
  
  // Create sample tour dates for each tour
  for (const tourId of createdTours) {
    const tour = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
    
    if (tour.length === 0) continue;
    
    // Determine how many dates to create
    const daysBetween = Math.round((tour[0].endDate.getTime() - tour[0].startDate.getTime()) / (1000 * 3600 * 24));
    const numDates = Math.min(Math.floor(daysBetween / 3), venuesList.length); // One venue every 3 days, up to available venues
    
    for (let i = 0; i < numDates; i++) {
      const venue = venuesList[i % venuesList.length];
      const dateOffset = i * 3; // Every 3 days
      const eventDate = new Date(tour[0].startDate);
      eventDate.setDate(eventDate.getDate() + dateOffset);
      
      await db.insert(tourDates).values({
        tourId: tourId,
        venueId: venue.id,
        date: eventDate,
        city: venue.city,
        state: venue.state,
        venueName: venue.name,
        status: "confirmed",
        notes: `${tour[0].name} at ${venue.name}`,
        isOpenDate: false
      });
    }
    
    const tourDatesCount = await db.select({ count: db.fn.count() })
      .from(tourDates)
      .where(eq(tourDates.tourId, tourId));
    
    console.log(`Created ${tourDatesCount[0].count} tour dates for tour ${tourId}.`);
  }
  
  console.log("Sample tour data creation complete.");
}

createSampleTourData()
  .then(() => {
    console.log("Sample tour data creation script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating sample tour data:", error);
    process.exit(1);
  });