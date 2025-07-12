import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string,
    body?: any,
    headers?: Record<string, string>
  }
): Promise<Response> {
  const method = options?.method || 'GET';
  const data = options?.body;
  // Get Supabase access token if available
  let accessToken = '';
  try {
    const { supabase } = await import('../supabaseClient');
    const session = await supabase.auth.getSession();
    accessToken = session?.data?.session?.access_token || '';
  } catch (e) {
    // fallback: no token
  }

  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Supabase access token if available
    let accessToken = '';
    try {
      const { supabase } = await import('../supabaseClient');
      const session = await supabase.auth.getSession();
      accessToken = session?.data?.session?.access_token || '';
    } catch (e) {
      // fallback: no token
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
