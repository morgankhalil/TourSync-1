
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function addBandsintownIdColumn() {
  try {
    console.log('Adding bandsintown_id column to venues table...');
    
    await db.execute(sql`
      ALTER TABLE venues 
      ADD COLUMN IF NOT EXISTS bandsintown_id TEXT;
    `);

    console.log('Successfully added bandsintown_id column');
  } catch (error) {
    console.error('Error adding bandsintown_id column:', error);
    throw error;
  }
}

addBandsintownIdColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
