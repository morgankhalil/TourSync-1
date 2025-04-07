import { useQuery } from '@tanstack/react-query';

// This service fetches environment variables from the server
export interface EnvVars {
  GOOGLE_MAPS_API_KEY: string;
  BANDSINTOWN_API_KEY: string;
}

export async function getEnvVars(): Promise<EnvVars> {
  const response = await fetch('/api/env');
  
  if (!response.ok) {
    throw new Error('Failed to fetch environment variables');
  }
  
  return response.json();
}

export function useEnvVars() {
  return useQuery({
    queryKey: ['/api/env'],
    queryFn: getEnvVars,
    staleTime: Infinity, // Environment variables don't change during the session
    retry: 3,
  });
}