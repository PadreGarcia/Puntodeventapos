import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook para manejar llamadas a la API con estado de carga y errores
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  } = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await apiFunction(...args);
        const data = response.data || response;

        setState({ data, loading: false, error: null });

        if (options.showSuccessToast && options.successMessage) {
          toast.success(options.successMessage);
        }

        if (options.onSuccess) {
          options.onSuccess(data);
        }

        return data;
      } catch (error: any) {
        const errorMessage = error.message || 'Error desconocido';
        setState({ data: null, loading: false, error: errorMessage });

        if (options.showErrorToast !== false) {
          toast.error(errorMessage);
        }

        if (options.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}
