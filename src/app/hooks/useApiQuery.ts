/**
 * Hook genérico para peticiones API con estado de carga y error
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiQueryOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApiQuery<T>(
  queryFn: () => Promise<any>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    onSuccess,
    onError,
    enabled = true,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await queryFn();
      
      // Extraer data de la respuesta si existe
      const result = response.data || response;
      
      setData(result);

      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const error = new Error(err.message || 'Error en la petición');
      setError(error);

      if (showErrorToast) {
        toast.error(error.message);
      }

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError, showErrorToast, showSuccessToast, successMessage]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled]); // Solo ejecutar cuando enabled cambie

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    reset,
  };
}

/**
 * Hook para mutaciones (POST, PUT, DELETE)
 */
interface UseApiMutationResult<T, TVariables> {
  mutate: (variables: TVariables) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

interface UseApiMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useApiMutation<T = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  options: UseApiMutationOptions<T> = {}
): UseApiMutationResult<T, TVariables> {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = true,
    successMessage,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await mutationFn(variables);
        
        // Extraer data de la respuesta si existe
        const result = response.data || response;
        
        setData(result);

        if (showSuccessToast) {
          toast.success(successMessage || response.message || 'Operación exitosa');
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const error = new Error(err.message || 'Error en la operación');
        setError(error);

        if (showErrorToast) {
          toast.error(error.message);
        }

        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, showErrorToast, showSuccessToast, successMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
}
