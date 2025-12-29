/**
 * Hook para cargar y gestionar anfitriones en el panel de administración
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getFirestore,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { registrarActualizacion, registrarEliminacion } from '../utils/logger';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Anfitrion {
  id: string;
  alias?: string;
  nombreAnfitrion?: string;
  nombreCompleto?: string;
  email?: string;
  tipo?: 'efimero' | 'persistente' | 'permanente'; // Mantener compatibilidad con valores antiguos
  tipoUsuario?: 'efimero' | 'permanente' | 'miembro'; // Nuevo campo para tipo de usuario
  emailVerificado?: boolean;
  eventosCreados?: number;
  habilitado?: boolean;
  creadoEn?: any;
}

export const useAdminAnfitriones = () => {
  const [anfitriones, setAnfitriones] = useState<Anfitrion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarAnfitriones = async () => {
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
      const anfitrionesRef = collection(db, 'anfitriones');
      const querySnapshot = await getDocs(anfitrionesRef);

      const anfitrionesData: Anfitrion[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        anfitrionesData.push({
          id: docSnap.id,
          ...data
        } as Anfitrion);
      });

      // Ordenar por fecha de creación (más reciente primero)
      anfitrionesData.sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
        const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
        return fechaB - fechaA;
      });

      setAnfitriones(anfitrionesData);
    } catch (err: any) {
      console.error('[useAdminAnfitriones] Error:', err);
      setError(err.message || 'Error al cargar anfitriones');
    } finally {
      setLoading(false);
    }
  };

  const actualizarAnfitrion = async (id: string, datos: Partial<Anfitrion>): Promise<{ success: boolean; error?: string }> => {
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
      const anfitrionRef = doc(db, 'anfitriones', id);
      
      // Obtener datos anteriores antes de actualizar
      const anfitrionSnap = await getDoc(anfitrionRef);
      const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Anfitrión no encontrado' };
      }

      // Obtener userId para actualizar Firebase Auth si es necesario
      const userId = datosAnteriores.userId || id;
      
      // Actualizar documento en Firestore
      await updateDoc(anfitrionRef, datos);

      // Si hay cambios en email o nombre, actualizar Firebase Auth
      if (userId && (datos.email || datos.nombreAnfitrion || datos.alias)) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions(app, 'us-central1');
          const actualizarUsuarioAuthFn = httpsCallable(functions, 'actualizarUsuarioAuth');
          
          const updateAuthData: any = {};
          if (datos.email && datos.email !== datosAnteriores.email) {
            updateAuthData.email = datos.email;
          }
          if ((datos.nombreAnfitrion || datos.alias) && (datos.nombreAnfitrion || datos.alias) !== (datosAnteriores.nombreAnfitrion || datosAnteriores.alias)) {
            updateAuthData.displayName = datos.nombreAnfitrion || datos.alias || datosAnteriores.nombreAnfitrion || datosAnteriores.alias;
          }
          
          if (Object.keys(updateAuthData).length > 0) {
            await actualizarUsuarioAuthFn({ userId, ...updateAuthData });
            console.log('[useAdminAnfitriones] Usuario actualizado en Firebase Auth:', userId, updateAuthData);
          }
        } catch (authError: any) {
          console.warn('[useAdminAnfitriones] Error al actualizar usuario de Auth (continuando):', authError);
          // No bloquear la actualización si falla actualizar Auth
          // El documento ya fue actualizado en Firestore
        }
      }

      // Registrar acción en el log
      await registrarActualizacion('anfitriones', id, datos, datosAnteriores);

      // No necesitamos recargar manualmente, el listener en tiempo real lo hará automáticamente
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminAnfitriones] Error al actualizar:', err);
      return { success: false, error: err.message || 'Error al actualizar anfitrión' };
    }
  };

  const eliminarAnfitrion = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const anfitrionRef = doc(db, 'anfitriones', id);
      
      // Obtener datos antes de eliminar
      const anfitrionSnap = await getDoc(anfitrionRef);
      const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Anfitrión no encontrado' };
      }

      // Obtener userId para eliminar de Firebase Auth
      const userId = datosAnteriores.userId || id; // Usar userId si existe, sino el id del documento

      // Eliminar documento de Firestore
      await deleteDoc(anfitrionRef);

      // Eliminar usuario de Firebase Auth si tiene userId
      if (userId) {
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions(app, 'us-central1');
          const eliminarUsuarioAuthFn = httpsCallable(functions, 'eliminarUsuarioAuth');
          
          await eliminarUsuarioAuthFn({ userId });
          console.log('[useAdminAnfitriones] Usuario eliminado de Firebase Auth:', userId);
        } catch (authError: any) {
          console.warn('[useAdminAnfitriones] Error al eliminar usuario de Auth (continuando):', authError);
          // No bloquear la eliminación si falla eliminar de Auth
          // El documento ya fue eliminado de Firestore
        }
      }

      // Registrar acción en el log
      await registrarEliminacion('anfitriones', id, datosAnteriores);

      // No necesitamos recargar manualmente, el listener en tiempo real lo hará automáticamente
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminAnfitriones] Error al eliminar:', err);
      return { success: false, error: err.message || 'Error al eliminar anfitrión' };
    }
  };

  const deshabilitarAnfitrion = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const anfitrionRef = doc(db, 'anfitriones', id);
      
      // Obtener datos anteriores antes de actualizar
      const anfitrionSnap = await getDoc(anfitrionRef);
      const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Anfitrión no encontrado' };
      }

      await updateDoc(anfitrionRef, { habilitado: false });

      // Registrar acción en el log
      await registrarActualizacion('anfitriones', id, { habilitado: false }, datosAnteriores);

      // No necesitamos recargar manualmente, el listener en tiempo real lo hará automáticamente
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminAnfitriones] Error al deshabilitar:', err);
      return { success: false, error: err.message || 'Error al deshabilitar anfitrión' };
    }
  };

  const habilitarAnfitrion = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const anfitrionRef = doc(db, 'anfitriones', id);
      
      // Obtener datos anteriores antes de actualizar
      const anfitrionSnap = await getDoc(anfitrionRef);
      const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
      
      if (!datosAnteriores) {
        return { success: false, error: 'Anfitrión no encontrado' };
      }

      await updateDoc(anfitrionRef, { habilitado: true });

      // Registrar acción en el log
      await registrarActualizacion('anfitriones', id, { habilitado: true }, datosAnteriores);

      // No necesitamos recargar manualmente, el listener en tiempo real lo hará automáticamente
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminAnfitriones] Error al habilitar:', err);
      return { success: false, error: err.message || 'Error al habilitar anfitrión' };
    }
  };

  useEffect(() => {
    // Configurar listener en tiempo real para detectar cambios
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
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
        const anfitrionesRef = collection(db, 'anfitriones');
        
        // Escuchar cambios en tiempo real
        unsubscribe = onSnapshot(anfitrionesRef, (querySnapshot) => {
          const anfitrionesData: Anfitrion[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            anfitrionesData.push({
              id: docSnap.id,
              ...data
            } as Anfitrion);
          });

          // Ordenar por fecha de creación (más reciente primero)
          anfitrionesData.sort((a, b) => {
            const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
            const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
            return fechaB - fechaA;
          });

          setAnfitriones(anfitrionesData);
          setLoading(false);
        }, (err) => {
          console.error('[useAdminAnfitriones] Error en listener:', err);
          setError(err.message || 'Error al escuchar cambios');
          setLoading(false);
        });
      } catch (err: any) {
        console.error('[useAdminAnfitriones] Error al configurar listener:', err);
        setLoading(false);
      }
    };

    setupListener();

    // Limpiar listener cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    anfitriones,
    loading,
    error,
    cargarAnfitriones,
    actualizarAnfitrion,
    eliminarAnfitrion,
    deshabilitarAnfitrion,
    habilitarAnfitrion
  };
};











