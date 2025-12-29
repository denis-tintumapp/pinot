/**
 * Hook para gestionar el timer del evento en tiempo real
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getFirestore, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface TimerState {
  timerActivo: boolean;
  timerExpiraEn: number | null;
  timerIniciadoEn: number | null;
  eventoFinalizado: boolean;
  error?: string;
}

export const useTimerEvento = (
  eventoId: string | null,
  onTimerExpired?: () => void
) => {
  const [timer, setTimer] = useState<TimerState>({
    timerActivo: false,
    timerExpiraEn: null,
    timerIniciadoEn: null,
    eventoFinalizado: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) {
      setLoading(false);
      return;
    }

    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (!app) {
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const eventoRef = doc(db, 'eventos', eventoId);

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      eventoRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setTimer({
            timerActivo: data.timerActivo || false,
            timerExpiraEn: data.timerExpiraEn
              ? (data.timerExpiraEn instanceof Timestamp
                  ? data.timerExpiraEn.toMillis()
                  : data.timerExpiraEn)
              : null,
            timerIniciadoEn: data.timerIniciadoEn
              ? (data.timerIniciadoEn instanceof Timestamp
                  ? data.timerIniciadoEn.toMillis()
                  : data.timerIniciadoEn)
              : null
          });
        } else {
          setTimer({
            timerActivo: false,
            timerExpiraEn: null,
            timerIniciadoEn: null
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('[useTimerEvento] Error:', error);
        setTimer({
          timerActivo: false,
          timerExpiraEn: null,
          timerIniciadoEn: null,
          eventoFinalizado: false,
          error: error.message
        });
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventoId]);

  const activarTimer = async (minutos: number = 30): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'Evento ID es requerido' };
    }

    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const eventoRef = doc(db, 'eventos', eventoId);

      const ahora = Timestamp.now();
      const expiraEn = Timestamp.fromMillis(ahora.toMillis() + minutos * 60 * 1000);

      await updateDoc(eventoRef, {
        timerActivo: true,
        timerExpiraEn: expiraEn,
        timerIniciadoEn: ahora
      });

      return { success: true };
    } catch (err: any) {
      console.error('[useTimerEvento] Error al activar:', err);
      return { success: false, error: err.message || 'Error al activar el timer' };
    }
  };

  const desactivarTimer = async (): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'Evento ID es requerido' };
    }

    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const eventoRef = doc(db, 'eventos', eventoId);

      await updateDoc(eventoRef, {
        timerActivo: false,
        timerExpiraEn: null,
        timerIniciadoEn: null
      });

      return { success: true };
    } catch (err: any) {
      console.error('[useTimerEvento] Error al desactivar:', err);
      return { success: false, error: err.message || 'Error al desactivar el timer' };
    }
  };

  const aumentarTiempo = async (minutosAdicionales: number = 5): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId || !timer.timerActivo || !timer.timerExpiraEn) {
      return { success: false, error: 'El timer no está activo' };
    }

    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const eventoRef = doc(db, 'eventos', eventoId);

      const expiraEnActual = Timestamp.fromMillis(timer.timerExpiraEn);
      const expiraEnNuevo = Timestamp.fromMillis(
        expiraEnActual.toMillis() + minutosAdicionales * 60 * 1000
      );

      await updateDoc(eventoRef, {
        timerExpiraEn: expiraEnNuevo
      });

      return { success: true };
    } catch (err: any) {
      console.error('[useTimerEvento] Error al aumentar tiempo:', err);
      return { success: false, error: err.message || 'Error al aumentar el tiempo del timer' };
    }
  };

  // Calcular tiempo restante
  const tiempoRestante = timer.timerExpiraEn && !timer.eventoFinalizado
    ? Math.max(0, timer.timerExpiraEn - Date.now())
    : 0;

  const minutosRestantes = Math.floor(tiempoRestante / (1000 * 60));
  const segundosRestantes = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

  // Verificar si el timer expiró cada segundo
  useEffect(() => {
    if (!timer.timerActivo || !timer.timerExpiraEn || timer.eventoFinalizado) {
      return;
    }

    const interval = setInterval(() => {
      const ahora = Date.now();
      if (timer.timerExpiraEn && timer.timerExpiraEn <= ahora && onTimerExpired) {
        onTimerExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.timerActivo, timer.timerExpiraEn, timer.eventoFinalizado, onTimerExpired]);

  return {
    timer,
    loading,
    tiempoRestante,
    minutosRestantes,
    segundosRestantes,
    activarTimer,
    desactivarTimer,
    aumentarTiempo
  };
};











