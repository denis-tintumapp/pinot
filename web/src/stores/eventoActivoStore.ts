/**
 * Store de Zustand para evento activo
 * Complementa el hook useEventoActivo para estado compartido
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EventoActivo {
  id: string;
  nombre: string;
  pin: string;
  activo: boolean;
  [key: string]: any;
}

interface EventoActivoState {
  eventoActivo: EventoActivo | null;
  loading: boolean;
  error: string | null;
  
  // Acciones
  setEventoActivo: (evento: EventoActivo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearEventoActivo: () => void;
}

export const useEventoActivoStore = create<EventoActivoState>()(
  persist(
    (set) => ({
      // Estado inicial
      eventoActivo: null,
      loading: false,
      error: null,
      
      // Acciones
      setEventoActivo: (evento) => set({ eventoActivo: evento }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearEventoActivo: () => set({
        eventoActivo: null,
        loading: false,
        error: null,
      }),
    }),
    {
      name: 'evento-activo-storage', // nombre en localStorage
      partialize: (state) => ({
        // Solo persistir el evento activo, no loading ni error
        eventoActivo: state.eventoActivo,
      }),
    }
  )
);

