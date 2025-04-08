import { pgTable, text, serial, integer, date, boolean, jsonb, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Artist profile schema
export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  genres: jsonb("genres").$type<string[]>().default([]),
  imageUrl: text("image_url"),
  url: text("url"),
  website: text("website"),
  description: text("description"),
  location: text("location"),
  country: text("country"),
  drawSize: integer("draw_size"),
  lookingToCollaborate: boolean("looking_to_collaborate").default(true),
  collaborationTypes: jsonb("collaboration_types").$type<string[]>().default([]),
  socialMedia: jsonb("social_media"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true
});

// Artist discovery tracking
export const artistDiscovery = pgTable("artist_discovery", {
  artistId: text("artist_id").primaryKey(),
  lastChecked: text("last_checked").notNull(),
  timesChecked: integer("times_checked").notNull().default(1)
});

export const insertArtistDiscoverySchema = createInsertSchema(artistDiscovery);

// Events schema
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  artistId: text("artist_id").notNull(),
  venueName: text("venue_name").notNull(),
  venueCity: text("venue_city").notNull(),
  venueState: text("venue_state"),
  venueCountry: text("venue_country").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  eventDate: timestamp("event_date").notNull(),
  ticketUrl: text("ticket_url"),
  collaborationOpen: boolean("collaboration_open").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

// Collaboration requests
export const collaborationRequests = pgTable("collaboration_requests", {
  id: serial("id").primaryKey(),
  requestingArtistId: text("requesting_artist_id").notNull(),
  receivingArtistId: text("receiving_artist_id").notNull(),
  eventId: text("event_id"),
  message: text("message"),
  status: text("status").default("pending"),
  requestDate: timestamp("request_date").defaultNow(),
  responseDate: timestamp("response_date")
});

export const insertCollaborationRequestSchema = createInsertSchema(collaborationRequests).omit({
  id: true,
  requestDate: true,
  responseDate: true
});

// Artist compatibility scores
export const artistCompatibility = pgTable("artist_compatibility", {
  artistId1: text("artist_id1").notNull(),
  artistId2: text("artist_id2").notNull(),
  compatibilityScore: integer("compatibility_score").notNull(),
  genreOverlap: integer("genre_overlap"),
  audienceMatch: integer("audience_match"),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.artistId1, table.artistId2] })
  };
});

export const insertArtistCompatibilitySchema = createInsertSchema(artistCompatibility).omit({
  updatedAt: true
});

// Export types
export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;

export type ArtistDiscovery = typeof artistDiscovery.$inferSelect;
export type InsertArtistDiscovery = z.infer<typeof insertArtistDiscoverySchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type InsertCollaborationRequest = z.infer<typeof insertCollaborationRequestSchema>;

export type ArtistCompatibility = typeof artistCompatibility.$inferSelect;
export type InsertArtistCompatibility = z.infer<typeof insertArtistCompatibilitySchema>;

// Interface definitions for external API types
export interface ExternalArtist {
  id: string;
  name: string;
  genres?: string[];
  image_url?: string;
  url?: string;
  website?: string;
  draw_size?: number;
}

export interface ExternalEvent {
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