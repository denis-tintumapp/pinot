/**
 * Hook para cargar y gestionar eventos en el panel de administración
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getFirestore,
  getDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { registrarActualizacion, registrarEliminacion } from '../utils/logger';

interface Evento {
  id: string;
  nombre?: string;
  pin?: string;
  anfitrionId?: string;
  activo?: boolean;
  habilitado?: boolean;
  cantidadParticipantes?: number;
  cantidadEtiquetas?: number;
  creadoEn?: any;
}

export const useAdminEventos = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      setError(null);

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
      const eventosRef = collection(db, 'eventos');
      const querySnapshot = await getDocs(eventosRef);

      const eventosData: Evento[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        eventosData.push({
          id: docSnap.id,
          ...data
        } as Evento);
      });

      // Ordenar por fecha de creación (más reciente primero)
      eventosData.sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
        const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
        return fechaB - fechaA;
      });

      // Cargar información adicional (participantes y etiquetas) para cada evento
      for (const evento of eventosData) {
        // Contar participantes
        const participantesRef = collection(db, 'participantes');
        const qParticipantes = query(participantesRef, where('eventoId', '==', evento.id));
        const participantesSnapshot = await getDocs(qParticipantes);
        evento.cantidadParticipantes = participantesSnapshot.size;

        // Contar etiquetas únicas
        const etiquetasRef = collection(db, 'etiquetas');
        const qEtiquetas = query(etiquetasRef, where('eventoId', '==', evento.id));
        const etiquetasSnapshot = await getDocs(qEtiquetas);
        const etiquetasUnicas = new Set<string>();
        etiquetasSnapshot.forEach((doc) => {
          const data = doc.data();
          const etiquetaId = data.etiquetaId || '';
          if (etiquetaId) {
            etiquetasUnicas.add(etiquetaId);
          }
        });
        evento.cantidadEtiquetas = etiquetasUnicas.size;
      }

      setEventos(eventosData);
    } catch (err: any) {
      console.error('[useAdminEventos] Error:', err);
      setError(err.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEvento = async (id: string, datos: Partial<Evento>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (datos.pin && !/^[0-9]{5}$/.test(datos.pin)) {
        return { success: false, error: 'El PIN debe tener exactamente 5 dígitos numéricos' };
      }

      if (!datos.nombre) {
        return { success: false, error: 'El nombre del evento es requerido' };
      }

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
      const eventoRef = doc(db, 'eventos', id);
      
      // Obtener datos anteriores antes de actualizar
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;
      
      await updateDoc(eventoRef, datos);

      // Registrar acción en el log
      await registrarActualizacion('eventos', id, datos, datosAnteriores);

      await cargarEventos();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEventos] Error al actualizar:', err);
      return { success: false, error: err.message || 'Error al actualizar evento' };
    }
  };

  const eliminarEvento = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const eventoRef = doc(db, 'eventos', id);
      
      // Obtener datos antes de eliminar
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;
      
      await deleteDoc(eventoRef);

      // Registrar acción en el log
      if (datosAnteriores) {
        await registrarEliminacion('eventos', id, datosAnteriores);
      }

      await cargarEventos();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEventos] Error al eliminar:', err);
      return { success: false, error: err.message || 'Error al eliminar evento' };
    }
  };

  const deshabilitarEvento = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const eventoRef = doc(db, 'eventos', id);
      
      // Obtener datos anteriores antes de actualizar
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Evento no encontrado' };
      }

      await updateDoc(eventoRef, { habilitado: false });

      // Registrar acción en el log
      await registrarActualizacion('eventos', id, { habilitado: false }, datosAnteriores);

      await cargarEventos();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEventos] Error al deshabilitar:', err);
      return { success: false, error: err.message || 'Error al deshabilitar evento' };
    }
  };

  const habilitarEvento = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const eventoRef = doc(db, 'eventos', id);
      
      // Obtener datos anteriores antes de actualizar
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Evento no encontrado' };
      }

      await updateDoc(eventoRef, { habilitado: true });

      // Registrar acción en el log
      await registrarActualizacion('eventos', id, { habilitado: true }, datosAnteriores);

      await cargarEventos();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEventos] Error al habilitar:', err);
      return { success: false, error: err.message || 'Error al habilitar evento' };
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  return {
    eventos,
    loading,
    error,
    cargarEventos,
    actualizarEvento,
    eliminarEvento,
    deshabilitarEvento,
    habilitarEvento
  };
};











