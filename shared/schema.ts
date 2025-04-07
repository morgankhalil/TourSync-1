import { pgTable, text, serial, integer, date, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Band profile schema
export const bands = pgTable("bands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  genre: text("genre"),
  social: jsonb("social"),
  drawSize: integer("draw_size"), // Estimated audience size
  pastVenues: jsonb("past_venues"), // History of past venues
  technicalRequirements: jsonb("technical_requirements"), // Audio/staging needs
  mediaLinks: jsonb("media_links"), // Photos, videos, audio
  lastTourDate: date("last_tour_date"), // Last date they toured
  avgTicketPrice: integer("avg_ticket_price"), // Average ticket price in cents
  pressKit: text("press_kit"), // Link to press kit
  preferredVenueTypes: jsonb("preferred_venue_types") // Types of venues they prefer
});

export const insertBandSchema = createInsertSchema(bands).omit({
  id: true
});

// Venue schema
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  capacity: integer("capacity"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"), // Venue website URL
  description: text("description"),
  genre: text("genre"), // Preferred genres
  dealType: text("deal_type"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  technicalSpecs: jsonb("technical_specs"), // Sound system, stage dimensions, etc.
  venueType: text("venue_type"), // Club, theater, arena, etc.
  amenities: jsonb("amenities"), // Green room, parking, etc.
  pastPerformers: jsonb("past_performers").$type<any[]>(), // List of notable past performers
  photoGallery: jsonb("photo_gallery"), // Venue photos
  loadingInfo: text("loading_info"), // Loading dock details
  accommodations: text("accommodations"), // Nearby hotels, etc.
  preferredGenres: jsonb("preferred_genres"), // Genres the venue prefers to book
  priceRange: jsonb("price_range") // Typical price range for shows
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true
});

// Tour schema
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  bandId: integer("band_id").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true)
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true
});

// Tour date schema (represents a stop on the tour)
export const tourDates = pgTable("tour_dates", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").notNull(),
  venueId: integer("venue_id"),
  date: date("date").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  status: text("status").default("open"), // open, pending, confirmed
  notes: text("notes"),
  venueName: text("venue_name"),
  isOpenDate: boolean("is_open_date").default(false)
});

export const insertTourDateSchema = createInsertSchema(tourDates).omit({
  id: true
});

// Venue availability schema (dates a venue is available for booking)
export const venueAvailability = pgTable("venue_availability", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  date: date("date").notNull(),
  isAvailable: boolean("is_available").default(true)
});

export const insertVenueAvailabilitySchema = createInsertSchema(venueAvailability).omit({
  id: true
});

// Types for the schemas
export type Band = typeof bands.$inferSelect;
export type InsertBand = z.infer<typeof insertBandSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type Tour = typeof tours.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;

export type TourDate = typeof tourDates.$inferSelect;
export type InsertTourDate = z.infer<typeof insertTourDateSchema>;

export type VenueAvailability = typeof venueAvailability.$inferSelect;
export type InsertVenueAvailability = z.infer<typeof insertVenueAvailabilitySchema>;

// Artist discovery tracking
export const artistDiscovery = pgTable("artist_discovery", {
  artistId: text("artist_id").primaryKey(),
  lastChecked: text("last_checked").notNull(),
  timesChecked: integer("times_checked").notNull().default(1)
});

export const insertArtistDiscoverySchema = createInsertSchema(artistDiscovery);

export type ArtistDiscovery = typeof artistDiscovery.$inferSelect;
export type InsertArtistDiscovery = z.infer<typeof insertArtistDiscoverySchema>;
export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  capacity?: number;
  website?: string;
  phone?: string;
  email?: string;
}

export interface Artist {
  id: string;
  name: string;
  genres?: string[];
  image_url?: string;
  url?: string;
  website?: string;
  draw_size?: number;
}

export interface ArtistDiscoveryRecord {
  artistId: string;
  lastChecked: string;
  timesChecked: number;
}

export interface Event {
  id: string;
  datetime: string;
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
    latitude: string;
    longitude: string;
  };
}

export interface DiscoveryStats {
  artistsQueried: number;
  artistsWithEvents: number;
  artistsPassingNear: number;
  totalEventsFound: number;
  elapsedTimeMs: number;
  apiCacheStats: {
    keys: number;
    hits: number;
    misses: number;
  };
}