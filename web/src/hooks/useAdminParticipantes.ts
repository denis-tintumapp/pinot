/**
 * Hook para cargar y gestionar participantes en el panel de administración
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getFirestore,
  getDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { registrarActualizacion, registrarEliminacion } from '../utils/logger';

type TipoParticipante = 'efimero' | 'permanente' | 'miembro';

interface Participante {
  id: string;
  nombre?: string;
  tipo?: TipoParticipante;
  eventoId?: string;
  userId?: string;
  alias?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  emailVerificado?: boolean;
  membresiaId?: string;
  habilitado?: boolean;
  creadoEn?: any;
  actualizadoEn?: any;
}

export const useAdminParticipantes = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarParticipantes = async () => {
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
      const participantesRef = collection(db, 'participantes');
      const querySnapshot = await getDocs(participantesRef);

      const participantesData: Participante[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        participantesData.push({
          id: docSnap.id,
          ...data
        } as Participante);
      });

      // Ordenar por fecha de creación (más reciente primero)
      participantesData.sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
        const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
        return fechaB - fechaA;
      });

      setParticipantes(participantesData);
    } catch (err: any) {
      console.error('[useAdminParticipantes] Error:', err);
      setError(err.message || 'Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  };

  const actualizarParticipante = async (id: string, datos: Partial<Participante>): Promise<{ success: boolean; error?: string }> => {
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
      const participanteRef = doc(db, 'participantes', id);
      
      // Obtener datos anteriores antes de actualizar
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Participante no encontrado' };
      }

      // Obtener userId para actualizar Firebase Auth si es necesario
      const userId = datosAnteriores.userId;
      
      // Actualizar documento en Firestore
      await updateDoc(participanteRef, datos);

      // Si hay cambios en email o nombre y tiene userId, actualizar Firebase Auth
      if (userId && (datos.email || datos.nombreCompleto || datos.alias)) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions(app, 'us-central1');
          const actualizarUsuarioAuthFn = httpsCallable(functions, 'actualizarUsuarioAuth');
          
          const updateAuthData: any = {};
          if (datos.email && datos.email !== datosAnteriores.email) {
            updateAuthData.email = datos.email;
          }
          if ((datos.nombreCompleto || datos.alias) && (datos.nombreCompleto || datos.alias) !== (datosAnteriores.nombreCompleto || datosAnteriores.alias)) {
            updateAuthData.displayName = datos.nombreCompleto || datos.alias || datosAnteriores.nombreCompleto || datosAnteriores.alias;
          }
          
          if (Object.keys(updateAuthData).length > 0) {
            await actualizarUsuarioAuthFn({ userId, ...updateAuthData });
            console.log('[useAdminParticipantes] Usuario actualizado en Firebase Auth:', userId, updateAuthData);
          }
        } catch (authError: any) {
          console.warn('[useAdminParticipantes] Error al actualizar usuario de Auth (continuando):', authError);
          // No bloquear la actualización si falla actualizar Auth
          // El documento ya fue actualizado en Firestore
        }
      }

      // Registrar acción en el log
      await registrarActualizacion('participantes', id, datos, datosAnteriores);

      await cargarParticipantes();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminParticipantes] Error al actualizar:', err);
      return { success: false, error: err.message || 'Error al actualizar participante' };
    }
  };

  const eliminarParticipante = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const participanteRef = doc(db, 'participantes', id);
      
      // Obtener datos antes de eliminar
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Participante no encontrado' };
      }

      // Obtener userId para eliminar de Firebase Auth si existe
      const userId = datosAnteriores.userId || id;
      
      // Eliminar documento de Firestore
      await deleteDoc(participanteRef);

      // Eliminar usuario de Firebase Auth si tiene userId
      if (userId && datosAnteriores.userId) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions(app, 'us-central1');
          const eliminarUsuarioAuthFn = httpsCallable(functions, 'eliminarUsuarioAuth');
          
          await eliminarUsuarioAuthFn({ userId });
          console.log('[useAdminParticipantes] Usuario eliminado de Firebase Auth:', userId);
        } catch (authError: any) {
          console.warn('[useAdminParticipantes] Error al eliminar usuario de Auth (continuando):', authError);
          // No bloquear la eliminación si falla eliminar de Auth
          // El documento ya fue eliminado de Firestore
        }
      }

      // Registrar acción en el log
      await registrarEliminacion('participantes', id, datosAnteriores);

      await cargarParticipantes();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminParticipantes] Error al eliminar:', err);
      return { success: false, error: err.message || 'Error al eliminar participante' };
    }
  };

  const deshabilitarParticipante = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const participanteRef = doc(db, 'participantes', id);
      
      // Obtener datos anteriores antes de actualizar
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Participante no encontrado' };
      }

      await updateDoc(participanteRef, { habilitado: false });

      // Registrar acción en el log
      await registrarActualizacion('participantes', id, { habilitado: false }, datosAnteriores);

      await cargarParticipantes();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminParticipantes] Error al deshabilitar:', err);
      return { success: false, error: err.message || 'Error al deshabilitar participante' };
    }
  };

  const habilitarParticipante = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const participanteRef = doc(db, 'participantes', id);
      
      // Obtener datos anteriores antes de actualizar
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Participante no encontrado' };
      }

      await updateDoc(participanteRef, { habilitado: true });

      // Registrar acción en el log
      await registrarActualizacion('participantes', id, { habilitado: true }, datosAnteriores);

      await cargarParticipantes();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminParticipantes] Error al habilitar:', err);
      return { success: false, error: err.message || 'Error al habilitar participante' };
    }
  };

  useEffect(() => {
    cargarParticipantes();
  }, []);

  return {
    participantes,
    loading,
    error,
    cargarParticipantes,
    actualizarParticipante,
    eliminarParticipante,
    deshabilitarParticipante,
    habilitarParticipante
  };
};











