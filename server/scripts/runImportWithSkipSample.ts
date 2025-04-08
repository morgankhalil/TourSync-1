import dotenv from 'dotenv';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

// Set SKIP_SAMPLE_DATA to true
process.env.SKIP_SAMPLE_DATA = 'true';

console.log('Running importBandsintownData.ts with SKIP_SAMPLE_DATA=true');

// Execute the importBandsintownData.ts script
exec('npx tsx server/scripts/importBandsintownData.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});