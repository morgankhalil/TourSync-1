import Database from '@replit/database';

/**
 * Replit Database client wrapper to provide collection-like functionality
 * This is a simple implementation to bridge the gap between key-value and document storage
 */
class ReplitDb {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  /**
   * Get a value from the database
   * @param key The key to get
   * @returns The value, or null if it doesn't exist
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.db.get(key);
      return value as T || null;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in the database
   * @param key The key to set
   * @param value The value to set
   * @returns True if successful
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await this.db.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from the database
   * @param key The key to delete
   * @returns True if successful
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.db.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * List all keys with a specific prefix
   * @param prefix The prefix to search for
   * @returns Array of keys
   */
  async listWithPrefix(prefix: string): Promise<string[]> {
    try {
      const keys = await this.db.list(prefix);
      return Object.keys(keys);
    } catch (error) {
      console.error(`Error listing keys with prefix ${prefix}:`, error);
      return [];
    }
  }

  /**
   * Get the next ID for a collection
   * @param collection The collection name
   * @returns The next ID to use
   */
  private async getNextId(collection: string): Promise<number> {
    const metaKey = `${collection}:meta`;
    const meta = await this.get<{ nextId: number }>(metaKey);
    
    if (!meta) {
      // Initialize if not exists
      await this.set(metaKey, { nextId: 2 });
      return 1;
    }
    
    const nextId = meta.nextId;
    await this.set(metaKey, { nextId: nextId + 1 });
    return nextId;
  }

  /**
   * Add an item to a collection
   * @param collection The collection name
   * @param item The item to add
   * @returns The added item with its ID
   */
  async addToCollection<T extends { id?: number }>(collection: string, item: Omit<T, 'id'>): Promise<T> {
    const id = await this.getNextId(collection);
    const itemWithId = { ...item, id } as T;
    const itemKey = `${collection}:${id}`;
    
    await this.set(itemKey, itemWithId);
    return itemWithId;
  }

  /**
   * Get an item from a collection by ID
   * @param collection The collection name
   * @param id The item ID
   * @returns The item or null if not found
   */
  async getFromCollection<T extends { id: number }>(collection: string, id: number): Promise<T | null> {
    const itemKey = `${collection}:${id}`;
    return await this.get<T>(itemKey);
  }

  /**
   * Update an item in a collection
   * @param collection The collection name
   * @param id The item ID
   * @param updates The partial updates to apply
   * @returns The updated item or null if not found
   */
  async updateInCollection<T extends { id: number }>(
    collection: string, 
    id: number, 
    updates: Partial<Omit<T, 'id'>>
  ): Promise<T | null> {
    const itemKey = `${collection}:${id}`;
    const existingItem = await this.get<T>(itemKey);
    
    if (!existingItem) {
      return null;
    }
    
    const updatedItem = { ...existingItem, ...updates };
    await this.set(itemKey, updatedItem);
    
    return updatedItem;
  }

  /**
   * Delete an item from a collection
   * @param collection The collection name
   * @param id The item ID
   * @returns True if successful
   */
  async deleteFromCollection(collection: string, id: number): Promise<boolean> {
    const itemKey = `${collection}:${id}`;
    return await this.delete(itemKey);
  }

  /**
   * Get all items from a collection
   * @param collection The collection name
   * @returns Array of items
   */
  async getAllFromCollection<T extends { id: number }>(collection: string): Promise<T[]> {
    const prefix = `${collection}:`;
    const keys = await this.listWithPrefix(prefix);
    
    // Filter out the meta key
    const itemKeys = keys.filter(key => key !== `${collection}:meta`);
    
    // Get all items
    const items = await Promise.all(
      itemKeys.map(key => this.get<T>(key))
    );
    
    // Filter out any null items
    return items.filter((item): item is T => item !== null);
  }
}

// Export a singleton instance
export const replitDb = new ReplitDb();