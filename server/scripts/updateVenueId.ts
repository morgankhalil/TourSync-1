
import { db } from '../db';
import { venues } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function updateEmptyBottleId() {
  try {
    await db.update(venues)
      .set({ bandsintownId: '1169' }) // Empty Bottle's Bandsintown ID
      .where(eq(venues.id, 45));
    
    console.log('Successfully updated Empty Bottle Bandsintown ID');
  } catch (error) {
    console.error('Error updating venue ID:', error);
  }
}

updateEmptyBottleId().then(() => process.exit(0));
