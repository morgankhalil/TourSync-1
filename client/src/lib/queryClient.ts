import { QueryClient } from '@tanstack/react-query';
import axios, { AxiosRequestConfig } from 'axios';

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Helper function to construct API URLs
const getApiUrl = (url: string): string => {
  // If it already starts with /api, return as is
  if (url.startsWith('/api')) {
    return url;
  }
  // Add /api prefix properly
  return url.startsWith('/') ? `${url}` : `/${url}`;
};

// Generic API request function for use with React Query
export const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  relativeURL: string,
  data?: any,
  params?: any
): Promise<T> => {
  try {
    // Ensure relativeURL is a string
    const urlString = String(relativeURL);
    const url = getApiUrl(urlString);

    const response = await axios({
      method,
      url,
      data,
      params
    });

    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Define options type for the API request function
type ApiRequestOptions = {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * A utility function for making API requests with axios
 * @param url The API endpoint for GET requests
 * @returns Promise that resolves to the response data
 */
// export async function apiRequest<T = any>(url: string): Promise<T>;

/**
 * A utility function for making API requests with axios
 * @param method HTTP method to use
 * @param url The API endpoint
 * @param data Optional data to send in the request body
 * @param options Optional axios config options
 * @returns Promise that resolves to the response data
 */
// export async function apiRequest<T = any>(
//   methodOrUrl: 'get' | 'post' | 'put' | 'patch' | 'delete' | string,
//   urlOrData?: string | any,
//   data?: any,
//   options?: ApiRequestOptions
// ): Promise<T> {
//   let method: 'get' | 'post' | 'put' | 'patch' | 'delete';
//   let url: string;
//   let requestData: any;

//   // Handle the case where only a URL is provided (GET request)
//   if (typeof methodOrUrl === 'string' && typeof urlOrData !== 'string' && urlOrData === undefined) {
//     method = 'get';
//     url = methodOrUrl;
//     requestData = undefined;
//   } else {
//     // Normal case with method and URL
//     method = methodOrUrl as 'get' | 'post' | 'put' | 'patch' | 'delete';
//     url = urlOrData as string;
//     requestData = data;
//   }
//   try {
//     const config: AxiosRequestConfig = {
//       method,
//       url,
//       params: options?.params,
//       headers: options?.headers,
//       signal: options?.signal,
//     };

//     // For GET requests, data should be in params
//     // For other requests, data should be in request body
//     if (method === 'get') {
//       config.params = { ...config.params, ...data };
//     } else {
//       config.data = data;
//     }

//     const response = await axios(config);
//     return response.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       // Handle API errors consistently
//       const errorMessage = error.response?.data?.message || error.message;
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// }

/**
 * Default fetcher function for React Query
 * This will be used when no queryFn is provided to useQuery
 */
export async function defaultFetcher<T = any>(context: any): Promise<T> {
  const { queryKey } = context;
  // The first element of queryKey should be the URL
  const [url, params] = queryKey;

  // For array query keys where the first element is a string (URL)
  // and second element contains params
  if (typeof url === 'string') {
    return apiRequest<T>('get', url, params);
  }

  throw new Error('Invalid query key format. Expected [url, params?]');
}

// Configure Axios defaults
axios.defaults.baseURL = '/';
axios.defaults.headers.common['Content-Type'] = 'application/json';