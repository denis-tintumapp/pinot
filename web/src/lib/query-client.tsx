/**
 * Configuración de TanStack Query (React Query)
 * QueryClient y Provider para manejo de estado del servidor
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Crear QueryClient con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache (antes cacheTime)
      retry: 2, // Reintentar 2 veces en caso de error
      refetchOnWindowFocus: false, // No refetch automático al enfocar ventana
      refetchOnMount: true, // Refetch al montar componente
      refetchOnReconnect: true, // Refetch al reconectar
    },
    mutations: {
      retry: 1, // Reintentar 1 vez en mutations
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Provider de TanStack Query
 * Envuelve la aplicación para habilitar React Query
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Exportar queryClient para uso directo si es necesario
export { queryClient };

