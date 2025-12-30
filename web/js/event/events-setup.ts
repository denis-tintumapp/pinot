/**
 * Página para armar/configurar el evento
 * Permite cargar participantes, etiquetas y naipes
 */

import { 
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../core/firebase-init';
import { NAIPES_TRUCO } from '../constantes';
import { registrarLog } from '../admin/admin-logger';
import { requireAuth } from '../auth/auth-guard';

interface Participante {
  id: string;
  nombre: string;
  [key: string]: unknown;
}

interface Etiqueta {
  id: string;
  nombre: string;
}

interface NaipeSeleccionado {
  id: string;
  nombre: string;
}

// Verificar autenticación antes de continuar
let user: unknown = null;
try {
  user = await requireAuth();
  if (!user) {
    // Ya redirigió a login
    throw new Error('Usuario no autenticado');
  }
} catch (error: unknown) {
  console.error('[Armar Evento] Error de autenticación:', error);
  // El requireAuth ya maneja la redirección
}

// Firebase ya está inicializado en firebase-init

// Obtener eventoId de la URL
const urlParams = new URLSearchParams(window.location.search);
const eventoId: string | null = urlParams.get('eventoId');

// Estado
let participantes: Participante[] = [];
let etiquetas: Etiqueta[] = [];
let naipesSeleccionados: NaipeSeleccionado[] = [];
let participanteEditando: Participante | null = null;
let etiquetaEditando: Etiqueta | null = null;
let eventoData: Record<string, unknown> | null = null;

// Elementos del DOM
const eventoNombreHeader = document.getElementById('eventoNombreHeader') as HTMLElement | null;
const btnFinalizar = document.getElementById('btnFinalizar') as HTMLButtonElement | null;
const partNombreInput = document.getElementById('partNombre') as HTMLInputElement | null;
const btnAgregarParticipante = document.getElementById('btnAgregarParticipante') as HTMLButtonElement | null;
const msgParticipante = document.getElementById('msgParticipante') as HTMLElement | null;
const listaParticipantes = document.getElementById('listaParticipantes') as HTMLElement | null;
const etqNombreInput = document.getElementById('etqNombre') as HTMLInputElement | null;
const btnAgregarEtiqueta = document.getElementById('btnAgregarEtiqueta') as HTMLButtonElement | null;
const msgEtiquetas = document.getElementById('msgEtiquetas') as HTMLElement | null;
const naipeSelect = document.getElementById('naipeSelect') as HTMLSelectElement | null;
const btnAgregarNaipe = document.getElementById('btnAgregarNaipe') as HTMLButtonElement | null;
const btnSugerirNaipes = document.getElementById('btnSugerirNaipes') as HTMLButtonElement | null;
const msgNaipes = document.getElementById('msgNaipes') as HTMLElement | null;
const listaEtiquetas = document.getElementById('listaEtiquetas') as HTMLElement | null;
const listaNaipes = document.getElementById('listaNaipes') as HTMLElement | null;
const btnGuardarConfig = document.getElementById('btnGuardarConfig') as HTMLButtonElement | null;
const msgGuardarConfig = document.getElementById('msgGuardarConfig') as HTMLElement | null;

// Verificar autenticación y cargar evento
async function inicializar(): Promise<void> {
  // Verificar que hay eventoId
  if (!eventoId) {
    alert('No se especificó un evento. Redirigiendo...');
    window.location.href = '/';
    return;
  }
  
  // Verificar autenticación
  const anfitrionId = localStorage.getItem('anfitrion_id');
  if (!anfitrionId) {
    window.location.href = '/';
    return;
  }
  
  // Cargar datos del evento
  try {
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      alert('El evento no existe. Redirigiendo...');
      window.location.href = '/';
      return;
    }
    
    eventoData = eventoSnap.data();
    
    // Verificar que el evento pertenece al anfitrión
    if (eventoData.anfitrionId !== anfitrionId) {
      alert('No tienes permiso para configurar este evento.');
      window.location.href = '/';
      return;
    }
    
    // Mostrar nombre del evento
    if (eventoNombreHeader) {
      const nombreEvento = (eventoData.nombre as string) || 'Evento sin nombre';
      eventoNombreHeader.textContent = nombreEvento;
    }
    
    // Cargar datos existentes
    await cargarParticipantes();
    await cargarEtiquetas();
    inicializarNaipesSelect();
    
  } catch (error: unknown) {
    console.error('Error al inicializar:', error);
    alert('Error al cargar el evento. Por favor, recarga la página.');
  }
}

// Cargar participantes del evento
async function cargarParticipantes(): Promise<void> {
  if (!eventoId) return;
  
  try {
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    participantes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      participantes.push({
        id: doc.id,
        nombre: data.nombre || '',
        ...data
      } as Participante);
    });
    
    renderParticipantes();
  } catch (error: unknown) {
    console.error('Error al cargar participantes:', error);
    mostrarMensajeParticipante('Error al cargar participantes', 'error');
  }
}

// Renderizar lista de participantes
function renderParticipantes(): void {
  if (!listaParticipantes) return;
  
  listaParticipantes.innerHTML = '';
  
  if (participantes.length === 0) {
    listaParticipantes.innerHTML = '<li class="text-gray-500">No hay participantes cargados aún.</li>';
    return;
  }
  
  participantes.forEach((participante) => {
    const li = document.createElement('li');
    li.className = 'border border-gray-200 rounded-lg px-4 py-2 flex justify-between items-center gap-2';
    
    const span = document.createElement('span');
    span.textContent = participante.nombre;
    
    const acciones = document.createElement('div');
    acciones.className = 'flex gap-2';
    
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    btnEdit.onclick = () => comenzarEdicionParticipante(participante);
    
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Eliminar';
    btnDel.className = 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200';
    btnDel.onclick = () => eliminarParticipante(participante);
    
    acciones.appendChild(btnEdit);
    acciones.appendChild(btnDel);
    
    li.appendChild(span);
    li.appendChild(acciones);
    listaParticipantes.appendChild(li);
  });
}

// Agregar participante
async function agregarParticipante(): Promise<void> {
  if (!partNombreInput) return;
  const nombre = partNombreInput.value.trim();
  
  if (!nombre) {
    mostrarMensajeParticipante('Ingresá un nombre', 'error');
    return;
  }
  
  if (!eventoId) {
    mostrarMensajeParticipante('No hay evento seleccionado', 'error');
    return;
  }
  
  try {
    if (participanteEditando) {
      // Actualizar participante existente
      const participanteRef = doc(db, 'participantes', participanteEditando.id);
      
      // Obtener datos anteriores para el log
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
      
      await updateDoc(participanteRef, {
        nombre: nombre
      });
      
      // Registrar log
      await registrarLog('update', 'participantes', participanteEditando.id, { nombre }, datosAnteriores || undefined, `Participante actualizado: ${nombre}`, 'Anfitrión');
      
      mostrarMensajeParticipante('Participante actualizado', 'success');
    } else {
      // Crear nuevo participante
      const participantesRef = collection(db, 'participantes');
      const nuevoParticipante = {
        eventoId: eventoId,
        nombre: nombre,
        creadoEn: serverTimestamp()
      };
      const participanteDocRef = await addDoc(participantesRef, nuevoParticipante);
      
      // Registrar log
      await registrarLog('create', 'participantes', participanteDocRef.id, nuevoParticipante, undefined, `Participante creado: ${nombre}`, 'Anfitrión');
      
      mostrarMensajeParticipante('Participante agregado', 'success');
    }
    
    partNombreInput.value = '';
    participanteEditando = null;
    if (btnAgregarParticipante) btnAgregarParticipante.textContent = 'Agregar';
    await cargarParticipantes();
    
  } catch (error: unknown) {
    console.error('Error al guardar participante:', error);
    mostrarMensajeParticipante('Error al guardar participante', 'error');
  }
}

// Comenzar edición de participante
function comenzarEdicionParticipante(participante: Participante): void {
  participanteEditando = participante;
  if (partNombreInput) partNombreInput.value = participante.nombre;
  if (btnAgregarParticipante) btnAgregarParticipante.textContent = 'Guardar cambios';
  mostrarMensajeParticipante(`Editando: ${participante.nombre}`, 'info');
}

// Eliminar participante
async function eliminarParticipante(participante: Participante): Promise<void> {
  if (!confirm(`¿Eliminar a "${participante.nombre}" de este evento?`)) {
    return;
  }
  
  try {
    // Obtener datos antes de eliminar para el log
    const participanteRef = doc(db, 'participantes', participante.id);
    const participanteSnap = await getDoc(participanteRef);
    const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
    
    await deleteDoc(participanteRef);
    
      // Registrar log
      await registrarLog('delete', 'participantes', participante.id, undefined, datosAnteriores || undefined, `Participante eliminado: ${participante.nombre}`, 'Anfitrión');
    
    if (participanteEditando && participanteEditando.id === participante.id) {
      participanteEditando = null;
      if (partNombreInput) partNombreInput.value = '';
      if (btnAgregarParticipante) btnAgregarParticipante.textContent = 'Agregar';
    }
    
    mostrarMensajeParticipante('Participante eliminado', 'success');
    await cargarParticipantes();
    
  } catch (error: unknown) {
    console.error('Error al eliminar participante:', error);
    mostrarMensajeParticipante('Error al eliminar participante', 'error');
  }
}

// Mostrar mensaje de participante
function mostrarMensajeParticipante(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info'): void {
  if (!msgParticipante) return;
  
  msgParticipante.textContent = mensaje;
  msgParticipante.className = 'text-sm';
  
  if (tipo === 'error') {
    msgParticipante.classList.add('text-red-600');
  } else if (tipo === 'success') {
    msgParticipante.classList.add('text-green-600');
  } else {
    msgParticipante.classList.add('text-gray-600');
  }
}

// Cargar etiquetas del evento
async function cargarEtiquetas(): Promise<void> {
  if (!eventoId) return;
  
  try {
    const etiquetasRef = collection(db, 'etiquetas');
    const q = query(etiquetasRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    etiquetas = [];
    const etiquetasUnicas = new Set();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const etiquetaId = data.etiquetaId || '';
      const etiquetaNombre = data.etiquetaNombre || '';
      
      if (etiquetaId && etiquetaNombre && !etiquetasUnicas.has(etiquetaId)) {
        etiquetas.push({
          id: etiquetaId,
          nombre: etiquetaNombre
        });
        
        etiquetasUnicas.add(etiquetaId);
      }
    });
    
    // Cargar naipes desde el documento del evento
    await cargarNaipesDelEvento();
    
    renderEtiquetas();
    renderNaipes();
    
  } catch (error: unknown) {
    console.error('Error al cargar etiquetas:', error);
    mostrarMensajeEtiquetas('Error al cargar etiquetas', 'error');
  }
}

// Cargar naipes desde el documento del evento
async function cargarNaipesDelEvento(): Promise<void> {
  try {
    if (!eventoId) {
      naipesSeleccionados = [];
      return;
    }
    
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (eventoSnap.exists()) {
      const eventoData = eventoSnap.data();
      const naipesArray = eventoData.naipes || [];
      
      // Convertir el array de naipes a formato esperado
      naipesSeleccionados = naipesArray.map((n: { id?: string; nombre?: string } | string) => ({
        id: typeof n === 'object' ? (n.id || String(n)) : String(n),
        nombre: typeof n === 'object' ? (n.nombre || String(n)) : String(n)
      }));
      
      console.log('Naipes cargados del evento:', naipesSeleccionados.length);
    } else {
      naipesSeleccionados = [];
      console.warn('Evento no encontrado para cargar naipes');
    }
  } catch (error: unknown) {
    console.error('Error al cargar naipes del evento:', error);
    naipesSeleccionados = [];
  }
}

// Renderizar etiquetas
function renderEtiquetas(): void {
  if (!listaEtiquetas) return;
  
  listaEtiquetas.innerHTML = '';
  
  if (etiquetas.length === 0) {
    listaEtiquetas.innerHTML = '<li class="text-gray-500">No hay etiquetas cargadas aún.</li>';
    return;
  }
  
  etiquetas.forEach((etq, idx) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center gap-2 border border-gray-200 rounded-lg px-3 py-2';
    
    const naipe = naipesSeleccionados[idx];
    const span = document.createElement('span');
    span.textContent = naipe
      ? `Etiqueta #${idx + 1} — ${etq.nombre} → ${naipe.nombre}`
      : `Etiqueta #${idx + 1} — ${etq.nombre}`;
    
    const acciones = document.createElement('div');
    acciones.className = 'flex gap-2';
    
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    btnEdit.onclick = () => comenzarEdicionEtiqueta(etq);
    
    acciones.appendChild(btnEdit);
    
    li.appendChild(span);
    li.appendChild(acciones);
    listaEtiquetas.appendChild(li);
  });
  
  if (msgEtiquetas) {
    msgEtiquetas.textContent = `Total de etiquetas: ${etiquetas.length}. Máximo de naipes: ${etiquetas.length}.`;
    msgEtiquetas.className = 'text-sm text-gray-600';
  }
}

// Renderizar naipes
function renderNaipes(): void {
  if (!listaNaipes) return;
  
  listaNaipes.innerHTML = '';
  
  if (naipesSeleccionados.length === 0) {
    listaNaipes.innerHTML = '<li class="text-gray-500">No hay naipes asignados aún.</li>';
    return;
  }
  
  naipesSeleccionados.forEach((n, idx) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center gap-2 border border-gray-200 rounded-lg px-3 py-2';
    
    const span = document.createElement('span');
    span.textContent = `#${idx + 1} — ${n.nombre}`;
    
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'Quitar';
    btnRemove.className = 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200';
    btnRemove.onclick = () => {
      naipesSeleccionados = naipesSeleccionados.filter(x => x.id !== n.id);
      renderNaipes();
      renderEtiquetas();
    };
    
    li.appendChild(span);
    li.appendChild(btnRemove);
    listaNaipes.appendChild(li);
  });
  
  if (msgNaipes) {
    const max = etiquetas.length;
    msgNaipes.textContent = `Naipes seleccionados: ${naipesSeleccionados.length} / ${max} etiquetas.`;
    msgNaipes.className = 'text-sm text-gray-600';
  }
}

// Inicializar selector de naipes
function inicializarNaipesSelect(): void {
  if (!naipeSelect) return;
  
  naipeSelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Seleccioná un naipe…';
  naipeSelect.appendChild(defaultOpt);
  
  NAIPES_TRUCO
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = n.nombre;
      naipeSelect.appendChild(opt);
    });
}

// Agregar etiqueta
function agregarEtiqueta(): void {
  if (!etqNombreInput) return;
  const nombre = etqNombreInput.value.trim();
  
  if (!nombre) {
    mostrarMensajeEtiquetas('Ingresá un nombre para la etiqueta (vino)', 'error');
    return;
  }
  
  if (etiquetaEditando) {
    // Actualizar etiqueta existente
    const idEditando = etiquetaEditando.id;
    etiquetas = etiquetas.map(e =>
      e.id === idEditando ? { ...e, nombre } : e
    );
    mostrarMensajeEtiquetas('Etiqueta actualizada', 'success');
    resetEdicionEtiqueta();
  } else {
    // Crear nueva etiqueta
    const id = `ETQ-${etiquetas.length + 1}`;
    etiquetas.push({ id, nombre });
    if (etqNombreInput) etqNombreInput.value = '';
    mostrarMensajeEtiquetas('Etiqueta agregada', 'success');
  }
  
  renderEtiquetas();
  renderNaipes();
}

// Comenzar edición de etiqueta
function comenzarEdicionEtiqueta(etq: Etiqueta): void {
  etiquetaEditando = etq;
  if (etqNombreInput) etqNombreInput.value = etq.nombre;
  if (btnAgregarEtiqueta) btnAgregarEtiqueta.textContent = 'Guardar etiqueta';
  mostrarMensajeEtiquetas(`Editando: ${etq.nombre}`, 'info');
}

// Reset edición de etiqueta
function resetEdicionEtiqueta(): void {
  etiquetaEditando = null;
  if (etqNombreInput) etqNombreInput.value = '';
  if (btnAgregarEtiqueta) btnAgregarEtiqueta.textContent = 'Nueva etiqueta';
}

// Agregar naipe
function agregarNaipe(): void {
  if (!naipeSelect) return;
  if (!etiquetas.length) {
    mostrarMensajeNaipes('Antes de asignar naipes, cargá al menos una etiqueta', 'error');
    return;
  }
  
  const max = etiquetas.length;
  if (naipesSeleccionados.length >= max) {
    mostrarMensajeNaipes(`Ya seleccionaste el máximo de naipes (${max}) para las etiquetas cargadas`, 'error');
    return;
  }
  
  const naipeId = naipeSelect.value;
  if (!naipeId) {
    mostrarMensajeNaipes('Seleccioná un naipe de la lista', 'error');
    return;
  }
  
  if (naipesSeleccionados.some(n => n.id === naipeId)) {
    mostrarMensajeNaipes('Ese naipe ya fue seleccionado. Elegí otro', 'error');
    return;
  }
  
  const meta = NAIPES_TRUCO.find(n => n.id === naipeId);
  if (!meta) {
    mostrarMensajeNaipes('Naipe inválido', 'error');
    return;
  }
  
  naipesSeleccionados.push({ id: meta.id, nombre: meta.nombre });
  naipeSelect.value = '';
  renderNaipes();
  renderEtiquetas();
}

// Sugerir naipes
function sugerirNaipes(): void {
  if (!etiquetas.length) {
    mostrarMensajeNaipes('Cargá las etiquetas antes de sugerir naipes', 'error');
    return;
  }
  
  const max = etiquetas.length;
  const ya = naipesSeleccionados.length;
  const faltan = max - ya;
  
  if (faltan <= 0) {
    mostrarMensajeNaipes('Ya tenés asignados naipes para todas las etiquetas', 'error');
    return;
  }
  
  const disponibles = NAIPES_TRUCO.filter(
    n => !naipesSeleccionados.some(sel => sel.id === n.id)
  ).slice(0, faltan);
  
  disponibles.forEach(n => naipesSeleccionados.push({ id: n.id, nombre: n.nombre }));
  
  renderNaipes();
  renderEtiquetas();
  
  mostrarMensajeNaipes(`Se sugirieron automáticamente ${disponibles.length} naipes según el ranking de Truco`, 'success');
}

// Guardar configuración de etiquetas y naipes
async function guardarConfiguracion(): Promise<void> {
  if (!eventoId) {
    mostrarMensajeGuardar('No hay evento seleccionado', 'error');
    return;
  }
  
  if (!etiquetas.length) {
    mostrarMensajeGuardar('Cargá al menos una etiqueta', 'error');
    return;
  }
  
  // Los naipes no se guardan en las etiquetas durante la configuración
  // Se asignarán cuando el anfitrión revele los resultados
  
  try {
    // Eliminar etiquetas existentes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const q = query(etiquetasRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    // Registrar logs de eliminación antes de eliminar
    const deletePromises: Promise<void>[] = [];
    const logDeletePromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      const datosAnteriores = docSnap.data();
      deletePromises.push(deleteDoc(docSnap.ref));
      logDeletePromises.push(registrarLog('delete', 'etiquetas', docSnap.id, undefined, datosAnteriores || undefined, `Etiqueta eliminada: ${datosAnteriores.etiquetaNombre || docSnap.id}`, 'Anfitrión'));
    });
    await Promise.all(deletePromises);
    await Promise.all(logDeletePromises);
    
    // Crear nuevas etiquetas sin naipes asignados (se asignarán al revelar resultados)
    const createPromises = etiquetas.map((etq, idx) => {
      const nuevaEtiqueta = {
        eventoId: eventoId,
        etiquetaId: etq.id,
        etiquetaNombre: etq.nombre,
        naipeId: '', // Vacío hasta que se revelen los resultados
        naipeNombre: '', // Vacío hasta que se revelen los resultados
        orden: idx + 1,
        creadoEn: serverTimestamp()
      };
      return addDoc(etiquetasRef, nuevaEtiqueta).then(docRef => {
        // Registrar log de creación
        return registrarLog('create', 'etiquetas', docRef.id, nuevaEtiqueta, undefined, `Etiqueta creada: ${etq.nombre}`, 'Anfitrión');
      });
    });
    
    await Promise.all(createPromises);
    
    // Guardar naipes en el documento del evento
    const eventoRef = doc(db, 'eventos', eventoId);
    const naipesArray = naipesSeleccionados.map(n => ({
      id: n.id,
      nombre: n.nombre
    }));
    
    await updateDoc(eventoRef, {
      naipes: naipesArray
    });
    
    // Registrar log de actualización del evento con naipes
    try {
      await registrarLog('update', 'eventos', eventoId, { naipes: naipesArray }, undefined, `Naipes guardados en evento: ${naipesArray.length} naipes`, 'Anfitrión');
    } catch (logError) {
      console.warn('Error al registrar log de naipes:', logError);
    }
    
    mostrarMensajeGuardar('Configuración guardada exitosamente', 'success');
    
    // Recargar etiquetas
    await cargarEtiquetas();
    
  } catch (error: unknown) {
    console.error('Error al guardar configuración:', error);
    mostrarMensajeGuardar('Error al guardar la configuración', 'error');
  }
}

// Finalizar configuración
async function finalizarConfiguracion(): Promise<void> {
  // Verificar que tenga al menos 2 participantes y 2 etiquetas
  if (participantes.length < 2) {
    alert('El evento debe tener al menos 2 participantes para poder finalizar.');
    return;
  }
  
  if (etiquetas.length < 2) {
    alert('El evento debe tener al menos 2 etiquetas para poder finalizar.');
    return;
  }
  
  // Guardar configuración de etiquetas (sin naipes, se asignarán al revelar resultados)
  if (etiquetas.length > 0) {
    await guardarConfiguracion();
  }
  
  // Enviar email de confirmación con QR
  try {
    const anfitrionEmail = localStorage.getItem('anfitrion_email');
    const anfitrionAlias = localStorage.getItem('anfitrion_alias') || 'Anfitrión';
    
    if (anfitrionEmail && eventoData && eventoId) {
      const urlBase = window.location.origin;
      
      console.log('📧 Enviando email de confirmación de evento...');
      
      // Usar el servicio de email actualizado
      const { sendEventConfirmationEmail } = await import('../auth/services/email-service');
      const emailResult = await sendEventConfirmationEmail({
        email: anfitrionEmail,
        nombre: anfitrionAlias,
        eventoNombre: (eventoData.nombre as string) || 'Evento sin nombre',
        eventoPIN: (eventoData.pin as string) || '',
        eventoId: eventoId,
        urlBase: urlBase
      });
      
      if (!emailResult.success) {
        console.error('Error al enviar email de confirmación:', emailResult.error);
      } else {
        console.log('✅ Email de confirmación enviado exitosamente');
      }
      
      // El email ya fue enviado arriba, solo verificar resultado
      if (!emailResult.success) {
        console.warn('⚠️ No se pudo enviar el email de confirmación, pero el evento fue creado correctamente');
      }
    }
  } catch (error: unknown) {
    console.error('Error al enviar email de confirmación:', error);
    // No bloquear el flujo si falla el envío de email
  }
  
  // Mostrar pantalla de confirmación con PIN
  mostrarConfirmacionFinalizacion();
}

// Mostrar pantalla de confirmación después de finalizar
function mostrarConfirmacionFinalizacion(): void {
  const seccionConfirmacion = document.getElementById('seccionConfirmacion');
  const pinConfirmacion = document.getElementById('pinConfirmacion');
  
  if (seccionConfirmacion && pinConfirmacion && eventoData) {
    // Mostrar el PIN
    pinConfirmacion.textContent = (eventoData.pin as string) || 'N/A';
    
    // Mostrar la sección de confirmación
    seccionConfirmacion.classList.remove('hidden');
    
    // Scroll suave hacia la sección de confirmación
    seccionConfirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Ingresar como participante usando el PIN
function ingresarComoParticipante(): void {
  if (eventoData && eventoData.pin) {
    // Redirigir a la página principal con el PIN en la URL
    window.location.href = `/?pin=${eventoData.pin as string}`;
  }
}

// Cerrar la sección de confirmación
function cerrarConfirmacion(): void {
  const seccionConfirmacion = document.getElementById('seccionConfirmacion');
  if (seccionConfirmacion) {
    seccionConfirmacion.classList.add('hidden');
  }
}

// Mostrar mensajes
function mostrarMensajeEtiquetas(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info'): void {
  if (!msgEtiquetas) return;
  msgEtiquetas.textContent = mensaje;
  msgEtiquetas.className = 'text-sm';
  if (tipo === 'error') msgEtiquetas.classList.add('text-red-600');
  else if (tipo === 'success') msgEtiquetas.classList.add('text-green-600');
  else msgEtiquetas.classList.add('text-gray-600');
}

function mostrarMensajeNaipes(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info'): void {
  if (!msgNaipes) return;
  msgNaipes.textContent = mensaje;
  msgNaipes.className = 'text-sm';
  if (tipo === 'error') msgNaipes.classList.add('text-red-600');
  else if (tipo === 'success') msgNaipes.classList.add('text-green-600');
  else msgNaipes.classList.add('text-gray-600');
}

function mostrarMensajeGuardar(mensaje: string, tipo: 'info' | 'error' | 'success' = 'info'): void {
  if (!msgGuardarConfig) return;
  msgGuardarConfig.textContent = mensaje;
  msgGuardarConfig.className = 'text-sm';
  if (tipo === 'error') msgGuardarConfig.classList.add('text-red-600');
  else if (tipo === 'success') msgGuardarConfig.classList.add('text-green-600');
  else msgGuardarConfig.classList.add('text-gray-600');
}

// Event listeners
btnAgregarParticipante?.addEventListener('click', agregarParticipante);
btnAgregarEtiqueta?.addEventListener('click', agregarEtiqueta);
btnAgregarNaipe?.addEventListener('click', agregarNaipe);
btnSugerirNaipes?.addEventListener('click', sugerirNaipes);
btnGuardarConfig?.addEventListener('click', guardarConfiguracion);
btnFinalizar?.addEventListener('click', finalizarConfiguracion);

// Event listeners para la sección de confirmación
const btnIngresarComoParticipante = document.getElementById('btnIngresarComoParticipante');
const btnCerrarConfirmacion = document.getElementById('btnCerrarConfirmacion');

btnIngresarComoParticipante?.addEventListener('click', ingresarComoParticipante);
btnCerrarConfirmacion?.addEventListener('click', cerrarConfirmacion);

// Permitir Enter en inputs
partNombreInput?.addEventListener('keypress', (e: KeyboardEvent) => {
  if (e.key === 'Enter') agregarParticipante();
});

etqNombreInput?.addEventListener('keypress', (e: KeyboardEvent) => {
  if (e.key === 'Enter') agregarEtiqueta();
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);

