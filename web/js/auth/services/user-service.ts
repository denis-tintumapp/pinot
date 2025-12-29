/**
 * Servicio de gestión de usuarios en Firestore
 * Maneja operaciones CRUD de perfiles de usuario
 */

import { 
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../core/firebase-init';
import type { UserProfile, ChangelogAction } from '../types/auth-types.ts';

/**
 * Crear perfil de usuario en Firestore
 */
export async function createUserProfile(
  userId: string,
  profile: Omit<UserProfile, 'userId' | 'creadoEn'>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !profile.email) {
      return {
        success: false,
        error: 'userId y email son requeridos'
      };
    }

    const userRef = doc(db, 'anfitriones', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        success: false,
        error: 'El perfil de usuario ya existe'
      };
    }

    const newProfile: UserProfile = {
      userId,
      ...profile,
      creadoEn: serverTimestamp()
    };

    await setDoc(userRef, newProfile);

    return { success: true };
  } catch (error: any) {
    console.error('[UserService] Error al crear perfil:', error);
    return {
      success: false,
      error: error.message || 'Error al crear perfil de usuario'
    };
  }
}

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'userId' | 'creadoEn'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'userId es requerido'
      };
    }

    const userRef = doc(db, 'anfitriones', userId);
    const updateData: any = {
      ...updates,
      ultimoAcceso: serverTimestamp()
    };

    await updateDoc(userRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error('[UserService] Error al actualizar perfil:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar perfil de usuario'
    };
  }
}

/**
 * Obtener perfil de usuario
 */
export async function getUserProfile(userId: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'userId es requerido'
      };
    }

    const userRef = doc(db, 'anfitriones', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: 'Perfil de usuario no encontrado'
      };
    }

    const data = userSnap.data();
    const profile: UserProfile = {
      userId: userSnap.id,
      ...data
    } as UserProfile;

    return {
      success: true,
      profile
    };
  } catch (error: any) {
    console.error('[UserService] Error al obtener perfil:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener perfil de usuario'
    };
  }
}

/**
 * Guardar datos de registro pendiente (antes de verificar email)
 */
export async function savePendingRegistration(params: {
  email: string;
  telefono?: string; // Opcional
  instagram?: string;
  aceptaTerminos: boolean;
  fechaAceptacionTerminos?: Date;
  verificationToken: string; // Token único para verificación
}): Promise<{ success: boolean; error?: string; pendingId?: string }> {
  try {
    const pendingRef = collection(db, 'registros_pendientes');
    const pendingDoc: any = {
      email: params.email.trim().toLowerCase(),
      aceptaTerminos: params.aceptaTerminos,
      fechaAceptacionTerminos: params.fechaAceptacionTerminos || new Date(),
      versionTerminos: '1.0',
      verificationToken: params.verificationToken,
      creadoEn: serverTimestamp(),
      verificado: false
    };
    
    // Solo incluir telefono si tiene valor (Firestore no acepta undefined)
    if (params.telefono && params.telefono.trim().length > 0) {
      pendingDoc.telefono = params.telefono.trim();
    }
    
    // Solo incluir instagram si tiene valor
    if (params.instagram && params.instagram.trim().length > 0) {
      pendingDoc.instagram = params.instagram.trim();
    }

    const docRef = await addDoc(pendingRef, pendingDoc);

    return { success: true, pendingId: docRef.id };
  } catch (error: any) {
    console.error('[UserService] Error al guardar registro pendiente:', error);
    return {
      success: false,
      error: error.message || 'Error al guardar registro pendiente'
    };
  }
}

/**
 * Obtener datos de registro pendiente por token de verificación
 */
export async function getPendingRegistrationByToken(token: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const pendingRef = collection(db, 'registros_pendientes');
    const q = query(pendingRef, where('verificationToken', '==', token), where('verificado', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Token de verificación inválido o ya usado'
      };
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      success: true,
      data: {
        id: doc.id,
        ...data
      }
    };
  } catch (error: any) {
    console.error('[UserService] Error al obtener registro pendiente:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener registro pendiente'
    };
  }
}

/**
 * Marcar registro pendiente como verificado
 */
export async function markPendingRegistrationAsVerified(pendingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const pendingRef = doc(db, 'registros_pendientes', pendingId);
    await updateDoc(pendingRef, {
      verificado: true,
      verificadoEn: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    console.error('[UserService] Error al marcar registro como verificado:', error);
    return {
      success: false,
      error: error.message || 'Error al marcar registro como verificado'
    };
  }
}

/**
 * Registrar acción en changelog
 */
export async function logUserAction(action: ChangelogAction): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      ...action,
      timestamp: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    console.error('[UserService] Error al registrar acción en changelog:', error);
    // No bloquear el flujo si falla el logging
    return {
      success: false,
      error: error.message || 'Error al registrar acción'
    };
  }
}






