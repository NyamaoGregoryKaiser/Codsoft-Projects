```typescript
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';

interface UseFetchOptions {
  lazy?: boolean; // If true, don't fetch on mount
  initialData?: any;
}

export const useFetch = <T>(url: string, options?: UseFetchOptions) => {
  const [data, setData] = useState<T | null>(options?.initialData || null);
  const [loading, setLoading] = useState<boolean>(!options?.lazy);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<T>(url);
      setData(response.data.data || response.data); // Assuming backend wraps data in 'data' field
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!options?.lazy) {
      fetchData();
    }
  }, [fetchData, options?.lazy]);

  return { data, loading, error, refetch: fetchData, setData };
};

export const usePost = <T, U>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const postData = useCallback(async (payload: U, config?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<T>(url, payload, config);
      setData(response.data.data || response.data);
      return response.data.data || response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
      throw err; // Re-throw to allow component to catch specific errors
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, postData, setData };
};

// ... add usePut, useDelete similar to usePost if needed
```