/**
 * Utilidad para sincronizar usuarios de Firebase Auth con documentos de Firestore
 * Útil cuando un usuario existe en Auth pero no tiene documento en Firestore
 */

import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

let app;
let db;

function getDb() {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

/**
 * Sincronizar un usuario de Firebase Auth con Firestore
 * Crea el documento de anfitrión si no existe
 */
export async function sincronizarAnfitrionDesdeAuth(
  userId: string,
  email: string,
  displayName: string
): Promise<{ success: boolean; creado: boolean; error?: string }> {
  try {
    const dbInstance = getDb();
    const anfitrionRef = doc(dbInstance, 'anfitriones', userId);
    
    // Verificar si ya existe
    const anfitrionSnap = await getDoc(anfitrionRef);
    
    if (anfitrionSnap.exists()) {
      return { success: true, creado: false };
    }

    // Buscar por email también
    const anfitrionesRef = collection(dbInstance, 'anfitriones');
    const q = query(anfitrionesRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Existe con otro ID, retornar
      return { success: true, creado: false };
    }

    // Crear el documento
    await setDoc(anfitrionRef, {
      userId: userId,
      email: email.toLowerCase().trim(),
      nombreAnfitrion: displayName,
      alias: displayName,
      tipo: 'efimero',
      emailVerificado: false,
      eventosCreados: 0,
      passwordUsada: false,
      creadoEn: serverTimestamp(),
      ultimoAcceso: serverTimestamp()
    });

    console.log('[Sync] ✅ Documento de anfitrión creado para:', email);
    return { success: true, creado: true };
  } catch (error: any) {
    console.error('[Sync] Error al sincronizar anfitrión:', error);
    return { 
      success: false, 
      creado: false, 
      error: error.message || 'Error al sincronizar anfitrión' 
    };
  }
}

/**
 * Buscar anfitrión por email en Firestore
 */
export async function buscarAnfitrionPorEmail(email: string): Promise<{
  existe: boolean;
  anfitrionId?: string;
  datos?: any;
}> {
  try {
    const dbInstance = getDb();
    const anfitrionesRef = collection(dbInstance, 'anfitriones');
    const q = query(anfitrionesRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { existe: false };
    }

    const docSnap = querySnapshot.docs[0];
    return {
      existe: true,
      anfitrionId: docSnap.id,
      datos: docSnap.data()
    };
  } catch (error: any) {
    console.error('[Sync] Error al buscar anfitrión:', error);
    return { existe: false };
  }
}



