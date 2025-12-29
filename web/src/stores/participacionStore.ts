/**
 * Store de Zustand para sesiones de participación
 * Con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ParticipacionState {
  sesiones: Record<string, string>; // eventoId -> sesionId
  
  // Acciones
  getSesionId: (eventoId: string) => string | null;
  setSesionId: (eventoId: string, sesionId: string) => void;
  clearSesion: (eventoId: string) => void;
  clearAllSesiones: () => void;
}

export const useParticipacionStore = create<ParticipacionState>()(
  persist(
    (set, get) => ({
      sesiones: {},
      
      getSesionId: (eventoId) => {
        return get().sesiones[eventoId] || null;
      },
      
      setSesionId: (eventoId, sesionId) => {
        set((state) => ({
          sesiones: {
            ...state.sesiones,
            [eventoId]: sesionId,
          },
        }));
      },
      
      clearSesion: (eventoId) => {
        set((state) => {
          const { [eventoId]: _, ...rest } = state.sesiones;
          return { sesiones: rest };
        });
      },
      
      clearAllSesiones: () => {
        set({ sesiones: {} });
      },
    }),
    {
      name: 'participacion-sesiones-storage',
    }
  )
);

