/**
 * Módulo para resolver y finalizar eventos
 */


import { getDoc, doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../core/firebase-init';
import { requireAuth } from '../auth/auth-guard';

interface Votacion {
  participante: string;
  selecciones: Record<string, string>;
  calificaciones: Record<string, number>;
}

interface Solucion {
  [etiquetaId: string]: string;
}

// Firebase ya está inicializado en firebase-init

// Estado
let eventoId: string | null = null;
let eventoData: Record<string, unknown> | null = null;
let usuarioActual: { uid: string } | null = null;

// Elementos del DOM
const eventoNombreHeader = document.getElementById('eventoNombreHeader') as HTMLElement | null;
const eventoPIN = document.getElementById('eventoPIN') as HTMLElement | null;
const eventoParticipantes = document.getElementById('eventoParticipantes') as HTMLElement | null;
const eventoEstado = document.getElementById('eventoEstado') as HTMLElement | null;
const btnFinalizarEvento = document.getElementById('btnFinalizarEvento') as HTMLButtonElement | null;
const resumenLoading = document.getElementById('resumenLoading') as HTMLElement | null;
const resumenVotaciones = document.getElementById('resumenVotaciones') as HTMLElement | null;

/**
 * Inicializar página
 */
async function inicializar(): Promise<void> {
  // Verificar autenticación
  try {
    usuarioActual = await requireAuth();
    if (!usuarioActual) {
      window.location.href = '/';
      return;
    }
  } catch (error: unknown) {
    console.error('[Event Solve] Error de autenticación:', error);
    window.location.href = '/';
    return;
  }

  // Obtener eventoId de la URL
  const urlParams = new URLSearchParams(window.location.search);
  eventoId = urlParams.get('eventoId');

  if (!eventoId) {
    alert('No se especificó un evento');
    window.location.href = '/';
    return;
  }

  await cargarEvento();
  await cargarResumenVotaciones();
}

/**
 * Cargar datos del evento
 */
async function cargarEvento(): Promise<void> {
  if (!eventoId) return;
  try {
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);

    if (!eventoSnap.exists()) {
      alert('El evento no existe');
      window.location.href = '/';
      return;
    }

    eventoData = eventoSnap.data();

    // Verificar que el usuario es el creador
    if (usuarioActual && eventoData.anfitrionId !== usuarioActual.uid) {
      alert('No tienes permiso para resolver este evento');
      window.location.href = '/';
      return;
    }

    // Actualizar UI
    if (eventoNombreHeader) eventoNombreHeader.textContent = (eventoData.nombre as string) || 'Evento';
    if (eventoPIN) eventoPIN.textContent = (eventoData.pin as string) || 'N/A';
    if (eventoEstado) {
      eventoEstado.innerHTML = eventoData.estado === 'finalizado' 
        ? '<span class="badge badge-success">Finalizado</span>'
        : '<span class="badge badge-info">Activo</span>';
    }

    // Contar participantes
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('eventoId', '==', eventoId));
    const participantesSnap = await getDocs(q);
    if (eventoParticipantes) eventoParticipantes.textContent = participantesSnap.size;

    // Habilitar botón si el evento está activo
    if (btnFinalizarEvento && eventoData.estado !== 'finalizado') {
      btnFinalizarEvento.disabled = false;
    }
  } catch (error: unknown) {
    console.error('[Event Solve] Error al cargar evento:', error);
    alert('Error al cargar el evento');
  }
}

/**
 * Cargar resumen de votaciones
 */
async function cargarResumenVotaciones(): Promise<void> {
  if (!eventoId) return;
  try {
    if (resumenLoading) resumenLoading.classList.remove('hidden');
    if (resumenVotaciones) resumenVotaciones.classList.add('hidden');

    // Cargar sesiones de participantes
    const sesionesRef = collection(db, 'sesiones');
    const q = query(sesionesRef, where('eventoId', '==', eventoId));
    const sesionesSnap = await getDocs(q);

    const votaciones: Votacion[] = [];
    sesionesSnap.forEach((doc) => {
      const data = doc.data();
      votaciones.push({
        participante: data.nombreParticipante as string || '',
        selecciones: (data.seleccionesNaipes as Record<string, string>) || {},
        calificaciones: (data.calificacionesEtiquetas as Record<string, number>) || {}
      });
    });

    mostrarResumen(votaciones);

    if (resumenLoading) resumenLoading.classList.add('hidden');
    if (resumenVotaciones) resumenVotaciones.classList.remove('hidden');
  } catch (error: unknown) {
    console.error('[Event Solve] Error al cargar resumen:', error);
    if (resumenLoading) resumenLoading.classList.add('hidden');
  }
}

/**
 * Mostrar resumen de votaciones
 */
function mostrarResumen(votaciones: Votacion[]): void {
  const contenedorResumen = document.getElementById('contenedorResumen');
  if (!contenedorResumen) return;

  contenedorResumen.innerHTML = '';

  if (votaciones.length === 0) {
    contenedorResumen.innerHTML = '<p class="text-gray-600">No hay votaciones aún.</p>';
    return;
  }

  votaciones.forEach((votacion, index) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 rounded-lg p-4';
    div.innerHTML = `
      <h4 class="font-semibold mb-2">${votacion.participante}</h4>
      <p class="text-sm text-gray-600">${Object.keys(votacion.selecciones).length} selecciones</p>
    `;
    contenedorResumen.appendChild(div);
  });
}

/**
 * Finalizar evento
 */
async function finalizarEvento(): Promise<void> {
  if (!eventoId || !eventoData) return;

  const confirmacion = confirm('¿Estás seguro de que deseas finalizar este evento? Esta acción no se puede deshacer.');
  if (!confirmacion) return;

  try {
    if (btnFinalizarEvento) btnFinalizarEvento.disabled = true;
    if (btnFinalizarEvento) btnFinalizarEvento.textContent = 'Finalizando...';

    // Calcular solución basada en votaciones
    const solucion = await calcularSolucion();

    // Actualizar evento
    const eventoRef = doc(db, 'eventos', eventoId);
    await updateDoc(eventoRef, {
      estado: 'finalizado',
      finalizadoEn: new Date(),
      solucion: solucion
    });

    alert('Evento finalizado exitosamente');
    window.location.href = `/resultados?eventoId=${eventoId}`;
  } catch (error: unknown) {
    console.error('[Event Solve] Error al finalizar evento:', error);
    alert('Error al finalizar el evento');
    if (btnFinalizarEvento) btnFinalizarEvento.disabled = false;
    if (btnFinalizarEvento) btnFinalizarEvento.textContent = 'Finalizar Evento';
  }
}

/**
 * Calcular solución basada en votaciones
 */
async function calcularSolucion(): Promise<Solucion> {
  if (!eventoId) return {};
  // Cargar todas las votaciones
  const sesionesRef = collection(db, 'sesiones');
  const q = query(sesionesRef, where('eventoId', '==', eventoId));
  const sesionesSnap = await getDocs(q);

  const votos: Record<string, Record<string, number>> = {};
  sesionesSnap.forEach((doc) => {
    const selecciones = (doc.data().seleccionesNaipes as Record<string, string>) || {};
    Object.keys(selecciones).forEach(etiquetaId => {
      const naipeId = selecciones[etiquetaId];
      if (!votos[etiquetaId]) votos[etiquetaId] = {};
      if (!votos[etiquetaId][naipeId]) votos[etiquetaId][naipeId] = 0;
      votos[etiquetaId][naipeId]++;
    });
  });

  // Calcular solución (naipe más votado para cada etiqueta)
  const solucion: Solucion = {};
  Object.keys(votos).forEach(etiquetaId => {
    const naipeVotos = votos[etiquetaId];
    const naipeGanador = Object.keys(naipeVotos).reduce((a, b) => 
      naipeVotos[a] > naipeVotos[b] ? a : b
    );
    solucion[etiquetaId] = naipeGanador;
  });

  return solucion;
}

// Event listeners
if (btnFinalizarEvento) {
  btnFinalizarEvento.addEventListener('click', finalizarEvento);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

