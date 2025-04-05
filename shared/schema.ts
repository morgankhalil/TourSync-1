import { pgTable, text, serial, integer, date, boolean, jsonb } from "drizzle-orm/pg-core";
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
  social: jsonb("social")
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
  description: text("description"),
  genre: text("genre"),
  dealType: text("deal_type"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull()
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
