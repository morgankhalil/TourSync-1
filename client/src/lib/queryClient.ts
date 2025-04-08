import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string | number | boolean>;
  disableContentType?: boolean;
}

export function formatQueryParams(params?: Record<string, string | number | boolean>): string {
  if (!params) return "";
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function apiRequest<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    queryParams,
    disableContentType = false,
  } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  if (!disableContentType && method !== "GET") {
    requestHeaders["Content-Type"] = "application/json";
  }

  const url = `${path}${formatQueryParams(queryParams)}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body && !disableContentType ? JSON.stringify(body) : body,
  });

  // For non-JSON responses or empty responses
  if (response.headers.get("content-type")?.includes("text/plain") || response.status === 204) {
    return (await response.text()) as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An error occurred");
  }

  return data;
}