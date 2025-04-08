import { replitDbStorage } from './replitDbStorage';
import { db } from '../db';
import { IStorage } from './types';

// Initialize storage with Replit DB implementation
export const storage: IStorage = replitDbStorage;

// Export the raw ReplitDb service for direct access when needed
export { replitDbStorage };

// Also export the PostgreSQL db instance for use with Drizzle ORM when needed
export { db as postgresDb };