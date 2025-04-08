import { pgTable, text, serial, integer, date, boolean, jsonb, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  userType: text("user_type").notNull().default("artist"), // artist, venue, or fan
  role: text("role").default("user"),
  venueId: integer("venue_id"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login")
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  lastLogin: true
}).extend({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Artist profile schema
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // Reference to user who owns this artist profile
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

// Venues schema
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
  description: text("description"),
  genre: text("genre"),
  dealType: text("deal_type"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  technicalSpecs: jsonb("technical_specs").$type<Record<string, any>>(),
  venueType: text("venue_type"),
  amenities: jsonb("amenities").$type<string[]>(),
  pastPerformers: jsonb("past_performers").$type<string[]>(),
  photoGallery: jsonb("photo_gallery").$type<string[]>(),
  loadingInfo: text("loading_info"),
  accommodations: text("accommodations"),
  preferredGenres: jsonb("preferred_genres").$type<string[]>(),
  priceRange: jsonb("price_range").$type<Record<string, any>>(),
  website: text("website"),
  bandsintown_id: text("bandsintown_id")
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true
});

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
  posterUrl: text("poster_url"), // Tour poster image URL
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

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

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

// Tours schema
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

// Tour dates schema
export const tourDates = pgTable("tour_dates", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").notNull(),
  venueId: integer("venue_id"),
  date: date("date").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  venueName: text("venue_name"),
  status: text("status").default("open"),
  notes: text("notes"),
  isOpenDate: boolean("is_open_date").default(false),
  poster: text("poster")
});

export const insertTourDateSchema = createInsertSchema(tourDates).omit({
  id: true
});

// Bands schema (if not already defined elsewhere)
export const bands = pgTable("bands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genreId: integer("genre_id"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  bio: text("bio"),
  formationYear: integer("formation_year"),
  disbandYear: integer("disband_year"),
  isActive: boolean("is_active").default(true),
  logoUrl: text("logo_url"),
  photoUrl: text("photo_url")
});

export const insertBandSchema = createInsertSchema(bands).omit({
  id: true
});

// Venue relationship types
export const venueRelationshipTypes = pgTable("venue_relationship_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description")
});

export const insertVenueRelationshipTypeSchema = createInsertSchema(venueRelationshipTypes).omit({
  id: true
});

// Venue relationships - connections between venues
export const venueRelationships = pgTable("venue_relationships", {
  id: serial("id").primaryKey(),
  venueId1: integer("venue_id1").notNull().references(() => venues.id),
  venueId2: integer("venue_id2").notNull().references(() => venues.id),
  relationshipTypeId: integer("relationship_type_id").references(() => venueRelationshipTypes.id),
  strength: integer("strength").default(0), // 0-100 indicating relationship strength
  lastUsed: timestamp("last_used"), // When this relationship was last utilized
  totalBookings: integer("total_bookings").default(0), // Number of shared bookings
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
  status: text("status").default("active"),
  trustScore: integer("trust_score").default(50) // 0-100 trust level
}, (table) => {
  return {
    uniqueIdx: primaryKey({ columns: [table.venueId1, table.venueId2] })
  };
});

export const insertVenueRelationshipSchema = createInsertSchema(venueRelationships).omit({
  id: true,
  createdAt: true
});

// Geographic venue clusters
export const venueClusters = pgTable("venue_clusters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  regionCode: text("region_code").notNull().default("UNKNOWN"), // US region code (NE, MW, SE, etc.)
  isStatic: boolean("is_static").default(false), // Whether this is a static region-based cluster
  centerLatitude: text("center_latitude"),
  centerLongitude: text("center_longitude"),
  radiusKm: integer("radius_km"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertVenueClusterSchema = createInsertSchema(venueClusters).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Venues in clusters
export const venueClusterMembers = pgTable("venue_cluster_members", {
  clusterId: integer("cluster_id").notNull().references(() => venueClusters.id),
  venueId: integer("venue_id").notNull().references(() => venues.id),
  addedAt: timestamp("added_at").defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.clusterId, table.venueId] })
  };
});

export const insertVenueClusterMemberSchema = createInsertSchema(venueClusterMembers).omit({
  addedAt: true
});

// Tour routing patterns
export const routingPatterns = pgTable("routing_patterns", {
  id: serial("id").primaryKey(),
  sourceVenueId: integer("source_venue_id").notNull().references(() => venues.id),
  destinationVenueId: integer("destination_venue_id").notNull().references(() => venues.id),
  frequency: integer("frequency").default(1), // How many times this route has been used
  averageDaysGap: integer("average_days_gap"), // Average days between shows
  confidenceScore: integer("confidence_score").default(50), // 0-100 confidence level
  lastObserved: timestamp("last_observed"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertRoutingPatternSchema = createInsertSchema(routingPatterns).omit({
  id: true,
  createdAt: true
});

// Shared booking information
export const sharedBookings = pgTable("shared_bookings", {
  id: serial("id").primaryKey(),
  sourceVenueId: integer("source_venue_id").notNull().references(() => venues.id),
  bandId: integer("band_id"),
  bandName: text("band_name").notNull(),
  bookingDate: date("booking_date").notNull(),
  sharingLevel: text("sharing_level").default("public"), // public, trusted, private
  confirmedStatus: text("confirmed_status").default("pending"), // pending, confirmed, cancelled
  sharerId: integer("sharer_id"), // User who shared the booking
  routeEligible: boolean("route_eligible").default(true), // Can be used for routing suggestions
  createdAt: timestamp("created_at").defaultNow(),
  contactInfo: text("contact_info") // Optional contact info for the band
});

export const insertSharedBookingSchema = createInsertSchema(sharedBookings).omit({
  id: true,
  createdAt: true
});

// Booking collaboration offers
export const collaborativeOffers = pgTable("collaborative_offers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bandId: integer("band_id"),
  bandName: text("band_name").notNull(),
  initiatingVenueId: integer("initiating_venue_id").notNull().references(() => venues.id),
  dateRange: jsonb("date_range").$type<{start: string, end: string}>().notNull(),
  status: text("status").default("draft"), // draft, sent, accepted, declined
  offerDetails: jsonb("offer_details").$type<Record<string, any>>(), // Offer terms
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});

export const insertCollaborativeOfferSchema = createInsertSchema(collaborativeOffers).omit({
  id: true,
  createdAt: true
});

// Participating venues in collaborative offers
export const offerParticipants = pgTable("offer_participants", {
  offerId: integer("offer_id").notNull().references(() => collaborativeOffers.id),
  venueId: integer("venue_id").notNull().references(() => venues.id),
  proposedDate: date("proposed_date"),
  confirmationStatus: text("confirmation_status").default("pending"),
  venueNotes: text("venue_notes"),
  venueOffer: jsonb("venue_offer").$type<Record<string, any>>(),
  addedAt: timestamp("added_at").defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.offerId, table.venueId] })
  };
});

export const insertOfferParticipantSchema = createInsertSchema(offerParticipants).omit({
  addedAt: true
});

// Gap opportunities for routing
export const routingGaps = pgTable("routing_gaps", {
  id: serial("id").primaryKey(),
  priorVenueId: integer("prior_venue_id").notNull().references(() => venues.id),
  nextVenueId: integer("next_venue_id").notNull().references(() => venues.id),
  bandId: integer("band_id"),
  bandName: text("band_name").notNull(),
  gapStartDate: date("gap_start_date").notNull(),
  gapEndDate: date("gap_end_date").notNull(),
  eligibleVenues: jsonb("eligible_venues").$type<number[]>(), // Array of venue IDs
  notifiedVenues: jsonb("notified_venues").$type<number[]>(), // Array of venue IDs
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});

export const insertRoutingGapSchema = createInsertSchema(routingGaps).omit({
  id: true,
  createdAt: true,
  resolvedAt: true
});

// User notification preferences
export const venueNotificationPreferences = pgTable("venue_notification_preferences", {
  venueId: integer("venue_id").primaryKey().references(() => venues.id),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(false),
  gapOpportunityAlerts: boolean("gap_opportunity_alerts").default(true),
  tourPredictionAlerts: boolean("tour_prediction_alerts").default(true),
  collaborativeOfferAlerts: boolean("collaborative_offer_alerts").default(true),
  notificationRadius: integer("notification_radius").default(250), // km
  genrePreferences: jsonb("genre_preferences").$type<string[]>(),
  minCapacity: integer("min_capacity"),
  maxCapacity: integer("max_capacity"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertVenueNotificationPreferenceSchema = createInsertSchema(venueNotificationPreferences).omit({
  updatedAt: true
});

// Export types
export type Tour = typeof tours.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;

export type TourDate = typeof tourDates.$inferSelect;
export type InsertTourDate = z.infer<typeof insertTourDateSchema>;

export type Band = typeof bands.$inferSelect;
export type InsertBand = z.infer<typeof insertBandSchema>;

// Venue Network Types
export type VenueRelationshipType = typeof venueRelationshipTypes.$inferSelect;
export type InsertVenueRelationshipType = z.infer<typeof insertVenueRelationshipTypeSchema>;

export type VenueRelationship = typeof venueRelationships.$inferSelect;
export type InsertVenueRelationship = z.infer<typeof insertVenueRelationshipSchema>;

export type VenueCluster = typeof venueClusters.$inferSelect;
export type InsertVenueCluster = z.infer<typeof insertVenueClusterSchema>;

export type VenueClusterMember = typeof venueClusterMembers.$inferSelect;
export type InsertVenueClusterMember = z.infer<typeof insertVenueClusterMemberSchema>;

export type RoutingPattern = typeof routingPatterns.$inferSelect;
export type InsertRoutingPattern = z.infer<typeof insertRoutingPatternSchema>;

export type SharedBooking = typeof sharedBookings.$inferSelect;
export type InsertSharedBooking = z.infer<typeof insertSharedBookingSchema>;

export type CollaborativeOffer = typeof collaborativeOffers.$inferSelect;
export type InsertCollaborativeOffer = z.infer<typeof insertCollaborativeOfferSchema>;

export type OfferParticipant = typeof offerParticipants.$inferSelect;
export type InsertOfferParticipant = z.infer<typeof insertOfferParticipantSchema>;

export type RoutingGap = typeof routingGaps.$inferSelect;
export type InsertRoutingGap = z.infer<typeof insertRoutingGapSchema>;

export type VenueNotificationPreference = typeof venueNotificationPreferences.$inferSelect;
export type InsertVenueNotificationPreference = z.infer<typeof insertVenueNotificationPreferenceSchema>;