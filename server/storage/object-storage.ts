
import { Client } from '@replit/object-storage';

export const objectStorage = new Client();

export async function uploadFile(fileName: string, data: string | Buffer) {
  return await objectStorage.upload(fileName, data);
}

export async function downloadFile(fileName: string) {
  return await objectStorage.download(fileName);
}
