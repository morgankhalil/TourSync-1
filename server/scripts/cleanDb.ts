
import { db } from '../db';
import { venues } from '../../shared/schema';
import { sql } from 'drizzle-orm';

async function cleanupDatabase() {
  console.log('Cleaning up database...');

  try {
    // Remove duplicate venues based on name and address
    await db.execute(sql`
      WITH duplicates AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY name, address
            ORDER BY id
          ) as row_num
        FROM venues
      )
      DELETE FROM venues 
      WHERE id IN (
        SELECT id 
        FROM duplicates 
        WHERE row_num > 1
      );
    `);

    console.log('Removed duplicate venues');
    
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

cleanupDatabase()
  .catch(console.error)
  .finally(() => {
    console.log('Database cleanup complete');
  });
