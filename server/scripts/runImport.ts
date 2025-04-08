import path from 'path';
import { execSync } from 'child_process';

// Run the import script directly
console.log('Running Bandsintown import script...');

try {
  // Use tsx to run the import script
  execSync('npx tsx server/scripts/importBandsintownData.ts', { 
    stdio: 'inherit', 
    env: {
      ...process.env,
      SKIP_SAMPLE_DATA: 'true' // Set SKIP_SAMPLE_DATA to true during import
    }
  });
  
  console.log('Import completed successfully.');
} catch (error) {
  console.error('Error running import script:', error);
  process.exit(1);
}