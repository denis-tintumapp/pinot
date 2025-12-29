/**
 * Hook para crear un nuevo evento
 */

import { useState } from 'react';
import { 
  collection, 
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { getUsuarioActualAuth } from '../../js/auth/auth.js';
import { useAuthStore } from '../stores/authStore';
import { registrarCreacion, registrarActualizacion } from '../utils/logger';
import { puedeCrearEventos, verificarPermisosUsuario } from '../utils/permisos';

interface CrearEventoResult {
  success: boolean;
  eventoId?: string;
  pin?: string;
  error?: string;
}

export const useCrearEvento = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearEvento = async (nombre: string): Promise<CrearEventoResult> => {
    try {
      setLoading(true);
      setError(null);

      // Validar nombre
      if (!nombre || !nombre.trim()) {
        return {
          success: false,
          error: 'Por favor, ingresa un nombre para el evento.'
        };
      }

      // Obtener usuario actual
      const user = getUsuarioActualAuth();
      let anfitrionId: string | null = null;

      if (user) {
        // Usar Firebase Auth UID
        anfitrionId = user.uid;
        
        // Verificar que el usuario puede crear eventos (solo permanentes/miembros)
        const puedeCrear = await puedeCrearEventos(user.uid);
        if (!puedeCrear) {
          const permisos = await verificarPermisosUsuario(user.uid);
          return {
            success: false,
            error: `Solo usuarios ${permisos.tipoUsuario === 'efimero' ? 'permanentes o miembros' : 'con onboarding completo'} pueden crear eventos. Los usuarios efímeros solo pueden participar en eventos existentes.`
          };
        }
      } else {
        // Fallback: usar authStore (solo para compatibilidad)
        const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
        anfitrionId = anfitrionIdFromStore;
        
        if (!anfitrionId) {
          return {
            success: false,
            error: 'Debes estar autenticado para crear eventos. Por favor, inicia sesión o regístrate como usuario permanente.'
          };
        }
      }

      if (!anfitrionId) {
        return {
          success: false,
          error: 'No se encontró la sesión del anfitrión. Por favor, inicia sesión nuevamente.'
        };
      }

      // Inicializar Firebase
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

      // Generar PIN único de 5 dígitos
      const pin = Math.floor(10000 + Math.random() * 90000).toString();

      console.log('📝 Creando evento con datos:', {
        nombre: nombre.trim(),
        anfitrionId,
        pin,
        activo: true
      });

      // Crear evento en Firestore
      const eventosRef = collection(db, 'eventos');
      const nuevoEvento = {
        nombre: nombre.trim(),
        anfitrionId: anfitrionId,
        pin: pin,
        activo: true,
        creadoEn: serverTimestamp(),
        participantes: [],
        etiquetas: []
      };

      const eventoDocRef = await addDoc(eventosRef, nuevoEvento);
      const eventoId = eventoDocRef.id;

      // Registrar acción en el log
      await registrarCreacion('eventos', eventoId, nuevoEvento);

      // Actualizar contador de eventos creados del anfitrión
      try {
        const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
        const anfitrionSnap = await getDoc(anfitrionRef);

        if (anfitrionSnap.exists()) {
          const anfitrionData = anfitrionSnap.data();
          const eventosCreados = (anfitrionData.eventosCreados || 0) + 1;

          const updateData: any = {
            eventosCreados: eventosCreados,
            ultimoAcceso: serverTimestamp()
          };

          // Si es anfitrión efímero y es el primer evento, marcar contraseña como usada
          if (anfitrionData.tipo === 'efimero' && eventosCreados === 1 && anfitrionData.passwordTemporal && !anfitrionData.passwordUsada) {
            updateData.passwordUsada = true;
            updateData.passwordTemporal = null; // Limpiar contraseña temporal por seguridad
          }

          await updateDoc(anfitrionRef, updateData);

          // Registrar acción en el log (actualización automática del contador - NO registrar)
          // Esta es una acción automática del sistema, no del usuario
        }
      } catch (updateError) {
        console.warn('Error al actualizar contador de eventos:', updateError);
        // No es crítico, continuar
      }

      console.log('✅ Evento creado exitosamente:', {
        eventoId,
        pin,
        nombre: nombre.trim()
      });

      return {
        success: true,
        eventoId,
        pin
      };
    } catch (err: any) {
      console.error('❌ Error al crear evento:', err);
      const errorMessage = err.message || 'Error al crear el evento. Por favor, intenta nuevamente.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return { crearEvento, loading, error };
};











