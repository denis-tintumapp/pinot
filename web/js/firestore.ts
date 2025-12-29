// Módulo de Firestore - Reemplaza api.js
// Importar Firebase SDK v9+ (modular) - Módulos ES6
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './core/firebase-init';

// Interfaces y tipos
interface AnfitrionInfo {
  tipo: 'registrado' | 'efimero';
  sesionId: string;
  nombreAnfitrion: string | null;
  email: string | null;
  userId: string | null;
  emailVerificado?: boolean;
}

interface ResultadoOperacion<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  pin: string;
  eventoFinalizado?: boolean;
  timestampExpira?: number;
  timerActivo?: boolean;
  timerPausado?: boolean;
  anfitrionId?: string;
  [key: string]: unknown;
}

interface Participante {
  id: string;
  nombre: string;
  eventoId: string;
  [key: string]: unknown;
}

interface Etiqueta {
  id: string;
  eventoId: string;
  etiquetaId: string;
  etiquetaNombre: string;
  naipeId?: string;
  naipeNombre?: string;
  orden: number;
  [key: string]: unknown;
}

interface PlantillaParticipante {
  id: string;
  nombre: string;
  [key: string]: unknown;
}

interface PlantillaEtiqueta {
  id: string;
  nombre: string;
  [key: string]: unknown;
}

// Normalizar fecha a ISO 8601 (YYYY-MM-DD) - ESTÁNDAR WEB
export function normalizarFechaISO(fecha: string | Date | Timestamp | undefined | null): string {
  if (!fecha) return "";
  
  // Si es Timestamp de Firestore
  if (fecha instanceof Timestamp) {
    const date = fecha.toDate();
    return date.toISOString().split("T")[0];
  }
  
  // Si es Date object
  if (fecha instanceof Date) {
    return fecha.toISOString().split("T")[0];
  }
  
  // Si ya está en formato ISO YYYY-MM-DD, devolverlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }
  
  // Si es formato ISO completo con tiempo (YYYY-MM-DDTHH:mm:ss.sssZ)
  if (fecha.includes("T")) {
    return fecha.split("T")[0];
  }
  
  // Si es formato DD-MM-YYYY (formato antiguo)
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
    const [dd, mm, yyyy] = fecha.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // Intentar parsear como Date
  try {
    const date = new Date(fecha);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch (err: unknown) {
    console.error("Error al parsear fecha:", err);
  }
  
  console.warn("Formato de fecha no reconocido:", fecha);
  return fecha;
}

// Formatear fecha ISO para mostrar en UI (DD-MM-YYYY)
export function formatearFechaParaUI(fechaISO: string | Timestamp | undefined | null): string {
  if (!fechaISO) return "";
  
  // Si es Timestamp de Firestore
  if (fechaISO instanceof Timestamp) {
    const date = fechaISO.toDate();
    fechaISO = date.toISOString().split("T")[0];
  }
  
  // Si ya está en formato DD-MM-YYYY, devolverlo tal cual
  if (/^\d{2}-\d{2}-\d{4}$/.test(fechaISO)) {
    return fechaISO;
  }
  
  // Si es formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ)
  let fechaParte = fechaISO;
  if (fechaISO.includes("T")) {
    fechaParte = fechaISO.split("T")[0];
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaParte)) {
    const [yyyy, mm, dd] = fechaParte.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  
  return fechaISO;
}

// ============================================
// EVENTOS
// ============================================

/**
 * Crear un nuevo evento
 */
// Generar PIN numérico único de 5 dígitos
async function generarPINUnico() {
  let pin;
  let intentos = 0;
  const maxIntentos = 100;
  
  do {
    // Generar PIN de 5 dígitos (10000 a 99999)
    pin = String(Math.floor(10000 + Math.random() * 90000));
    
    // Verificar que no exista
    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('pin', '==', pin));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return pin;
    }
    
    intentos++;
  } while (intentos < maxIntentos);
  
  // Si después de muchos intentos no encontramos uno único, usar timestamp
  return String(Date.now()).slice(-5);
}

// Función para generar sesión ID de anfitrión efímero
function generarSesionIdAnfitrion(): string {
  return `ANF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtener información del anfitrión
 * Prioriza Firebase Auth, con fallback a sistema antiguo (compatibilidad)
 */
export async function obtenerOcrearAnfitrion(nombre: string | null = null, email: string | null = null): Promise<AnfitrionInfo> {
  try {
    // Intentar usar Firebase Auth primero
    try {
      const { getUsuarioActualAuth, obtenerAnfitrionDesdeFirestore } = await import('./auth/auth.js');
      const user = getUsuarioActualAuth();
      
      if (user) {
        // Usuario autenticado con Firebase Auth
        const anfitrionData = await obtenerAnfitrionDesdeFirestore(user.uid);
        
        return {
          tipo: 'registrado',
          userId: user.uid,
          sesionId: user.uid, // Usar UID como sesionId para compatibilidad
          nombreAnfitrion: user.displayName || anfitrionData?.nombreAnfitrion || nombre,
          email: user.email || email,
          emailVerificado: user.emailVerified
        };
      }
    } catch (error: unknown) {
      console.warn('[Firestore] Firebase Auth no disponible, usando sistema antiguo:', error);
      // Continuar con sistema antiguo
    }
    
    // Fallback: Sistema antiguo (anfitriones efímeros)
    // Verificar si hay sesión guardada
    const sesionId = localStorage.getItem('anfitrion_sesion_id');
    const anfitrionId = localStorage.getItem('anfitrion_id');
    
    if (sesionId && anfitrionId) {
      try {
        // Verificar que el anfitrión existe en Firestore
        const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
        const anfitrionSnap = await getDoc(anfitrionRef);
        
        if (anfitrionSnap.exists()) {
          const data = anfitrionSnap.data();
          return {
            tipo: data.tipo || 'efimero',
            sesionId: data.sesionId,
            nombreAnfitrion: data.nombreAnfitrion,
            email: data.email,
            userId: data.userId || null
          };
        }
      } catch (error: unknown) {
        console.warn('Error al verificar anfitrión en Firestore:', error);
        // Continuar con creación de nuevo anfitrión
      }
    }
    
    // Si no hay sesión válida, crear nueva (si se proporcionan datos)
    if (nombre && email) {
      const sesionId = generarSesionIdAnfitrion();
      return {
        tipo: 'efimero',
        sesionId: sesionId,
        nombreAnfitrion: nombre,
        email: email,
        userId: null
      };
    }
    
    // Si no hay datos, crear anfitrión efímero básico
    return {
      tipo: 'efimero',
      sesionId: generarSesionIdAnfitrion(),
      nombreAnfitrion: null,
      email: null,
      userId: null
    };
  } catch (error: unknown) {
    console.error('Error al obtener/crear anfitrión:', error);
    // En caso de error, devolver anfitrión efímero básico
    return {
      tipo: 'efimero',
      sesionId: generarSesionIdAnfitrion(),
      nombreAnfitrion: null,
      email: null,
      userId: null
    };
  }
}

export async function crearEvento(nombre: string, fechaISO: string, participantesSeleccionados: string[] = [], etiquetasSeleccionadas: Array<{ nombre: string }> = [], anfitrionInfo: AnfitrionInfo | null = null): Promise<ResultadoOperacion<{ id: string; pin: string; anfitrion?: AnfitrionInfo }>> {
  try {
    const eventosRef = collection(db, 'eventos');
    
    // Generar PIN único de 5 dígitos
    const pin = await generarPINUnico();
    
    // Determinar información del anfitrión
    // Si no se proporciona, intentar obtener del usuario autenticado o crear efímero
    let anfitrion = anfitrionInfo;
    
    if (!anfitrion) {
      // Intentar obtener del usuario autenticado
      try {
        const { getUsuarioActualAuth, obtenerAnfitrionDesdeFirestore } = await import('./auth/auth');
        const user = getUsuarioActualAuth();
        
        if (user) {
          const anfitrionData = await obtenerAnfitrionDesdeFirestore(user.uid);
          anfitrion = {
            tipo: 'registrado',
            userId: user.uid,
            sesionId: user.uid,
            nombreAnfitrion: user.displayName || anfitrionData?.nombreAnfitrion,
            email: user.email
          };
        }
      } catch (error: unknown) {
        console.warn('[Firestore] No se pudo obtener anfitrión autenticado:', error);
      }
      
      // Fallback: anfitrión efímero
      if (!anfitrion) {
        anfitrion = {
          tipo: 'efimero',
          sesionId: generarSesionIdAnfitrion(),
          nombreAnfitrion: null,
          userId: null,
          email: null
        };
      }
    }
    
    const nuevoEvento = {
      nombre: nombre || 'Cata sin nombre',
      fecha: fechaISO,
      pin: pin, // PIN numérico de 5 dígitos
      activo: true, // El nuevo evento siempre es activo
      creadoEn: serverTimestamp(),
      anfitrion: anfitrion // Información del anfitrión
    };
    
    // Usar batch para desactivar todos y crear el nuevo en una sola transacción
    const batch = writeBatch(db);
    
    // Desactivar todos los eventos existentes
    const q = query(eventosRef, where('activo', '==', true));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      batch.update(doc(db, 'eventos', docSnap.id), { activo: false });
    });
    
    // Crear el nuevo evento activo
    const nuevoEventoRef = doc(eventosRef);
    batch.set(nuevoEventoRef, nuevoEvento);
    
    await batch.commit();
    
    const eventoId = nuevoEventoRef.id;
    
    // Crear participantes seleccionados
    if (participantesSeleccionados && participantesSeleccionados.length > 0) {
      const participantesBatch = writeBatch(db);
      const participantesRef = collection(db, 'participantes');
      
      for (const nombreParticipante of participantesSeleccionados) {
        if (nombreParticipante && nombreParticipante.trim()) {
          const nuevoParticipanteRef = doc(participantesRef);
          participantesBatch.set(nuevoParticipanteRef, {
            eventoId: eventoId,
            nombre: nombreParticipante.trim(),
            creadoEn: serverTimestamp()
          });
        }
      }
      
      await participantesBatch.commit();
    }
    
    // Crear etiquetas seleccionadas
    if (etiquetasSeleccionadas && etiquetasSeleccionadas.length > 0) {
      const etiquetasBatch = writeBatch(db);
      const etiquetasRef = collection(db, 'etiquetas');
      
      for (let i = 0; i < etiquetasSeleccionadas.length; i++) {
        const etiquetaData = etiquetasSeleccionadas[i];
        if (etiquetaData && etiquetaData.nombre && etiquetaData.nombre.trim()) {
          const nuevaEtiquetaRef = doc(etiquetasRef);
          etiquetasBatch.set(nuevaEtiquetaRef, {
            eventoId: eventoId,
            etiquetaId: `ETQ-${i + 1}`,
            etiquetaNombre: etiquetaData.nombre.trim(),
            naipeId: '',
            naipeNombre: '',
            orden: i,
            creadoEn: serverTimestamp()
          });
        }
      }
      
      await etiquetasBatch.commit();
    }
    
    return {
      ok: true,
      data: {
        id: eventoId,
        nombre: nuevoEvento.nombre,
        pin: pin, // Incluir PIN en la respuesta
        fecha: fechaISO,
        activo: true,
        anfitrion: anfitrion // Incluir información del anfitrión
      }
    };
  } catch (error: unknown) {
    console.error('Error al crear evento:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo crear el evento'
    };
  }
}

/**
 * Listar todos los eventos
 */
export async function listarEventos(): Promise<ResultadoOperacion<Evento[]>> {
  try {
    const eventosRef = collection(db, 'eventos');
    // Filtrar solo eventos activos para cumplir con las reglas de seguridad
    const q = query(eventosRef, where('activo', '==', true), orderBy('creadoEn', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const eventos = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      eventos.push({
        id: doc.id,
        nombre: data.nombre || '',
        fecha: normalizarFechaISO(data.fecha),
        pin: data.pin || null, // Incluir PIN en la lista
        activo: data.activo === true,
        eventoFinalizado: data.eventoFinalizado === true,
        timerActivo: data.timerActivo === true,
        timerExpiraEn: data.timerExpiraEn ? (data.timerExpiraEn instanceof Timestamp ? data.timerExpiraEn.toMillis() : data.timerExpiraEn) : null,
        creadoEn: data.creadoEn ? (data.creadoEn instanceof Timestamp ? data.creadoEn.toDate().toISOString() : data.creadoEn) : null
      });
    });
    
    return {
      ok: true,
      data: eventos
    };
  } catch (error: unknown) {
    console.error('Error al listar eventos:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar los eventos'
    };
  }
}

/**
 * Marcar un evento como activo (desactiva todos los demás)
 */
export async function marcarEventoActivo(eventoId: string): Promise<ResultadoOperacion<{ id: string }>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Falta ID de evento'
      };
    }
    
    // Verificar que el evento existe y obtener sus datos
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      return {
        ok: false,
        error: 'Evento no encontrado con id: ' + eventoId
      };
    }
    
    const eventoData = eventoSnap.data();
    
    // Log para debug
    console.log('📋 Datos del evento encontrado:', eventoData);
    
    // Validar que el evento tenga los datos necesarios (pero no bloquear si falta nombre)
    if (!eventoData) {
      return {
        ok: false,
        error: 'El evento existe pero no tiene datos'
      };
    }
    
    // Usar batch para asegurar atomicidad - TODO en una sola transacción
    const batch = writeBatch(db);
    
    // Desactivar todos los eventos activos
    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('activo', '==', true));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
      batch.update(doc(db, 'eventos', docSnap.id), { activo: false });
    });
    
    // Activar el evento seleccionado
    batch.update(eventoRef, { activo: true });
    
    // Ejecutar todas las actualizaciones en una sola transacción
    await batch.commit();
    
    // Obtener el evento actualizado (refrescar después del commit)
    const eventoActualizadoSnap = await getDoc(eventoRef);
    const eventoActualizado = eventoActualizadoSnap.data();
    
    return {
      ok: true,
      data: {
        id: eventoId,
        nombre: eventoActualizado.nombre || 'Evento sin nombre',
        fecha: normalizarFechaISO(eventoActualizado.fecha),
        activo: true,
        creadoEn: eventoActualizado.creadoEn ? (eventoActualizado.creadoEn instanceof Timestamp ? eventoActualizado.creadoEn.toDate().toISOString() : eventoActualizado.creadoEn) : null
      }
    };
  } catch (error: unknown) {
    console.error('Error al marcar evento como activo:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo marcar el evento como activo'
    };
  }
}

// Función desactivarTodosLosEventos eliminada - ahora se hace dentro de marcarEventoActivo
// para asegurar atomicidad en una sola transacción

/**
 * Eliminar un evento y todos sus datos relacionados (participantes y etiquetas)
 */
export async function eliminarEvento(eventoId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Falta ID de evento'
      };
    }
    
    // Verificar que el evento existe
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      return {
        ok: false,
        error: 'Evento no encontrado con id: ' + eventoId
      };
    }
    
    // Usar batch para eliminar todo en una sola transacción
    const batch = writeBatch(db);
    
    // Eliminar participantes del evento
    const participantesRef = collection(db, 'participantes');
    const qParticipantes = query(participantesRef, where('eventoId', '==', eventoId));
    const participantesSnapshot = await getDocs(qParticipantes);
    participantesSnapshot.forEach((docSnap) => {
      batch.delete(doc(db, 'participantes', docSnap.id));
    });
    
    // Eliminar etiquetas del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const qEtiquetas = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(qEtiquetas);
    etiquetasSnapshot.forEach((docSnap) => {
      batch.delete(doc(db, 'etiquetas', docSnap.id));
    });
    
    // Eliminar el evento
    batch.delete(eventoRef);
    
    // Ejecutar todas las eliminaciones en una sola transacción
    await batch.commit();
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al eliminar evento:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo eliminar el evento'
    };
  }
}

// ============================================
// PARTICIPANTES
// ============================================

/**
 * Listar participantes de un evento
 */
export async function listarParticipantes(eventoId: string): Promise<ResultadoOperacion<Participante[]>> {
  try {
    if (!eventoId) {
      return {
        ok: true,
        data: []
      };
    }
    
    const participantesRef = collection(db, 'participantes');
    // ⚠️ Temporalmente sin orderBy hasta que el índice esté listo
    // Una vez que el índice esté construido, podemos agregar: orderBy('creadoEn', 'desc')
    const q = query(
      participantesRef, 
      where('eventoId', '==', eventoId)
    );
    const querySnapshot = await getDocs(q);
    
    const participantes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      participantes.push({
        id: doc.id,
        eventoId: data.eventoId || '',
        nombre: data.nombre || '',
        tipo: data.tipo || 'efimero', // Por defecto efímero para compatibilidad
        userId: data.userId || undefined,
        alias: data.alias || undefined,
        nombreCompleto: data.nombreCompleto || undefined,
        email: data.email || undefined,
        telefono: data.telefono || undefined,
        emailVerificado: data.emailVerificado || false,
        membresiaId: data.membresiaId || undefined,
        creadoEn: data.creadoEn ? (data.creadoEn instanceof Timestamp ? data.creadoEn.toDate().toISOString() : data.creadoEn) : null,
        actualizadoEn: data.actualizadoEn ? (data.actualizadoEn instanceof Timestamp ? data.actualizadoEn.toDate().toISOString() : data.actualizadoEn) : null
      });
    });
    
    // Ordenar en memoria por fecha de creación (más reciente primero)
    participantes.sort((a, b) => {
      if (!a.creadoEn && !b.creadoEn) return 0;
      if (!a.creadoEn) return 1;
      if (!b.creadoEn) return -1;
      const fechaA = new Date(a.creadoEn).getTime();
      const fechaB = new Date(b.creadoEn).getTime();
      return fechaB - fechaA; // Descendente (más reciente primero)
    });
    
    return {
      ok: true,
      data: participantes
    };
  } catch (error: unknown) {
    console.error('Error al listar participantes:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar los participantes'
    };
  }
}

/**
 * Crear un nuevo participante
 */
export async function crearParticipante(eventoId: string, nombre: string): Promise<ResultadoOperacion<{ id: string }>> {
  try {
    if (!eventoId || !nombre) {
      return {
        ok: false,
        error: 'Falta eventoId o nombre'
      };
    }
    
    // Verificar que no exista ya un participante con el mismo nombre en el mismo evento
    const participantesRef = collection(db, 'participantes');
    const q = query(
      participantesRef,
      where('eventoId', '==', eventoId),
      where('nombre', '==', nombre.trim())
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        ok: false,
        error: 'Ya existe un participante con ese nombre en este evento.'
      };
    }
    
    const nuevoParticipante = {
      eventoId: eventoId,
      nombre: nombre.trim(),
      tipo: 'efimero', // Por defecto efímero cuando se crea desde el admin
      creadoEn: serverTimestamp()
    };
    
    const docRef = await addDoc(participantesRef, nuevoParticipante);
    
    return {
      ok: true,
      data: {
        id: docRef.id,
        eventoId: eventoId,
        nombre: nombre.trim(),
        creadoEn: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    console.error('Error al crear participante:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo crear el participante'
    };
  }
}

/**
 * Actualizar un participante
 */
export async function actualizarParticipante(participanteId: string, eventoId: string, nombre: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!participanteId || !eventoId || !nombre) {
      return {
        ok: false,
        error: 'Faltan datos requeridos'
      };
    }
    
    const participanteRef = doc(db, 'participantes', participanteId);
    await updateDoc(participanteRef, {
      nombre: nombre.trim()
    });
    
    return {
      ok: true,
      data: {
        id: participanteId,
        eventoId: eventoId,
        nombre: nombre.trim()
      }
    };
  } catch (error: unknown) {
    console.error('Error al actualizar participante:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo actualizar el participante'
    };
  }
}

/**
 * Eliminar un participante
 */
export async function eliminarParticipante(participanteId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!participanteId) {
      return {
        ok: false,
        error: 'Falta ID de participante'
      };
    }
    
    await deleteDoc(doc(db, 'participantes', participanteId));
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al eliminar participante:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo eliminar el participante'
    };
  }
}

// ============================================
// ETIQUETAS
// ============================================

/**
 * Listar etiquetas de un evento
 */
export async function listarEtiquetas(eventoId: string): Promise<ResultadoOperacion<Etiqueta[]>> {
  try {
    if (!eventoId) {
      return {
        ok: true,
        data: []
      };
    }
    
    const etiquetasRef = collection(db, 'etiquetas');
    // ⚠️ Temporalmente sin orderBy hasta que el índice esté listo
    // Una vez que el índice esté construido, podemos agregar: orderBy('orden', 'asc')
    const q = query(
      etiquetasRef,
      where('eventoId', '==', eventoId)
    );
    const querySnapshot = await getDocs(q);
    
    const etiquetas = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      etiquetas.push({
        id: doc.id,
        eventoId: data.eventoId || '',
        etiquetaId: data.etiquetaId || '',
        etiquetaNombre: data.etiquetaNombre || '',
        naipeId: data.naipeId || '',
        naipeNombre: data.naipeNombre || '',
        orden: data.orden || 0,
        creadoEn: data.creadoEn ? (data.creadoEn instanceof Timestamp ? data.creadoEn.toDate().toISOString() : data.creadoEn) : null
      });
    });
    
    // Ordenar en memoria por orden (ascendente)
    etiquetas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    
    return {
      ok: true,
      data: etiquetas
    };
  } catch (error: unknown) {
    console.error('Error al listar etiquetas:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar las etiquetas'
    };
  }
}

/**
 * Guardar configuración de etiquetas (reemplaza todas las etiquetas del evento)
 */
export async function guardarEtiquetas(eventoId: string, etiquetas: Array<{ id: string; nombre: string }>): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Falta eventoId'
      };
    }
    
    // Eliminar todas las etiquetas existentes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const q = query(etiquetasRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    
    // Eliminar etiquetas existentes
    querySnapshot.forEach((docSnap) => {
      batch.delete(doc(db, 'etiquetas', docSnap.id));
    });
    
    // Agregar nuevas etiquetas
    etiquetas.forEach((etq, index) => {
      const nuevaEtiqueta = {
        eventoId: eventoId,
        etiquetaId: etq.etiquetaId || '',
        etiquetaNombre: etq.etiquetaNombre || '',
        naipeId: etq.naipeId || '',
        naipeNombre: etq.naipeNombre || '',
        orden: index,
        creadoEn: serverTimestamp()
      };
      const nuevaRef = doc(collection(db, 'etiquetas'));
      batch.set(nuevaRef, nuevaEtiqueta);
    });
    
    await batch.commit();
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al guardar etiquetas:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron guardar las etiquetas'
    };
  }
}

/**
 * Activar timer para un evento
 * @param {string} eventoId - ID del evento
 * @param {number} minutos - Duración del timer en minutos
 */
export async function activarTimerEvento(eventoId: string, minutos: number): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId || !minutos || minutos <= 0) {
      return {
        ok: false,
        error: 'Evento ID y minutos válidos son requeridos'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    const ahora = Timestamp.now();
    const expiraEn = Timestamp.fromMillis(ahora.toMillis() + (minutos * 60 * 1000));
    
    await updateDoc(eventoRef, {
      timerActivo: true,
      timerExpiraEn: expiraEn,
      timerIniciadoEn: ahora
    });
    
    return {
      ok: true,
      data: {
        expiraEn: expiraEn.toMillis()
      }
    };
  } catch (error: unknown) {
    console.error('Error al activar timer:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo activar el timer'
    };
  }
}

/**
 * Desactivar timer de un evento
 * @param {string} eventoId - ID del evento
 */
export async function pausarTimerEvento(eventoId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Evento ID es requerido'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(eventoRef, {
      timerPausado: true
    });
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error al pausar timer:', error);
    return {
      ok: false,
      error: errorMessage || 'No se pudo pausar el timer'
    };
  }
}

export async function reanudarTimerEvento(eventoId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Evento ID es requerido'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    
    await updateDoc(eventoRef, {
      timerPausado: false
    });
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error al reanudar timer:', error);
    return {
      ok: false,
      error: errorMessage || 'No se pudo reanudar el timer'
    };
  }
}

export async function desactivarTimerEvento(eventoId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Evento ID es requerido'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    await updateDoc(eventoRef, {
      timerActivo: false,
      timerExpiraEn: null,
      timerIniciadoEn: null
    });
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al desactivar timer:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo desactivar el timer'
    };
  }
}

/**
 * Aumentar tiempo del timer en minutos adicionales
 * @param {string} eventoId - ID del evento
 * @param {number} minutosAdicionales - Minutos a agregar (por defecto 5)
 */
export async function aumentarTiempoTimer(eventoId: string, minutosAdicionales: number = 5): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId || !minutosAdicionales || minutosAdicionales <= 0) {
      return {
        ok: false,
        error: 'Evento ID y minutos válidos son requeridos'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoDoc = await getDoc(eventoRef);
    
    if (!eventoDoc.exists()) {
      return {
        ok: false,
        error: 'Evento no encontrado'
      };
    }
    
    const eventoData = eventoDoc.data();
    
    if (!eventoData.timerActivo || !eventoData.timerExpiraEn) {
      return {
        ok: false,
        error: 'El timer no está activo'
      };
    }
    
    // Obtener el tiempo actual de expiración
    const expiraEnActual = eventoData.timerExpiraEn;
    const expiraEnNuevo = Timestamp.fromMillis(expiraEnActual.toMillis() + (minutosAdicionales * 60 * 1000));
    
    await updateDoc(eventoRef, {
      timerExpiraEn: expiraEnNuevo
    });
    
    return {
      ok: true,
      data: {
        expiraEn: expiraEnNuevo.toMillis()
      }
    };
  } catch (error: unknown) {
    console.error('Error al aumentar tiempo del timer:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo aumentar el tiempo del timer'
    };
  }
}

/**
 * Escuchar cambios en tiempo real del timer de un evento
 * @param {string} eventoId - ID del evento
 * @param {function} callback - Función que se ejecuta cuando cambia el timer
 * @returns {function} Función para cancelar la suscripción
 */
interface TimerData {
  timerActivo?: boolean;
  timerExpiraEn?: number | null;
  timerIniciadoEn?: number | null;
  error?: string;
}

export function escucharTimerEvento(eventoId: string, callback: (data: TimerData) => void): () => void {
  if (!eventoId) {
    console.error('Evento ID es requerido para escuchar el timer');
    return () => {};
  }
  
  const eventoRef = doc(db, 'eventos', eventoId);
  
  const unsubscribe = onSnapshot(eventoRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback({
        timerActivo: data.timerActivo || false,
        timerExpiraEn: data.timerExpiraEn ? data.timerExpiraEn.toMillis() : null,
        timerIniciadoEn: data.timerIniciadoEn ? data.timerIniciadoEn.toMillis() : null
      });
    } else {
      callback({
        timerActivo: false,
        timerExpiraEn: null,
        timerIniciadoEn: null
      });
    }
  }, (error) => {
    console.error('Error al escuchar timer:', error);
    callback({
      timerActivo: false,
      timerExpiraEn: null,
      timerIniciadoEn: null,
      error: error instanceof Error ? error.message : String(error)
    });
  });
  
  return unsubscribe;
}

/**
 * Revelar resultados de un evento y finalizarlo
 * @param {string} eventoId - ID del evento
 */
export async function revelarResultadosEvento(eventoId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!eventoId) {
      return {
        ok: false,
        error: 'Evento ID es requerido'
      };
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    
    // Obtener datos del evento para la notificación
    const eventoSnap = await getDoc(eventoRef);
    const eventoData = eventoSnap.exists() ? eventoSnap.data() : null;
    const eventoNombre = eventoData?.nombre || 'Evento';
    const eventoPIN = eventoData?.pin || '';
    
    // Marcar como finalizado, revelar resultados y congelar timer
    await updateDoc(eventoRef, {
      resultadosRevelados: true,
      resultadosReveladosEn: serverTimestamp(),
      eventoFinalizado: true,
      eventoFinalizadoEn: serverTimestamp(),
      timerActivo: false // Congelar el timer
    });
    
    // Enviar notificación push a participantes del evento
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { initializeApp, getApps } = await import('firebase/app');
      const { firebaseConfig } = await import('./core/firebase-config');
      
      // Inicializar Firebase si no está inicializado
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }
      
      const functions = getFunctions(app, 'us-central1');
      const enviarNotificacion = httpsCallable(functions, 'enviarNotificacionPush');
      
      await enviarNotificacion({
        title: '🎊 ¡Resultados revelados!',
        body: `Los resultados del evento "${eventoNombre}" ya están disponibles`,
        eventoId: eventoId,
        data: {
          url: `/?pin=${eventoPIN}`,
          eventoId: eventoId,
          pin: eventoPIN
        }
      });
      
      console.log('Notificación push enviada para resultados revelados');
    } catch (error: unknown) {
      console.error('Error al enviar notificación push:', error);
      // No bloqueamos el flujo si falla enviar la notificación
    }
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al revelar resultados:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron revelar los resultados'
    };
  }
}

/**
 * Buscar un evento por PIN
 * @param {string} pin - PIN del evento (5 dígitos)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function buscarEventoPorPIN(pin: string): Promise<ResultadoOperacion<Evento>> {
  try {
    // Normalizar PIN: trim y convertir a string
    const pinNormalizado = String(pin || '').trim();
    
    if (!pinNormalizado || !/^\d{5}$/.test(pinNormalizado)) {
      console.log('PIN inválido:', pinNormalizado);
      return {
        ok: false,
        error: 'PIN inválido'
      };
    }
    
    console.log('Buscando evento con PIN:', pinNormalizado);
    
    // Buscar evento por PIN y activo (requerido por reglas de seguridad)
    const eventosRef = collection(db, 'eventos');
    const q = query(
      eventosRef, 
      where('pin', '==', pinNormalizado),
      where('activo', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    console.log('Resultados de búsqueda:', querySnapshot.size, 'eventos encontrados');
    
    if (querySnapshot.empty) {
      console.log('No se encontró ningún evento con PIN:', pinNormalizado);
      return {
        ok: false,
        error: 'Evento no disponible'
      };
    }
    
    // Obtener el primer evento encontrado (debería ser único)
    const eventoDoc = querySnapshot.docs[0];
    const eventoData = eventoDoc.data();
    
    console.log('Evento encontrado:', {
      id: eventoDoc.id,
      nombre: eventoData.nombre,
      activo: eventoData.activo,
      eventoFinalizado: eventoData.eventoFinalizado,
      pin: eventoData.pin
    });
    
    // Verificar que el evento esté activo
    if (eventoData.activo === false || eventoData.activo === undefined) {
      console.log('Evento encontrado pero no está activo. activo:', eventoData.activo);
      return {
        ok: false,
        error: 'Evento no disponible'
      };
    }
    
    // Verificar que el evento no esté finalizado (opcional, dependiendo de la lógica de negocio)
    // Si el evento está finalizado, podría seguir siendo accesible para ver resultados
    // Por ahora, permitimos acceso incluso si está finalizado
    
    return {
      ok: true,
      data: {
        id: eventoDoc.id,
        nombre: eventoData.nombre || 'Evento sin nombre',
        fecha: normalizarFechaISO(eventoData.fecha),
        pin: eventoData.pin,
        activo: eventoData.activo,
        eventoFinalizado: eventoData.eventoFinalizado || false
      }
    };
  } catch (error: unknown) {
    console.error('Error al buscar evento por PIN:', error);
    return {
      ok: false,
      error: 'Error al buscar el evento. Intentá nuevamente.'
    };
  }
}

// ============================================
// PLANTILLAS DE PARTICIPANTES
// ============================================

/**
 * Listar todas las plantillas de participantes disponibles
 */
export async function listarPlantillasParticipantes(): Promise<ResultadoOperacion<PlantillaParticipante[]>> {
  try {
    const plantillasRef = collection(db, 'plantillasParticipantes');
    const q = query(plantillasRef, orderBy('nombre', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const plantillas = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      plantillas.push({
        id: doc.id,
        nombre: data.nombre || '',
        creadoEn: data.creadoEn ? (data.creadoEn instanceof Timestamp ? data.creadoEn.toDate().toISOString() : data.creadoEn) : null
      });
    });
    
    return {
      ok: true,
      data: plantillas
    };
  } catch (error: unknown) {
    console.error('Error al listar plantillas de participantes:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar las plantillas de participantes'
    };
  }
}

/**
 * Crear una nueva plantilla de participante
 */
export async function crearPlantillaParticipante(nombre: string): Promise<ResultadoOperacion<{ id: string }>> {
  try {
    if (!nombre || !nombre.trim()) {
      return {
        ok: false,
        error: 'Falta el nombre de la plantilla'
      };
    }
    
    // Verificar que no exista ya
    const plantillasRef = collection(db, 'plantillasParticipantes');
    const q = query(plantillasRef, where('nombre', '==', nombre.trim()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        ok: false,
        error: 'Ya existe una plantilla con ese nombre'
      };
    }
    
    const nuevaPlantilla = {
      nombre: nombre.trim(),
      creadoEn: serverTimestamp()
    };
    
    const docRef = await addDoc(plantillasRef, nuevaPlantilla);
    
    return {
      ok: true,
      data: {
        id: docRef.id,
        nombre: nombre.trim(),
        creadoEn: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    console.error('Error al crear plantilla de participante:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo crear la plantilla'
    };
  }
}

/**
 * Eliminar una plantilla de participante
 */
export async function eliminarPlantillaParticipante(plantillaId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!plantillaId) {
      return {
        ok: false,
        error: 'Falta ID de plantilla'
      };
    }
    
    await deleteDoc(doc(db, 'plantillasParticipantes', plantillaId));
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al eliminar plantilla de participante:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo eliminar la plantilla'
    };
  }
}

// ============================================
// PLANTILLAS DE ETIQUETAS
// ============================================

/**
 * Listar todas las plantillas de etiquetas disponibles
 */
export async function listarPlantillasEtiquetas(): Promise<ResultadoOperacion<PlantillaEtiqueta[]>> {
  try {
    const plantillasRef = collection(db, 'plantillasEtiquetas');
    const q = query(plantillasRef, orderBy('nombre', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const plantillas = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      plantillas.push({
        id: doc.id,
        nombre: data.nombre || '',
        creadoEn: data.creadoEn ? (data.creadoEn instanceof Timestamp ? data.creadoEn.toDate().toISOString() : data.creadoEn) : null
      });
    });
    
    return {
      ok: true,
      data: plantillas
    };
  } catch (error: unknown) {
    console.error('Error al listar plantillas de etiquetas:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar las plantillas de etiquetas'
    };
  }
}

/**
 * Crear una nueva plantilla de etiqueta
 */
export async function crearPlantillaEtiqueta(nombre: string): Promise<ResultadoOperacion<{ id: string }>> {
  try {
    if (!nombre || !nombre.trim()) {
      return {
        ok: false,
        error: 'Falta el nombre de la plantilla'
      };
    }
    
    // Verificar que no exista ya
    const plantillasRef = collection(db, 'plantillasEtiquetas');
    const q = query(plantillasRef, where('nombre', '==', nombre.trim()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        ok: false,
        error: 'Ya existe una plantilla con ese nombre'
      };
    }
    
    const nuevaPlantilla = {
      nombre: nombre.trim(),
      creadoEn: serverTimestamp()
    };
    
    const docRef = await addDoc(plantillasRef, nuevaPlantilla);
    
    return {
      ok: true,
      data: {
        id: docRef.id,
        nombre: nombre.trim(),
        creadoEn: new Date().toISOString()
      }
    };
  } catch (error: unknown) {
    console.error('Error al crear plantilla de etiqueta:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo crear la plantilla'
    };
  }
}

/**
 * Eliminar una plantilla de etiqueta
 */
export async function eliminarPlantillaEtiqueta(plantillaId: string): Promise<ResultadoOperacion<void>> {
  try {
    if (!plantillaId) {
      return {
        ok: false,
        error: 'Falta ID de plantilla'
      };
    }
    
    await deleteDoc(doc(db, 'plantillasEtiquetas', plantillaId));
    
    return {
      ok: true
    };
  } catch (error: unknown) {
    console.error('Error al eliminar plantilla de etiqueta:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo eliminar la plantilla'
    };
  }
}

// ============================================
// USUARIOS (BASE DE DATOS ÚNICA)
// ============================================

/**
 * Crear o actualizar un usuario en la base de datos única
 * Si el usuario ya existe, actualiza su última participación
 */
export async function guardarUsuario(nombre: string): Promise<ResultadoOperacion<{ id: string }>> {
  try {
    if (!nombre || !nombre.trim()) {
      return {
        ok: false,
        error: 'Falta el nombre del usuario'
      };
    }
    
    const nombreNormalizado = nombre.trim().toLowerCase();
    const usuariosRef = collection(db, 'usuarios');
    
    // Buscar si ya existe un usuario con este nombre (case-insensitive)
    const q = query(usuariosRef, where('nombreLower', '==', nombreNormalizado));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuario existe, actualizar última participación
      const usuarioDoc = querySnapshot.docs[0];
      await updateDoc(usuarioDoc.ref, {
        ultimaParticipacion: serverTimestamp(),
        participaciones: (usuarioDoc.data().participaciones || 0) + 1
      });
      
      return {
        ok: true,
        data: {
          id: usuarioDoc.id,
          nombre: nombre.trim(),
          existe: true
        }
      };
    } else {
      // Crear nuevo usuario
      const nuevoUsuario = {
        nombre: nombre.trim(),
        nombreLower: nombreNormalizado, // Para búsquedas case-insensitive
        primeraParticipacion: serverTimestamp(),
        ultimaParticipacion: serverTimestamp(),
        participaciones: 1
      };
      
      const docRef = await addDoc(usuariosRef, nuevoUsuario);
      
      return {
        ok: true,
        data: {
          id: docRef.id,
          nombre: nombre.trim(),
          existe: false
        }
      };
    }
  } catch (error: unknown) {
    console.error('Error al guardar usuario:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudo guardar el usuario'
    };
  }
}

/**
 * Listar todos los usuarios (para autocompletado)
 */
export async function listarUsuarios(): Promise<ResultadoOperacion<Array<{ id: string; nombre: string }>>> {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, orderBy('nombre', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const usuarios = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      usuarios.push({
        id: doc.id,
        nombre: data.nombre || '',
        participaciones: data.participaciones || 0,
        primeraParticipacion: data.primeraParticipacion ? (data.primeraParticipacion instanceof Timestamp ? data.primeraParticipacion.toDate().toISOString() : data.primeraParticipacion) : null,
        ultimaParticipacion: data.ultimaParticipacion ? (data.ultimaParticipacion instanceof Timestamp ? data.ultimaParticipacion.toDate().toISOString() : data.ultimaParticipacion) : null
      });
    });
    
    return {
      ok: true,
      data: usuarios
    };
  } catch (error: unknown) {
    console.error('Error al listar usuarios:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error) || 'No se pudieron cargar los usuarios'
    };
  }
}

// Las funciones normalizarFechaISO y formatearFechaParaUI ya están exportadas arriba con export function

