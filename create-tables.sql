-- Create artists table
CREATE TABLE IF NOT EXISTS "artists" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "genres" JSONB DEFAULT '[]',
  "image_url" TEXT,
  "url" TEXT,
  "website" TEXT,
  "description" TEXT,
  "location" TEXT,
  "country" TEXT,
  "draw_size" INTEGER,
  "looking_to_collaborate" BOOLEAN DEFAULT TRUE,
  "collaboration_types" JSONB DEFAULT '[]',
  "social_media" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create artist_discovery table
CREATE TABLE IF NOT EXISTS "artist_discovery" (
  "artist_id" TEXT PRIMARY KEY,
  "last_checked" TEXT NOT NULL,
  "times_checked" INTEGER NOT NULL DEFAULT 1
);

-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
  "id" TEXT PRIMARY KEY,
  "artist_id" TEXT NOT NULL,
  "venue_name" TEXT NOT NULL,
  "venue_city" TEXT NOT NULL,
  "venue_state" TEXT,
  "venue_country" TEXT NOT NULL,
  "latitude" TEXT NOT NULL,
  "longitude" TEXT NOT NULL,
  "event_date" TIMESTAMP NOT NULL,
  "ticket_url" TEXT,
  "poster_url" TEXT,
  "collaboration_open" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create collaboration_requests table
CREATE TABLE IF NOT EXISTS "collaboration_requests" (
  "id" SERIAL PRIMARY KEY,
  "requesting_artist_id" TEXT NOT NULL,
  "receiving_artist_id" TEXT NOT NULL,
  "event_id" TEXT,
  "message" TEXT,
  "status" TEXT DEFAULT 'pending',
  "request_date" TIMESTAMP DEFAULT NOW(),
  "response_date" TIMESTAMP
);

-- Create artist_compatibility table
CREATE TABLE IF NOT EXISTS "artist_compatibility" (
  "artist_id1" TEXT NOT NULL,
  "artist_id2" TEXT NOT NULL,
  "compatibility_score" INTEGER NOT NULL,
  "genre_overlap" INTEGER,
  "audience_match" INTEGER,
  "updated_at" TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("artist_id1", "artist_id2")
);
