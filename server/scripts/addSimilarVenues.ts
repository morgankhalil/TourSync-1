import { db } from '../db';
import { venues } from '../../shared/schema';
import { storage } from '../storage';

async function addSimilarVenues() {
  console.log('Adding similar venues to Bug Jar...');
  
  // Cities within approximately 250 miles of Rochester, NY
  const similarVenues = [
    {
      name: "Mohawk Place",
      address: "47 E Mohawk St",
      city: "Buffalo",
      state: "NY",
      zipCode: "14203",
      capacity: 175,
      contactName: "Venue Manager",
      contactEmail: "booking@mohawkplace.com",
      contactPhone: "716-312-9279",
      description: "Independent music venue in Buffalo, featuring indie rock, punk, and metal bands",
      genre: "Indie, Punk, Metal",
      dealType: "Door Split",
      latitude: "42.8867",
      longitude: "-78.8784",
      technical_specs: JSON.stringify({
        sound: "Professional house PA system", 
        stage: "Small raised stage", 
        lighting: "Basic stage lighting"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street parking", 
        greenRoom: true
      }),
      website: "https://buffalosmohawkplace.com",
      preferred_genres: JSON.stringify(["Indie Rock", "Punk", "Metal", "Alternative"])
    },
    {
      name: "The Haunt",
      address: "702 Willow Ave",
      city: "Ithaca",
      state: "NY",
      zipCode: "14850",
      capacity: 200,
      contactName: "Venue Booker",
      contactEmail: "booking@thehaunt.com",
      contactPhone: "607-275-3447",
      description: "Longtime indie music venue in Ithaca known for hosting local bands and touring acts",
      genre: "Indie, Rock, Alternative",
      dealType: "Door Split",
      latitude: "42.4396",
      longitude: "-76.5156",
      technical_specs: JSON.stringify({
        sound: "Full PA system", 
        stage: "20x15 feet stage", 
        lighting: "Professional lighting rig"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Venue parking lot", 
        greenRoom: true
      }),
      website: "https://thehauntithaca.com",
      preferred_genres: JSON.stringify(["Indie Rock", "Alternative", "Folk Punk", "Electronic"])
    },
    {
      name: "Beachland Ballroom",
      address: "15711 Waterloo Rd",
      city: "Cleveland",
      state: "OH",
      zipCode: "44110",
      capacity: 500,
      contactName: "Venue Manager",
      contactEmail: "booking@beachlandballroom.com",
      contactPhone: "216-383-1124",
      description: "Historic venue with two performance spaces: a ballroom and tavern for more intimate shows",
      genre: "Indie, Rock, Punk, Alternative",
      dealType: "Percentage",
      latitude: "41.5697",
      longitude: "-81.5757",
      technical_specs: JSON.stringify({
        sound: "Professional sound system", 
        stage: "Large main stage", 
        lighting: "Full lighting rig"
      }),
      venue_type: "Concert Hall",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Free lot parking", 
        greenRoom: true,
        restaurant: true
      }),
      website: "https://www.beachlandballroom.com",
      preferred_genres: JSON.stringify(["Indie Rock", "Punk", "Alternative", "Americana", "Jazz"])
    },
    {
      name: "Funk 'n Waffles",
      address: "307-313 S Clinton St",
      city: "Syracuse",
      state: "NY",
      zipCode: "13202",
      capacity: 150,
      contactName: "Booking Manager",
      contactEmail: "booking@funknwaffles.com",
      contactPhone: "315-474-1060",
      description: "Funky venue combining live music with delicious food in Armory Square",
      genre: "Indie, Funk, Rock, Electronic",
      dealType: "Door Split",
      latitude: "43.0481",
      longitude: "-76.1541",
      technical_specs: JSON.stringify({
        sound: "House PA system", 
        stage: "Small intimate stage", 
        lighting: "Basic stage lighting"
      }),
      venue_type: "Restaurant/Bar",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street parking", 
        greenRoom: true,
        restaurant: true
      }),
      website: "https://www.funknwaffles.com",
      preferred_genres: JSON.stringify(["Indie", "Funk", "Jazz", "Electronic", "Hip-Hop"])
    },
    {
      name: "Mr. Small's Theatre",
      address: "400 Lincoln Ave",
      city: "Pittsburgh",
      state: "PA",
      zipCode: "15209",
      capacity: 650,
      contactName: "Booking Agent",
      contactEmail: "booking@mrsmalls.com",
      contactPhone: "412-821-4447",
      description: "Historic converted church venue with excellent acoustics and indie atmosphere",
      genre: "Indie, Rock, Alternative",
      dealType: "Percentage",
      latitude: "40.4895",
      longitude: "-79.9778",
      technical_specs: JSON.stringify({
        sound: "Professional sound system", 
        stage: "Large elevated stage", 
        lighting: "Full professional lighting"
      }),
      venue_type: "Concert Hall",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Venue lot", 
        greenRoom: true,
        merch: "Dedicated merch area"
      }),
      website: "https://www.mrsmalls.com",
      preferred_genres: JSON.stringify(["Indie Rock", "Alternative", "Metal", "Hip-Hop", "Electronic"])
    },
    {
      name: "The Lost Horizon",
      address: "5863 Thompson Rd",
      city: "Syracuse",
      state: "NY",
      zipCode: "13214",
      capacity: 300,
      contactName: "Booking Office",
      contactEmail: "booking@thelosthorizon.com",
      contactPhone: "315-446-1934",
      description: "Legendary Syracuse rock club with a long history of hosting punk and metal shows",
      genre: "Punk, Metal, Rock",
      dealType: "Door Split",
      latitude: "43.0392",
      longitude: "-76.0871",
      technical_specs: JSON.stringify({
        sound: "Full PA system", 
        stage: "Raised stage", 
        lighting: "Stage lighting"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Venue parking", 
        greenRoom: true
      }),
      website: "https://www.thelosthorizon.com",
      preferred_genres: JSON.stringify(["Punk", "Metal", "Hardcore", "Alternative"])
    },
    {
      name: "Nietzsche's",
      address: "248 Allen St",
      city: "Buffalo",
      state: "NY",
      zipCode: "14201",
      capacity: 125,
      contactName: "Venue Manager",
      contactEmail: "booking@nietzsches.com",
      contactPhone: "716-886-8539",
      description: "Iconic Buffalo institution in the heart of Allentown, known for diverse indie shows",
      genre: "Indie, Folk, Jazz, Rock",
      dealType: "Door Split",
      latitude: "42.9008",
      longitude: "-78.8735",
      technical_specs: JSON.stringify({
        sound: "House sound system", 
        stage: "Intimate corner stage", 
        lighting: "Basic lighting"
      }),
      venue_type: "Bar",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street parking", 
        greenRoom: false
      }),
      website: "https://www.nietzsches.com",
      preferred_genres: JSON.stringify(["Indie Folk", "Jazz", "Experimental", "Singer-Songwriter"])
    },
    {
      name: "Grog Shop",
      address: "2785 Euclid Heights Blvd",
      city: "Cleveland Heights",
      state: "OH",
      zipCode: "44106",
      capacity: 400,
      contactName: "Booking Manager",
      contactEmail: "booking@grogshop.gs",
      contactPhone: "216-321-5588",
      description: "Beloved Cleveland Heights venue known for indie rock, punk and alternative shows",
      genre: "Indie, Punk, Alternative",
      dealType: "Door Split",
      latitude: "41.5013",
      longitude: "-81.5765",
      technical_specs: JSON.stringify({
        sound: "Professional PA system", 
        stage: "Mid-sized stage", 
        lighting: "Full lighting rig"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street parking",

        greenRoom: true
      }),
      website: "https://grogshop.gs",
      preferred_genres: JSON.stringify(["Indie Rock", "Punk", "Alternative", "Hip-Hop"])
    },
    {
      name: "9th Ward at Babeville",
      address: "341 Delaware Ave",
      city: "Buffalo",
      state: "NY",
      zipCode: "14202",
      capacity: 150,
      contactName: "Venue Manager",
      contactEmail: "booking@babevillebuffalo.com",
      contactPhone: "716-852-3835",
      description: "Intimate basement venue in Ani DiFranco's Babeville complex in a converted church",
      genre: "Indie, Folk, Singer-Songwriter",
      dealType: "Door Split",
      latitude: "42.8927",
      longitude: "-78.8738",
      technical_specs: JSON.stringify({
        sound: "High-quality sound system", 
        stage: "Small corner stage", 
        lighting: "Intimate lighting setup"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street and lot parking", 
        greenRoom: true
      }),
      website: "https://www.babevillebuffalo.com",
      preferred_genres: JSON.stringify(["Indie Folk", "Singer-Songwriter", "Acoustic", "Experimental"])
    },
    {
      name: "Spirit Hall",
      address: "242 51st St",
      city: "Pittsburgh",
      state: "PA",
      zipCode: "15201",
      capacity: 350,
      contactName: "Booking Office",
      contactEmail: "booking@spiritpgh.com",
      contactPhone: "412-586-4441",
      description: "Multi-level venue in Lawrenceville with a great sound system and diverse bookings",
      genre: "Indie, Electronic, Hip-Hop",
      dealType: "Percentage",
      latitude: "40.4776",
      longitude: "-79.9498",
      technical_specs: JSON.stringify({
        sound: "High-end sound system", 
        stage: "Open performance space", 
        lighting: "Professional lighting"
      }),
      venue_type: "Club",
      amenities: JSON.stringify({
        bar: true, 
        parking: "Street parking", 
        greenRoom: true,
        restaurant: true
      }),
      website: "https://www.spiritpgh.com",
      preferred_genres: JSON.stringify(["Indie", "Electronic", "Dance", "Hip-Hop", "Experimental"])
    }
  ];

  let addedCount = 0;
  
  for (const venue of similarVenues) {
    try {
      // Check if venue already exists
      const existingVenues = await db.select().from(venues)
        .where(venues => 
          venues.name.equals(venue.name).and(venues.city.equals(venue.city))
        );
      
      if (existingVenues.length > 0) {
        console.log(`Venue already exists: ${venue.name} in ${venue.city}, ${venue.state}`);
        continue;
      }
      
      // Create new venue
      await storage.createVenue({
        name: venue.name,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        zipCode: venue.zipCode,
        capacity: parseInt(venue.capacity.toString(), 10),
        contactName: venue.contactName,
        contactEmail: venue.contactEmail,
        contactPhone: venue.contactPhone,
        description: venue.description,
        genre: venue.genre,
        dealType: venue.dealType,
        latitude: venue.latitude,
        longitude: venue.longitude,
        venue_type: venue.venue_type,
        website: venue.website,
        technical_specs: venue.technical_specs,
        amenities: venue.amenities,
        preferred_genres: venue.preferred_genres
      });
      
      addedCount++;
      console.log(`Added venue: ${venue.name} in ${venue.city}, ${venue.state}`);
    } catch (error) {
      console.error(`Error adding venue ${venue.name}:`, error);
    }
  }
  
  console.log(`Completed! Added ${addedCount} new venues similar to Bug Jar.`);
}

// Run the function
addSimilarVenues().catch(console.error);