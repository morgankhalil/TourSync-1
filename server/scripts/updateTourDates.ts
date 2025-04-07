
import { db } from '../db';
import { tourDates, venues } from '../../shared/schema';
import { sql } from 'drizzle-orm';

async function updateTourDatesWithDemoData() {
  console.log('Updating tour dates with demo data...');

  try {
    // Get all venue IDs
    const venuesList = await db.select().from(venues);
    const venueIds = venuesList.map(venue => venue.id);

    if (venueIds.length === 0) {
      console.error('No venues found in database');
      return;
    }

    // Generate dates starting from today
    const startDate = new Date();
    const statuses = ['confirmed', 'pending', 'open'];

    // Update all tour dates with new demo data
    await db.execute(sql`
      UPDATE tour_dates
      SET 
        venue_id = CASE 
          WHEN random() < 0.8 THEN ${sql.join(venueIds, ', ')}[floor(random() * ${venueIds.length})]::integer
          ELSE NULL
        END,
        date = (CURRENT_DATE + (floor(random() * 90))::integer)::date,
        status = CASE 
          WHEN random() < 0.6 THEN 'confirmed'
          WHEN random() < 0.8 THEN 'pending'
          ELSE 'open'
        END,
        is_open_date = CASE 
          WHEN venue_id IS NULL THEN true 
          ELSE false 
        END,
        venue_name = CASE 
          WHEN venue_id IS NOT NULL THEN (SELECT name FROM venues WHERE venues.id = tour_dates.venue_id)
          ELSE NULL
        END
    `);

    console.log('Successfully updated tour dates with demo data');
    
  } catch (error) {
    console.error('Error updating tour dates:', error);
    throw error;
  }
}

updateTourDatesWithDemoData()
  .catch(console.error)
  .finally(() => {
    console.log('Update complete');
    process.exit(0);
  });
