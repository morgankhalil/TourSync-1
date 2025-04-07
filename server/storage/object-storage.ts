import fs from 'fs';
import path from 'path';

// Simple file-based object storage implementation
// In a production environment, you would use a real object storage service like S3, GCS, etc.
const STORAGE_DIR = path.join(process.cwd(), '.cache');

// Ensure the storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Uploads data to object storage
 * @param key The key to store the data under
 * @param data The data to store
 */
export async function uploadFile(key: string, data: string | Buffer): Promise<void> {
  const filePath = path.join(STORAGE_DIR, key);
  
  // Make sure the directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Downloads data from object storage
 * @param key The key to retrieve
 * @returns The retrieved data or null if not found
 */
export async function downloadFile(key: string): Promise<Buffer | null> {
  const filePath = path.join(STORAGE_DIR, key);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Deletes data from object storage
 * @param key The key to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const filePath = path.join(STORAGE_DIR, key);
  
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Lists all keys in object storage with a given prefix
 * @param prefix The prefix to filter by
 */
export async function listFiles(prefix: string = ''): Promise<string[]> {
  const dir = path.join(STORAGE_DIR, prefix);
  
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map(file => path.join(prefix, file)));
      }
    });
  });
}