import { useState, useEffect, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(() => {
    setState({ data: null, loading: true, error: null });
    let cancelled = false;
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return execute();
  }, [execute]);

  return { ...state, refetch: execute };
}
