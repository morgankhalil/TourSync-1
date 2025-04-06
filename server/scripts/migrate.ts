
import { db } from '../db';
import { bands, venues, tours, tourDates, venueAvailability } from '../../shared/schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating database tables...');
  
  try {
    // Create tables in correct order due to foreign key constraints
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        genre TEXT,
        social JSONB
      );

      CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        capacity INTEGER,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        description TEXT,
        genre TEXT,
        deal_type TEXT,
        latitude TEXT NOT NULL,
        longitude TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tours (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        band_id INTEGER NOT NULL REFERENCES bands(id),
        notes TEXT,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS tour_dates (
        id SERIAL PRIMARY KEY,
        tour_id INTEGER NOT NULL REFERENCES tours(id),
        venue_id INTEGER REFERENCES venues(id),
        date DATE NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        notes TEXT,
        venue_name TEXT,
        is_open_date BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS venue_availability (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER NOT NULL REFERENCES venues(id),
        date DATE NOT NULL,
        is_available BOOLEAN DEFAULT true
      );
    `);

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

migrate()
  .catch(console.error)
  .finally(() => {
    console.log('Migration complete');
  });
