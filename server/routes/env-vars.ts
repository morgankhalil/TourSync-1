import type { Express } from "express";
import * as fs from 'fs';
import * as path from 'path';

// Function to read environment variables directly from .env file
function readEnvFile(): Record<string, string> {
  try {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars: Record<string, string> = {};
    
    // Parse each line
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      // Split by first equals sign
      const equalsIndex = trimmedLine.indexOf('=');
      if (equalsIndex !== -1) {
        const key = trimmedLine.substring(0, equalsIndex).trim();
        const value = trimmedLine.substring(equalsIndex + 1).trim();
        // Remove quotes if present
        envVars[key] = value.replace(/^["'](.*)["']$/, '$1');
      }
    });
    
    console.log('Loaded environment variables: ', Object.keys(envVars));
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

export function registerEnvVarsRoutes(app: Express): void {
  const envVariables = readEnvFile();
  
  // Route to provide environment variables to the frontend
  app.get("/api/env", (_req, res) => {
    // Only expose specific environment variables that are needed on the frontend
    // and that are safe to expose
    const envVars = {
      GOOGLE_MAPS_API_KEY: envVariables['VITE_GOOGLE_MAPS_API_KEY'] || "",
      BANDSINTOWN_API_KEY: envVariables['VITE_BANDSINTOWN_API_KEY'] || "",
    };
    
    console.log('Sending environment variables to client:', JSON.stringify(envVars).replace(/[A-Za-z0-9_-]{20,}/g, '***'));
    res.json(envVars);
  });
}