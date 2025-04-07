
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

    // Cities and states for random assignment
    const locations = [
      { city: 'Chicago', state: 'IL' },
      { city: 'Milwaukee', state: 'WI' },
      { city: 'Madison', state: 'WI' },
      { city: 'Detroit', state: 'MI' },
      { city: 'Cleveland', state: 'OH' },
      { city: 'New York', state: 'NY' },
      { city: 'Boston', state: 'MA' }
    ];

    // Update all tour dates with complete demo data
    await db.execute(sql`
      UPDATE tour_dates
      SET 
        venue_id = ${sql.join(venueIds, ', ')}[floor(random() * ${venueIds.length})::integer],
        date = (CURRENT_DATE + (floor(random() * 90))::integer)::date,
        status = (ARRAY['confirmed', 'pending', 'open'])[floor(random() * 3 + 1)],
        city = (
          SELECT city FROM (
            SELECT unnest(${sql.array(locations.map(l => l.city), 'text')}) as city
          ) AS cities OFFSET floor(random() * ${locations.length}) LIMIT 1
        ),
        state = (
          SELECT state FROM (
            SELECT unnest(${sql.array(locations.map(l => l.state), 'text')}) as state
          ) AS states OFFSET floor(random() * ${locations.length}) LIMIT 1
        ),
        venue_name = (SELECT name FROM venues WHERE venues.id = tour_dates.venue_id),
        is_open_date = false,
        notes = CASE 
          WHEN random() < 0.3 THEN 'Pending contract'
          WHEN random() < 0.6 THEN 'Confirmed booking'
          ELSE 'Ready for show'
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
