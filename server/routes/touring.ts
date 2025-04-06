import { Express, Request, Response } from "express";

export function registerTouringRoutes(app: Express): void {
  // Get all bands that are currently touring - using hardcoded data 
  // to bypass database issues
  app.get("/api/bands/touring", (_req: Request, res: Response) => {
    try {
      // Using real venue coordinates for accuracy
      const mockBands = [
        {
          id: 1,
          name: "The Sonic Waves",
          description: "An indie rock band from Seattle",
          contactEmail: "contact@sonicwaves.com",
          contactPhone: "206-555-1234",
          genre: "Indie Rock",
          social: { twitter: "@sonicwaves", instagram: "@thesonicwaves" },
          drawSize: "200-300",
          matchScore: 92,
          touring: {
            tourId: 1,
            tourName: "Summer Vibes Tour",
            startDate: "2025-03-15",
            endDate: "2025-06-01",
            // Mercury Lounge NYC coordinates
            latitude: "40.7222",
            longitude: "-73.9875",
            distance: 12,
            route: [
              { lat: 40.7222, lng: -73.9875 }, // Mercury Lounge
              { lat: 42.3513, lng: -71.1304 }, // Paradise Rock Club
              { lat: 41.5085, lng: -81.5799 }  // Grog Shop
            ]
          }
        },
        {
          id: 2,
          name: "Midnight Ramble",
          description: "Blues-rock quartet from Austin, TX",
          contactEmail: "bookings@midnightramble.com",
          contactPhone: "512-555-9876",
          genre: "Blues Rock",
          social: { instagram: "@midnightramble", website: "www.midnightramble.com" },
          drawSize: "100-200",
          matchScore: 85,
          touring: {
            tourId: 2,
            tourName: "Blues Highway Tour",
            startDate: "2025-03-20",
            endDate: "2025-05-15",
            // Paradise Rock Club coordinates
            latitude: "42.3513",
            longitude: "-71.1304",
            distance: 8,
            route: [
              { lat: 42.3513, lng: -71.1304 }, // Paradise Rock Club
              { lat: 40.7222, lng: -73.9875 }, // Mercury Lounge
              { lat: 41.5085, lng: -81.5799 }  // Grog Shop
            ]
          }
        },
        {
          id: 3,
          name: "Electronic Dreams",
          description: "Synth-pop duo from Portland",
          contactEmail: "info@electronicdreams.com",
          contactPhone: "503-555-4321",
          genre: "Electronic, Synth-pop",
          social: { twitter: "@electronicdreams", instagram: "@electronic_dreams" },
          drawSize: "300+",
          matchScore: 76,
          touring: {
            tourId: 3,
            tourName: "Digital Horizons Tour",
            startDate: "2025-04-01",
            endDate: "2025-06-30",
            // Empty Bottle coordinates
            latitude: "41.9007",
            longitude: "-87.6869",
            distance: 15,
            route: [
              { lat: 41.9007, lng: -87.6869 }, // Empty Bottle
              { lat: 43.0389, lng: -87.9065 }, // The Garage
              { lat: 41.5085, lng: -81.5799 }  // Grog Shop
            ]
          }
        },
        {
          id: 4,
          name: "Velvet Thunder",
          description: "Hard rock band with blues influences",
          contactEmail: "thunder@velvetthunder.com",
          contactPhone: "323-555-7890",
          genre: "Hard Rock",
          social: { facebook: "velvetthunderofficial", instagram: "@velvet_thunder" },
          drawSize: "200-300",
          matchScore: 80,
          touring: {
            tourId: 4,
            tourName: "Thunder Road Tour",
            startDate: "2025-04-15",
            endDate: "2025-05-20",
            // Grog Shop coordinates
            latitude: "41.5085",
            longitude: "-81.5799",
            distance: 5,
            route: [
              { lat: 41.5085, lng: -81.5799 }, // Grog Shop
              { lat: 41.9007, lng: -87.6869 }, // Empty Bottle
              { lat: 40.7222, lng: -73.9875 }  // Mercury Lounge
            ]
          }
        },
        {
          id: 5,
          name: "Indie Folk Collective",
          description: "Six-piece folk band with rich harmonies and acoustic instruments",
          contactEmail: "booking@indiefolkcollective.com",
          contactPhone: "555-567-8901",
          genre: "Folk, Indie",
          social: { facebook: "indiefolkcollective", instagram: "@indie_folk_collective", spotify: "indiefolkcollective" },
          drawSize: "100-200",
          matchScore: 88,
          touring: {
            tourId: 5,
            tourName: "Acoustic Adventures Tour",
            startDate: "2025-04-10",
            endDate: "2025-05-25",
            // The Garage coordinates
            latitude: "43.0389",
            longitude: "-87.9065",
            distance: 22,
            route: [
              { lat: 43.0389, lng: -87.9065 }, // The Garage
              { lat: 41.9007, lng: -87.6869 }, // Empty Bottle
              { lat: 42.3513, lng: -71.1304 }  // Paradise Rock Club
            ]
          }
        },
        {
          id: 6,
          name: "Basement Punk",
          description: "High-energy punk trio from the midwest",
          contactEmail: "noise@basementpunk.com",
          contactPhone: "555-678-9012",
          genre: "Punk",
          social: { facebook: "basementpunkofficial", instagram: "@basement_punk" },
          drawSize: "0-100",
          matchScore: 72,
          touring: {
            tourId: 6,
            tourName: "East Coast Noise Tour",
            startDate: "2025-04-03",
            endDate: "2025-04-28",
            // Mercury Lounge coordinates (different route)
            latitude: "40.7222",
            longitude: "-73.9875",
            distance: 18,
            route: [
              { lat: 40.7222, lng: -73.9875 }, // Mercury Lounge
              { lat: 41.5085, lng: -81.5799 }, // Grog Shop
              { lat: 43.0389, lng: -87.9065 }  // The Garage
            ]
          }
        }
      ];
      
      // Return the data
      res.json(mockBands);
    } catch (error) {
      console.error("Error fetching touring bands:", error);
      res.status(500).json({ message: "Error fetching touring bands" });
    }
  });
}