/**
 * Hook para gestionar membresías de participantes
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';
import { getAuth } from 'firebase/auth';

export type TipoPlanMembresia = 'mensual' | 'anual';
export type EstadoMembresia = 'activa' | 'vencida' | 'cancelada' | 'pendiente';

export interface Membresia {
  id: string;
  userId: string;
  plan: TipoPlanMembresia;
  estado: EstadoMembresia;
  fechaInicio: any;
  fechaFin: any;
  fechaRenovacion?: any;
  precio: number;
  metodoPago?: string;
  transaccionId?: string;
  creadoEn?: any;
  actualizadoEn?: any;
}

export const useMembresias = (userId?: string) => {
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [membresiaActiva, setMembresiaActiva] = useState<Membresia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMembresias = async (targetUserId?: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const uid = targetUserId || userId || currentUser?.uid;

    if (!uid) {
      setError('No hay usuario especificado');
      setLoading(false);
      return;
    }

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
      const membresiasRef = collection(db, 'membresias');
      const q = query(membresiasRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      const membresiasData: Membresia[] = [];
      let activa: Membresia | null = null;
      const ahora = new Date();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const fechaFin = data.fechaFin?.toDate?.() || new Date(data.fechaFin);
        const membresia: Membresia = {
          id: docSnap.id,
          ...data
        } as Membresia;

        membresiasData.push(membresia);

        // Verificar si es activa y no ha expirado
        if (data.estado === 'activa' && fechaFin > ahora) {
          if (!activa || fechaFin > (activa.fechaFin?.toDate?.() || new Date(activa.fechaFin))) {
            activa = membresia;
          }
        }
      });

      // Ordenar por fecha de creación (más reciente primero)
      membresiasData.sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
        const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
        return fechaB - fechaA;
      });

      setMembresias(membresiasData);
      setMembresiaActiva(activa);
    } catch (err: any) {
      console.error('[useMembresias] Error:', err);
      setError(err.message || 'Error al cargar membresías');
    } finally {
      setLoading(false);
    }
  };

  const crearMembresia = async (
    userId: string,
    plan: TipoPlanMembresia,
    precio: number,
    metodoPago?: string,
    transaccionId?: string
  ): Promise<{ success: boolean; membresiaId?: string; error?: string }> => {
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
      const membresiasRef = collection(db, 'membresias');

      // Calcular fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      if (plan === 'mensual') {
        fechaFin.setMonth(fechaFin.getMonth() + 1);
      } else {
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      }

      const nuevaMembresia = {
        userId,
        plan,
        estado: 'activa' as EstadoMembresia,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        precio,
        metodoPago,
        transaccionId,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      };

      const docRef = await addDoc(membresiasRef, nuevaMembresia);

      await cargarMembresias(userId);
      return { success: true, membresiaId: docRef.id };
    } catch (err: any) {
      console.error('[useMembresias] Error al crear:', err);
      return { success: false, error: err.message || 'Error al crear membresía' };
    }
  };

  useEffect(() => {
    if (userId) {
      cargarMembresias();
    }
  }, [userId]);

  return {
    membresias,
    membresiaActiva,
    loading,
    error,
    cargarMembresias,
    crearMembresia
  };
};



