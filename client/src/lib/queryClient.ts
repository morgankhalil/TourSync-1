import { QueryClient } from '@tanstack/react-query';
import axios, { AxiosRequestConfig } from 'axios';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configure Axios defaults
axios.defaults.baseURL = '/';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Define options type for the API request function
type ApiRequestOptions = {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * A utility function for making API requests with axios
 * @param method HTTP method to use
 * @param url The API endpoint
 * @param data Optional data to send in the request body
 * @param options Optional axios config options
 * @returns Promise that resolves to the response data
 */
export async function apiRequest<T = any>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<T> {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
    };

    // For GET requests, data should be in params
    // For other requests, data should be in request body
    if (method === 'get') {
      config.params = { ...config.params, ...data };
    } else {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle API errors consistently
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Default fetcher function for React Query
 * This will be used when no queryFn is provided to useQuery
 */
export async function defaultFetcher<T = any>({ queryKey }: { queryKey: any[] }): Promise<T> {
  // The first element of queryKey should be the URL
  const [url, params] = queryKey;
  
  // For array query keys where the first element is a string (URL)
  // and second element contains params
  if (typeof url === 'string') {
    return apiRequest<T>('get', url, params);
  }
  
  throw new Error('Invalid query key format. Expected [url, params?]');
}