/**
 * Hooks de TanStack Query para mutations de eventos
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { getUsuarioActualAuth } from '../../../js/auth/auth.js';
import { useAuthStore } from '../../stores/authStore';
import { registrarCreacion, registrarActualizacion, registrarEliminacion } from '../../utils/logger';
import { puedeCrearEventos, verificarPermisosUsuario } from '../../utils/permisos';
import { CreateEventoSchema, UpdateEventoSchema } from '../../schemas/evento.schema';
import { validateBeforeFirestore } from '../../lib/validation';

interface CreateEventoParams {
  nombre: string;
}

interface UpdateEventoParams {
  eventoId: string;
  datos: Partial<{
    nombre: string;
    activo: boolean;
    habilitado: boolean;
  }>;
}

/**
 * Hook para crear un evento
 * Con optimistic updates para mejor UX
 */
export function useCreateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nombre }: CreateEventoParams) => {
      // Validar nombre
      if (!nombre || !nombre.trim()) {
        throw new Error('Por favor, ingresa un nombre para el evento.');
      }

      // Obtener usuario actual
      const user = getUsuarioActualAuth();
      const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
      let anfitrionId: string | null = null;

      if (user) {
        anfitrionId = user.uid;
        
        // Verificar que el usuario puede crear eventos
        const puedeCrear = await puedeCrearEventos(user.uid);
        if (!puedeCrear) {
          const permisos = await verificarPermisosUsuario(user.uid);
          throw new Error(`Solo usuarios ${permisos.tipoUsuario === 'efimero' ? 'permanentes o miembros' : 'con onboarding completo'} pueden crear eventos. Los usuarios efímeros solo pueden participar en eventos existentes.`);
        }
      } else {
        anfitrionId = anfitrionIdFromStore;
        
        if (!anfitrionId) {
          throw new Error('Debes estar autenticado para crear eventos. Por favor, inicia sesión o regístrate como usuario permanente.');
        }
      }

      if (!anfitrionId) {
        throw new Error('No se encontró la sesión del anfitrión. Por favor, inicia sesión nuevamente.');
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

      // Validar datos antes de guardar
      const nuevoEvento = validateBeforeFirestore(
        CreateEventoSchema,
        {
          nombre: nombre.trim(),
          anfitrionId: anfitrionId,
          pin: pin,
          activo: true,
        },
        'crear evento'
      );

      const eventoData = {
        ...nuevoEvento,
        creadoEn: serverTimestamp(),
        participantes: [],
        etiquetas: []
      };

      // Crear evento en Firestore
      const eventosRef = collection(db, 'eventos');
      const eventoDocRef = await addDoc(eventosRef, eventoData);
      const eventoId = eventoDocRef.id;

      // Registrar acción en el log
      await registrarCreacion('eventos', eventoId, eventoData);

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
            updateData.passwordTemporal = null;
          }

          await updateDoc(anfitrionRef, updateData);
        }
      } catch (updateError) {
        console.warn('Error al actualizar contador de eventos:', updateError);
        // No es crítico, continuar
      }

      return { eventoId, pin, anfitrionId, nombre: nombre.trim() };
    },
    // Optimistic update
    onMutate: async ({ nombre }) => {
      // Obtener anfitrionId para el optimistic update
      const user = getUsuarioActualAuth();
      const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
      const anfitrionId = user?.uid || anfitrionIdFromStore;

      if (!anfitrionId) {
        return { previousEventos: null };
      }

      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['eventos', anfitrionId] });
      await queryClient.cancelQueries({ queryKey: ['eventoActivo'] });

      // Snapshot del valor anterior
      const previousEventos = queryClient.getQueryData(['eventos', anfitrionId]);

      // Generar PIN temporal para el optimistic update
      const tempPin = Math.floor(10000 + Math.random() * 90000).toString();
      const tempId = `temp-${Date.now()}`;

      // Optimistic update: agregar el evento temporalmente
      queryClient.setQueryData(['eventos', anfitrionId], (old: any[] = []) => {
        return [
          {
            id: tempId,
            nombre: nombre.trim(),
            anfitrionId,
            pin: tempPin,
            activo: true,
            _optimistic: true,
            _tempId: tempId,
          },
          ...old,
        ];
      });

      // También actualizar eventoActivo si no hay uno activo
      const eventoActivo = queryClient.getQueryData(['eventoActivo']);
      if (!eventoActivo) {
        queryClient.setQueryData(['eventoActivo'], {
          id: tempId,
          nombre: nombre.trim(),
          anfitrionId,
          pin: tempPin,
          activo: true,
          _optimistic: true,
        });
      }

      return { previousEventos, anfitrionId, tempId };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousEventos && context?.anfitrionId) {
        queryClient.setQueryData(['eventos', context.anfitrionId], context.previousEventos);
      }
      // Limpiar eventoActivo si era optimistic
      const eventoActivo = queryClient.getQueryData(['eventoActivo']);
      if (eventoActivo && (eventoActivo as any)._optimistic) {
        queryClient.setQueryData(['eventoActivo'], null);
      }
    },
    // Reemplazar el evento temporal con el real
    onSuccess: (data, variables, context) => {
      if (context?.anfitrionId && context?.tempId) {
        // Reemplazar el evento temporal con el real
        queryClient.setQueryData(['eventos', context.anfitrionId], (old: any[] = []) => {
          return old.map((e) =>
            e._tempId === context.tempId
              ? { ...data, id: data.eventoId, _optimistic: false }
              : e
          );
        });

        // Actualizar eventoActivo con el ID real
        const eventoActivo = queryClient.getQueryData(['eventoActivo']);
        if (eventoActivo && (eventoActivo as any)._optimistic) {
          queryClient.setQueryData(['eventoActivo'], {
            ...data,
            id: data.eventoId,
            nombre: variables.nombre.trim(),
            _optimistic: false,
          });
        }
      }

      // Invalidar queries para sincronizar
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['evento', data.eventoId] });
      }
      queryClient.invalidateQueries({ queryKey: ['eventoActivo'] });
    },
  });
}

/**
 * Hook para actualizar un evento
 * Con optimistic updates para mejor UX
 */
export function useUpdateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, datos }: UpdateEventoParams) => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
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
      const eventoRef = doc(db, 'eventos', eventoId);

      // Obtener datos anteriores para el log
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;

      if (!eventoSnap.exists()) {
        throw new Error('El evento no existe');
      }

      // Validar datos antes de actualizar
      const datosValidados = validateBeforeFirestore(
        UpdateEventoSchema,
        {
          id: eventoId,
          ...datos,
        },
        `actualizar evento ${eventoId}`
      );

      // Preparar datos de actualización (sin id)
      const { id, ...updateData } = datosValidados;
      updateData.actualizadoEn = serverTimestamp();

      await updateDoc(eventoRef, updateData);

      // Registrar acción en el log
      await registrarActualizacion('eventos', eventoId, updateData, datosAnteriores || undefined);

      return { eventoId, anfitrionId: eventoSnap.data()?.anfitrionId, datos };
    },
    // Optimistic update
    onMutate: async ({ eventoId, datos }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['evento', eventoId] });
      await queryClient.cancelQueries({ queryKey: ['eventos'] });
      await queryClient.cancelQueries({ queryKey: ['eventoActivo'] });

      // Snapshot del valor anterior
      const previousEvento = queryClient.getQueryData(['evento', eventoId]);
      const previousEventos = queryClient.getQueryData(['eventos']);
      const previousEventoActivo = queryClient.getQueryData(['eventoActivo']);

      // Optimistic update: actualizar el evento en el cache
      queryClient.setQueryData(['evento', eventoId], (old: any) => {
        if (!old) return old;
        return { ...old, ...datos, _optimistic: true };
      });

      // Actualizar en la lista de eventos
      queryClient.setQueryData(['eventos'], (old: any[] = []) => {
        return old.map((e) =>
          e.id === eventoId ? { ...e, ...datos, _optimistic: true } : e
        );
      });

      // Actualizar eventoActivo si es el mismo
      queryClient.setQueryData(['eventoActivo'], (old: any) => {
        if (old && old.id === eventoId) {
          return { ...old, ...datos, _optimistic: true };
        }
        return old;
      });

      return { previousEvento, previousEventos, previousEventoActivo };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousEvento) {
        queryClient.setQueryData(['evento', variables.eventoId], context.previousEvento);
      }
      if (context?.previousEventos) {
        queryClient.setQueryData(['eventos'], context.previousEventos);
      }
      if (context?.previousEventoActivo) {
        queryClient.setQueryData(['eventoActivo'], context.previousEventoActivo);
      }
    },
    // Siempre invalidar para sincronizar con el servidor
    onSettled: (data) => {
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['evento', data.eventoId] });
        queryClient.invalidateQueries({ queryKey: ['eventos'] });
        queryClient.invalidateQueries({ queryKey: ['eventoActivo'] });
      }
    },
  });
}

/**
 * Hook para eliminar un evento
 * Con optimistic updates para mejor UX
 */
export function useDeleteEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventoId: string) => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
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
      const eventoRef = doc(db, 'eventos', eventoId);

      // Obtener datos antes de eliminar para el log
      const eventoSnap = await getDoc(eventoRef);
      const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;

      if (!eventoSnap.exists()) {
        throw new Error('El evento no existe');
      }

      const anfitrionId = eventoSnap.data()?.anfitrionId;

      await deleteDoc(eventoRef);

      // Registrar acción en el log
      if (datosAnteriores) {
        await registrarEliminacion('eventos', eventoId, datosAnteriores);
      }

      return { eventoId, anfitrionId };
    },
    // Optimistic update
    onMutate: async (eventoId) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['evento', eventoId] });
      await queryClient.cancelQueries({ queryKey: ['eventos'] });
      await queryClient.cancelQueries({ queryKey: ['eventoActivo'] });

      // Snapshot del valor anterior
      const previousEvento = queryClient.getQueryData(['evento', eventoId]);
      const previousEventos = queryClient.getQueryData(['eventos']);
      const previousEventoActivo = queryClient.getQueryData(['eventoActivo']);

      // Optimistic update: eliminar el evento del cache
      queryClient.setQueryData(['eventos'], (old: any[] = []) => {
        return old.filter((e) => e.id !== eventoId);
      });

      // Si es el evento activo, limpiarlo
      const eventoActivo = queryClient.getQueryData(['eventoActivo']);
      if (eventoActivo && (eventoActivo as any).id === eventoId) {
        queryClient.setQueryData(['eventoActivo'], null);
      }

      // Eliminar el evento individual
      queryClient.setQueryData(['evento', eventoId], undefined);

      return { previousEvento, previousEventos, previousEventoActivo };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousEvento) {
        queryClient.setQueryData(['evento', variables], context.previousEvento);
      }
      if (context?.previousEventos) {
        queryClient.setQueryData(['eventos'], context.previousEventos);
      }
      if (context?.previousEventoActivo) {
        queryClient.setQueryData(['eventoActivo'], context.previousEventoActivo);
      }
    },
    // Siempre invalidar para sincronizar con el servidor
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['evento', data.eventoId] });
      }
      queryClient.invalidateQueries({ queryKey: ['eventoActivo'] });
    },
  });
}

