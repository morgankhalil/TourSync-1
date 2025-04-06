import { Express, Request, Response } from "express";

export function registerTouringRoutes(app: Express): void {
  // Get all bands that are currently touring - using hardcoded data 
  // to bypass database issues
  app.get("/api/bands/touring", (_req: Request, res: Response) => {
    try {
      // Using hardcoded data for this demo feature
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
            latitude: "43.16480",
            longitude: "-77.58750",
            distance: 12,
            route: [
              { lat: 43.15, lng: -77.58 },
              { lat: 43.17, lng: -77.59 },
              { lat: 43.14, lng: -77.57 }
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
            latitude: "43.16980",
            longitude: "-77.59750",
            distance: 8,
            route: [
              { lat: 43.16, lng: -77.60 },
              { lat: 43.17, lng: -77.61 },
              { lat: 43.15, lng: -77.59 }
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
            latitude: "43.14480",
            longitude: "-77.57750",
            distance: 15,
            route: [
              { lat: 43.13, lng: -77.57 },
              { lat: 43.15, lng: -77.58 },
              { lat: 43.14, lng: -77.56 }
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
            latitude: "43.15480",
            longitude: "-77.60750",
            distance: 5,
            route: [
              { lat: 43.15, lng: -77.61 },
              { lat: 43.16, lng: -77.60 },
              { lat: 43.15, lng: -77.59 }
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
            latitude: "43.17480",
            longitude: "-77.61750",
            distance: 22,
            route: [
              { lat: 43.17, lng: -77.62 },
              { lat: 43.18, lng: -77.61 },
              { lat: 43.16, lng: -77.60 }
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
            latitude: "43.18480",
            longitude: "-77.62750",
            distance: 18,
            route: [
              { lat: 43.18, lng: -77.63 },
              { lat: 43.19, lng: -77.62 },
              { lat: 43.17, lng: -77.61 }
            ]
          }
        }
      ];
      
      res.json(mockBands);
    } catch (error) {
      console.error("Error fetching touring bands:", error);
      res.status(500).json({ message: "Error fetching touring bands" });
    }
  });
}