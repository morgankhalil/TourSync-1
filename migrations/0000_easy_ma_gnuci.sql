CREATE TABLE "artist_discovery" (
	"artist_id" text PRIMARY KEY NOT NULL,
	"last_checked" text NOT NULL,
	"times_checked" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"genres" jsonb,
	"image_url" text,
	"url" text,
	"website" text,
	"draw_size" integer
);
--> statement-breakpoint
CREATE TABLE "bands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"genre" text,
	"social" jsonb,
	"draw_size" integer,
	"past_venues" jsonb,
	"technical_requirements" jsonb,
	"media_links" jsonb,
	"last_tour_date" date,
	"avg_ticket_price" integer,
	"press_kit" text,
	"preferred_venue_types" jsonb
);
--> statement-breakpoint
CREATE TABLE "tour_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"tour_id" integer NOT NULL,
	"venue_id" integer,
	"date" date NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"status" text DEFAULT 'open',
	"notes" text,
	"venue_name" text,
	"is_open_date" boolean DEFAULT false,
	"poster" text
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"band_id" integer NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "venue_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"date" date NOT NULL,
	"is_available" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"bandsintown_id" text,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"capacity" integer,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"website" text,
	"description" text,
	"genre" text,
	"deal_type" text,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"technical_specs" jsonb,
	"venue_type" text,
	"amenities" jsonb,
	"past_performers" jsonb,
	"photo_gallery" jsonb,
	"loading_info" text,
	"accommodations" text,
	"preferred_genres" jsonb,
	"price_range" jsonb
);
