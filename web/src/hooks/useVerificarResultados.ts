/**
 * Hook para verificar periódicamente si los resultados fueron revelados
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const useVerificarResultados = (
  eventoId: string | null,
  onResultadosRevelados?: () => void
) => {
  const [resultadosRevelados, setResultadosRevelados] = useState(false);
  const [loading, setLoading] = useState(true);
  const verificacionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Verificar si resultados fueron revelados
  const verificarResultadosRevelados = useCallback(async (): Promise<boolean> => {
    if (!eventoId) return false;

    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) return false;

      const eventoData = eventoSnap.data();
      // Verificar si el evento está finalizado (esto indica que los resultados están disponibles)
      return eventoData.eventoFinalizado === true;
    } catch (error) {
      console.error('Error al verificar resultados revelados:', error);
      return false;
    }
  }, [eventoId]);

  // Iniciar verificación periódica
  const iniciarVerificacion = useCallback(() => {
    if (!eventoId) return;

    // Limpiar verificación anterior
    detenerVerificacion();

    // Función para verificar y actualizar
    const verificarYActualizar = async () => {
      const revelados = await verificarResultadosRevelados();
      if (revelados) {
        setResultadosRevelados(true);
        if (onResultadosRevelados) {
          onResultadosRevelados();
        }
        detenerVerificacion();
      }
    };

    // Verificar inmediatamente
    verificarYActualizar();
    setLoading(false);

    // Verificar cada 3 segundos
    verificacionIntervalRef.current = setInterval(verificarYActualizar, 3000);

    // También escuchar cambios en tiempo real
    const eventoRef = doc(db, 'eventos', eventoId);
    unsubscribeRef.current = onSnapshot(
      eventoRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const eventoData = docSnapshot.data();
          const revelados = eventoData.eventoFinalizado === true;
          if (revelados) {
            setResultadosRevelados(true);
            if (onResultadosRevelados) {
              onResultadosRevelados();
            }
            detenerVerificacion();
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar cambios de resultados:', error);
        setLoading(false);
      }
    );
  }, [eventoId, verificarResultadosRevelados, onResultadosRevelados]);

  // Detener verificación
  const detenerVerificacion = useCallback(() => {
    if (verificacionIntervalRef.current) {
      clearInterval(verificacionIntervalRef.current);
      verificacionIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Efecto para iniciar verificación cuando cambia eventoId
  useEffect(() => {
    if (eventoId) {
      iniciarVerificacion();
    }

    return () => {
      detenerVerificacion();
    };
  }, [eventoId, iniciarVerificacion, detenerVerificacion]);

  return {
    resultadosRevelados,
    loading,
    verificarResultadosRevelados,
    iniciarVerificacion,
    detenerVerificacion,
  };
};
