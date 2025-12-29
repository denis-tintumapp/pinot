/**
 * Módulo para selección de alias después de confirmar PIN
 */

import { buscarEventoPorPIN } from '../firestore';

interface Participante {
  id: string;
  nombre: string;
}

// Estado
let eventoId: string | null = null;
let participantesDisponibles: Participante[] = [];
let aliasSeleccionado: Participante | null = null;

// Elementos del DOM
const loadingAlias = document.getElementById('loadingAlias') as HTMLElement | null;
const aliasContainer = document.getElementById('aliasContainer') as HTMLElement | null;
const aliasList = document.getElementById('aliasList') as HTMLElement | null;
const noAliasMessage = document.getElementById('noAliasMessage') as HTMLElement | null;
const errorMessage = document.getElementById('errorMessage') as HTMLElement | null;
const btnContinuar = document.getElementById('btnContinuar') as HTMLButtonElement | null;
const eventoNombre = document.getElementById('eventoNombre') as HTMLElement | null;

// Obtener PIN de la URL
const urlParams = new URLSearchParams(window.location.search);
const pin = urlParams.get('pin');
const eventoIdParam = urlParams.get('eventoId');

/**
 * Inicializar página
 */
async function inicializar(): Promise<void> {
  if (!pin && !eventoIdParam) {
    mostrarError('No se especificó un PIN o ID de evento');
    return;
  }

  try {
    // Si hay eventoId, usarlo directamente
    if (eventoIdParam) {
      eventoId = eventoIdParam;
      await cargarParticipantes();
    } else if (pin) {
      // Buscar evento por PIN
      const resultado = await buscarEventoPorPIN(pin);
      if (!resultado.ok) {
        mostrarError('El evento no está disponible');
        return;
      }
      eventoId = resultado.data?.id || '';
      if (!eventoId) {
        mostrarError('El evento no tiene un ID válido');
        return;
      }
      await cargarParticipantes();
    }
  } catch (error: unknown) {
    console.error('[Event Alias] Error:', error);
    mostrarError('Error al cargar el evento');
  }
}

/**
 * Cargar participantes disponibles
 */
async function cargarParticipantes(): Promise<void> {
  try {
    const { getDoc, doc, collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../core/firebase-init');
    
    // Cargar evento
    const eventoRef = doc(db, 'eventos', eventoId!);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      mostrarError('El evento no existe');
      return;
    }
    
    const eventoData = eventoSnap.data();
    if (eventoNombre) {
      eventoNombre.textContent = eventoData.nombre || 'Evento';
    }
    
    // Cargar participantes del evento
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('eventoId', '==', eventoId));
    const participantesSnap = await getDocs(q);
    
    participantesDisponibles = [];
    participantesSnap.forEach((doc) => {
      participantesDisponibles.push({
        id: doc.id,
        nombre: doc.data().nombre
      });
    });
    
    // Cargar participantes ocupados
    const sesionesRef = collection(db, 'sesiones');
    const qSesiones = query(sesionesRef, where('eventoId', '==', eventoId));
    const sesionesSnap = await getDocs(qSesiones);
    
    const nombresOcupados = new Set<string>();
    sesionesSnap.forEach((doc) => {
      const nombre = doc.data().nombreParticipante;
      if (nombre) nombresOcupados.add(nombre);
    });
    
    // Filtrar participantes disponibles
    const disponibles = participantesDisponibles.filter(p => !nombresOcupados.has(p.nombre));
    
    mostrarAlias(disponibles);
  } catch (error: unknown) {
    console.error('[Event Alias] Error al cargar participantes:', error);
    mostrarError('Error al cargar participantes');
  }
}

/**
 * Mostrar alias disponibles
 */
function mostrarAlias(aliasDisponibles: Participante[]): void {
  if (loadingAlias) loadingAlias.classList.add('hidden');
  if (aliasContainer) aliasContainer.classList.remove('hidden');
  
  if (!aliasList) return;
  
  aliasList.innerHTML = '';
  
  if (aliasDisponibles.length === 0) {
    if (noAliasMessage) noAliasMessage.classList.remove('hidden');
    return;
  }
  
  if (noAliasMessage) noAliasMessage.classList.add('hidden');
  
  aliasDisponibles.forEach((alias) => {
    const card = document.createElement('div');
    card.className = 'alias-card bg-white/20 border-2 border-white/30 rounded-lg p-4 cursor-pointer';
    card.innerHTML = `
      <p class="text-white font-semibold text-lg">${alias.nombre}</p>
    `;
    
    card.addEventListener('click', () => {
      seleccionarAlias(alias, card);
    });
    
    aliasList.appendChild(card);
  });
}

/**
 * Seleccionar alias
 */
function seleccionarAlias(alias: Participante, cardElement: HTMLElement): void {
  // Deseleccionar anterior
  document.querySelectorAll('.alias-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Seleccionar nuevo
  cardElement.classList.add('selected');
  aliasSeleccionado = alias;
  
  if (btnContinuar) {
    btnContinuar.disabled = false;
  }
}

/**
 * Continuar con alias seleccionado
 */
async function continuar(): Promise<void> {
  if (!aliasSeleccionado || !eventoId) {
    mostrarError('Por favor, selecciona un alias');
    return;
  }
  
  try {
    // Guardar sesión y redirigir a participación
    const url = `/?eventoId=${eventoId}&alias=${encodeURIComponent(aliasSeleccionado.nombre)}`;
    window.location.href = url;
  } catch (error: unknown) {
    console.error('[Event Alias] Error al continuar:', error);
    mostrarError('Error al continuar');
  }
}

/**
 * Mostrar error
 */
function mostrarError(mensaje: string): void {
  if (loadingAlias) loadingAlias.classList.add('hidden');
  if (aliasContainer) aliasContainer.classList.remove('hidden');
  if (errorMessage) {
    errorMessage.textContent = mensaje;
    errorMessage.classList.remove('hidden');
  }
}

// Event listeners
if (btnContinuar) {
  btnContinuar.addEventListener('click', continuar);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

