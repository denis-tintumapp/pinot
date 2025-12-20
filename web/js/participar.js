/**
 * Módulo para la página de participación pública
 * Cada participante tiene su propia sesión privada
 */

import { 
  getDoc, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { firebaseConfig } from './core/firebase-config.js';
import { NAIPES_TRUCO } from './constantes.js';
import { escucharTimerEvento } from './firestore.js';

// Función para obtener la URL de la imagen del naipe
function obtenerImagenNaipe(naipeId) {
  // Mapeo de IDs de naipes a nombres de archivo de imágenes
  // Formato: número-palo (ej: "1-espadas" -> "1-espadas.png")
  // Las imágenes deben estar en /images/naipes/
  const nombreArchivo = `${naipeId}.png`;
  const rutaImagen = `/images/naipes/${nombreArchivo}`;
  
  // Intentar cargar la imagen, si falla usar SVG como fallback
  return rutaImagen;
}

// Función para generar SVG de naipe como fallback (si la imagen no está disponible)
function generarSVGNaipe(naipeId) {
  const [numero, palo] = naipeId.split('-');
  
  // Convertir número a formato de baraja española
  let numeroTexto = numero;
  if (numero === '1') numeroTexto = 'A';  // As
  else if (numero === '10') numeroTexto = 'S';  // Sota
  else if (numero === '11') numeroTexto = 'C';  // Caballo
  else if (numero === '12') numeroTexto = 'R';  // Rey
  // Los números 2-9 se mantienen igual
  
  // Palos de la baraja española con símbolos SVG correctos
  const palosInfo = {
    'espadas': { 
      color: '#000000', 
      simbolo: 'E',
      nombre: 'Espadas',
      svgPath: 'M 40 15 L 35 25 L 30 30 L 30 50 L 35 55 L 40 60 L 45 55 L 50 50 L 50 30 L 45 25 Z M 40 60 L 40 75 L 35 80 L 40 85 L 45 80 L 40 75 Z'
    },
    'bastos': { 
      color: '#000000', 
      simbolo: 'B',
      nombre: 'Bastos',
      svgPath: 'M 40 10 L 42 12 L 42 30 L 40 32 L 38 30 L 38 12 Z M 40 32 L 42 34 L 42 52 L 40 54 L 38 52 L 38 34 Z M 40 54 L 42 56 L 42 74 L 40 76 L 38 74 L 38 56 Z M 40 76 L 42 78 L 42 85 L 40 87 L 38 85 L 38 78 Z'
    },
    'copas': { 
      color: '#DC143C', 
      simbolo: 'C',
      nombre: 'Copas',
      svgPath: 'M 40 20 L 32 28 L 32 50 L 30 52 L 30 60 L 50 60 L 50 52 L 48 50 L 48 28 Z M 25 60 L 55 60 L 55 65 L 50 70 L 30 70 L 25 65 Z M 35 70 L 35 75 L 30 80 L 50 80 L 45 75 L 45 70 Z'
    },
    'oros': { 
      color: '#DC143C', 
      simbolo: 'O',
      nombre: 'Oros',
      svgPath: 'M 40 20 A 20 20 0 1 1 40 80 A 20 20 0 1 1 40 20 Z M 40 30 A 10 10 0 1 0 40 70 A 10 10 0 1 0 40 30 Z M 40 35 L 35 40 L 40 45 L 45 40 Z M 40 55 L 35 60 L 40 65 L 45 60 Z'
    }
  };
  
  const info = palosInfo[palo] || { color: '#000000', simbolo: '?', nombre: 'Desconocido', svgPath: '' };
  
  // Generar SVG inline como fallback
  const svg = `
    <svg width="80" height="112" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="112" fill="white" stroke="#333" stroke-width="2" rx="6"/>
      <text x="12" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
            fill="${info.color}">${numeroTexto}</text>
      <g transform="translate(12, 35) scale(0.4)">
        <path d="${info.svgPath}" fill="${info.color}"/>
      </g>
      <g transform="translate(40, 56) scale(1.2)">
        <path d="${info.svgPath}" fill="${info.color}" transform="translate(-40, -50)"/>
      </g>
      <text x="68" y="90" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
            text-anchor="middle" fill="${info.color}" transform="rotate(180 68 90)">${numeroTexto}</text>
      <g transform="translate(68, 74) rotate(180) scale(0.4)">
        <path d="${info.svgPath}" fill="${info.color}" transform="translate(-40, -50)"/>
      </g>
    </svg>
  `.trim();
  
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Helper para detectar si estamos en un dispositivo móvil
function esDispositivoMovil() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}

// Variables globales para auto-scroll durante drag & drop
let autoScrollInterval = null;
let isAutoScrolling = false;
let currentClientY = 0;
let dragoverListenerAgregado = false;

// Helper para auto-scroll durante drag & drop
// Detecta cuando el cursor/dedo está cerca de los bordes y hace scroll automático
function iniciarAutoScroll(clientY) {
  // Actualizar la posición actual
  currentClientY = clientY;
  
  // Si ya hay un intervalo activo, solo actualizar la posición
  if (isAutoScrolling) return;
  
  isAutoScrolling = true;
  const SCROLL_ZONE = 100; // Zona de activación en píxeles desde el borde
  const MAX_SCROLL_SPEED = 20; // Velocidad máxima de scroll en píxeles por frame
  const SCROLL_THRESHOLD = 50; // Distancia desde el borde donde el scroll es máximo
  
  const scroll = () => {
    if (!isAutoScrolling) {
      if (autoScrollInterval) {
        cancelAnimationFrame(autoScrollInterval);
        autoScrollInterval = null;
      }
      return;
    }
    
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const maxScroll = scrollHeight - viewportHeight;
    
    // Solo hacer scroll si hay contenido para hacer scroll
    if (maxScroll <= 0) {
      detenerAutoScroll();
      return;
    }
    
    let scrollDelta = 0;
    
    // Verificar si está cerca del borde superior
    if (currentClientY < SCROLL_ZONE && scrollTop > 0) {
      const distanciaDesdeBorde = currentClientY;
      const factor = Math.max(0, 1 - (distanciaDesdeBorde / SCROLL_THRESHOLD));
      scrollDelta = -MAX_SCROLL_SPEED * factor;
    }
    // Verificar si está cerca del borde inferior
    else if (currentClientY > viewportHeight - SCROLL_ZONE && scrollTop < maxScroll) {
      const distanciaDesdeBorde = viewportHeight - currentClientY;
      const factor = Math.max(0, 1 - (distanciaDesdeBorde / SCROLL_THRESHOLD));
      scrollDelta = MAX_SCROLL_SPEED * factor;
    }
    
    // Aplicar scroll si hay movimiento
    if (scrollDelta !== 0) {
      window.scrollBy(0, scrollDelta);
      // Continuar el scroll en el siguiente frame
      autoScrollInterval = requestAnimationFrame(scroll);
    } else {
      detenerAutoScroll();
      return;
    }
  };
  
  // Iniciar el scroll
  autoScrollInterval = requestAnimationFrame(scroll);
}

// Actualizar posición del cursor/dedo durante el drag
function actualizarPosicionAutoScroll(clientY) {
  currentClientY = clientY;
  // Si no está activo el auto-scroll pero debería estarlo, iniciarlo
  if (!isAutoScrolling) {
    iniciarAutoScroll(clientY);
  }
}

// Detener auto-scroll
function detenerAutoScroll() {
  isAutoScrolling = false;
  if (autoScrollInterval) {
    cancelAnimationFrame(autoScrollInterval);
    autoScrollInterval = null;
  }
}

// Helper para drag & drop con soporte táctil móvil
// Configura eventos de drag & drop nativos (desktop) y eventos táctiles (móvil)
function configurarDragAndDrop(elemento, opciones) {
  const {
    onDragStart,      // Callback cuando comienza el arrastre
    onDragEnd,        // Callback cuando termina el arrastre
    getDragData,      // Función que retorna los datos a transferir
    tipoDrag          // Tipo de drag: 'naipe' o 'etiqueta-reorder'
  } = opciones;
  
  let touchStartX = 0;
  let touchStartY = 0;
  let touchElement = null;
  let touchOffsetX = 0;
  let touchOffsetY = 0;
  let isDragging = false;
  let dragGhost = null;
  
  // Agregar listener global de dragover para auto-scroll solo una vez
  if (!dragoverListenerAgregado) {
    document.addEventListener('dragover', (e) => {
      if (esDispositivoMovil()) return;
      // Actualizar posición y auto-scroll si hay un elemento siendo arrastrado
      if (e.dataTransfer && e.dataTransfer.effectAllowed === 'move') {
        actualizarPosicionAutoScroll(e.clientY);
      }
    }, { passive: true });
    dragoverListenerAgregado = true;
  }
  
  // Eventos nativos de drag & drop (para desktop)
  elemento.addEventListener('dragstart', (e) => {
    if (esDispositivoMovil()) {
      e.preventDefault();
      return;
    }
    
    const data = getDragData();
    if (tipoDrag === 'etiqueta-reorder') {
      e.dataTransfer.setData('tipo-drag', 'etiqueta-reorder');
      e.dataTransfer.setData('etiqueta-id', data);
    } else {
      e.dataTransfer.setData('text/plain', data);
    }
    e.dataTransfer.effectAllowed = 'move';
    
    if (onDragStart) onDragStart(e);
  });
  
  elemento.addEventListener('dragend', (e) => {
    if (esDispositivoMovil()) return;
    detenerAutoScroll();
    if (onDragEnd) onDragEnd(e);
  });
  
  // Eventos táctiles (para móvil)
  elemento.addEventListener('touchstart', (e) => {
    if (!esDispositivoMovil()) return;
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchElement = elemento;
    
    const rect = elemento.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;
    
    isDragging = false;
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  
  elemento.addEventListener('touchmove', (e) => {
    if (!esDispositivoMovil() || !touchElement) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Si el movimiento es significativo, iniciar el arrastre
    if (!isDragging && (deltaX > 10 || deltaY > 10)) {
      isDragging = true;
      
      // Crear elemento fantasma para seguir el dedo
      dragGhost = elemento.cloneNode(true);
      dragGhost.style.position = 'fixed';
      dragGhost.style.pointerEvents = 'none';
      dragGhost.style.opacity = '0.8';
      dragGhost.style.zIndex = '10000';
      dragGhost.style.transform = 'scale(1.1)';
      dragGhost.style.transition = 'none';
      dragGhost.style.width = elemento.offsetWidth + 'px';
      dragGhost.style.height = elemento.offsetHeight + 'px';
      document.body.appendChild(dragGhost);
      
      // Reducir opacidad del elemento original
      elemento.style.opacity = '0.4';
      
      if (onDragStart) {
        const fakeEvent = { target: elemento, dataTransfer: { getData: () => getDragData() } };
        onDragStart(fakeEvent);
      }
    }
    
    if (isDragging && dragGhost) {
      const left = touch.clientX - touchOffsetX;
      const top = touch.clientY - touchOffsetY;
      dragGhost.style.left = left + 'px';
      dragGhost.style.top = top + 'px';
      
      // Auto-scroll si está cerca de los bordes (móvil)
      actualizarPosicionAutoScroll(touch.clientY);
      
      // Ocultar temporalmente el dragGhost para poder detectar elementos debajo
      const ghostWasVisible = dragGhost.style.display !== 'none';
      if (ghostWasVisible) {
        dragGhost.style.display = 'none';
      }
      
      // Encontrar el elemento sobre el que estamos arrastrando
      let elementBelow = null;
      try {
        elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      } catch (err) {
        console.warn('Error en elementFromPoint:', err);
      }
      
      // Restaurar visibilidad del dragGhost
      if (ghostWasVisible) {
        dragGhost.style.display = '';
      }
      
      // Buscar elemento droppable
      let droppable = null;
      if (elementBelow) {
        // Intentar encontrar el droppable más cercano
        droppable = elementBelow.closest('.droppable');
        if (!droppable) {
          // Si no encontramos directamente, buscar en los padres
          let parent = elementBelow.parentElement;
          while (parent && !droppable && parent !== document.body) {
            if (parent.classList && parent.classList.contains('droppable')) {
              droppable = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      
      // Si no encontramos por elementFromPoint, buscar por posición
      if (!droppable) {
        const allDroppables = document.querySelectorAll('.droppable');
        for (const drop of allDroppables) {
          if (drop === elemento) continue;
          const rect = drop.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            droppable = drop;
            break;
          }
        }
      }
      
      // Actualizar clases drag-over
      document.querySelectorAll('.droppable.drag-over').forEach(el => {
        if (el !== droppable) {
          el.classList.remove('drag-over');
        }
      });
      
      if (droppable && droppable !== elemento) {
        droppable.classList.add('drag-over');
      }
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  
  elemento.addEventListener('touchend', (e) => {
    if (!esDispositivoMovil() || !touchElement) return;
    
    // Detener auto-scroll
    detenerAutoScroll();
    
    if (isDragging && dragGhost) {
      const touch = e.changedTouches[0];
      
      // Ocultar temporalmente el dragGhost para detectar elemento debajo
      const ghostWasVisible = dragGhost.style.display !== 'none';
      if (ghostWasVisible) {
        dragGhost.style.display = 'none';
      }
      
      // Encontrar elemento debajo
      let elementBelow = null;
      try {
        elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      } catch (err) {
        console.warn('Error en elementFromPoint (touchend):', err);
      }
      
      // Restaurar visibilidad
      if (ghostWasVisible) {
        dragGhost.style.display = '';
      }
      
      // Buscar elemento droppable
      let droppable = null;
      if (elementBelow) {
        droppable = elementBelow.closest('.droppable');
        if (!droppable) {
          let parent = elementBelow.parentElement;
          while (parent && !droppable && parent !== document.body) {
            if (parent.classList && parent.classList.contains('droppable')) {
              droppable = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      
      // Si no encontramos por elementFromPoint, buscar por posición
      if (!droppable) {
        const allDroppables = document.querySelectorAll('.droppable');
        for (const drop of allDroppables) {
          if (drop === elemento) continue;
          const rect = drop.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            droppable = drop;
            break;
          }
        }
      }
      
      // Si encontramos un droppable válido, disparar el evento drop
      if (droppable && droppable !== elemento) {
        // Disparar evento drop personalizado
        const dropEvent = new CustomEvent('touchdrop', {
          detail: {
            tipoDrag: tipoDrag === 'etiqueta-reorder' ? 'etiqueta-reorder' : 'naipe',
            data: getDragData(),
            target: droppable
          },
          bubbles: true,
          cancelable: true
        });
        droppable.dispatchEvent(dropEvent);
      }
      
      // Limpiar
      if (dragGhost && document.body.contains(dragGhost)) {
        document.body.removeChild(dragGhost);
      }
      dragGhost = null;
      
      // Remover drag-over de todos los elementos
      document.querySelectorAll('.droppable.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      elemento.style.opacity = '';
      
      if (onDragEnd) {
        const fakeEvent = { target: elemento };
        onDragEnd(fakeEvent);
      }
    }
    
    touchElement = null;
    isDragging = false;
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  
  elemento.addEventListener('touchcancel', (e) => {
    if (!esDispositivoMovil()) return;
    
    // Detener auto-scroll
    detenerAutoScroll();
    
    if (dragGhost && document.body.contains(dragGhost)) {
      document.body.removeChild(dragGhost);
    }
    dragGhost = null;
    touchElement = null;
    isDragging = false;
    elemento.style.opacity = '';
    
    document.querySelectorAll('.droppable.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
}

// Helper para configurar zona de drop con soporte táctil
function configurarZonaDrop(elemento, opciones) {
  const {
    onDragOver,       // Callback cuando se arrastra sobre la zona
    onDragLeave,      // Callback cuando se sale de la zona
    onDrop            // Callback cuando se suelta en la zona
  } = opciones;
  
  // Eventos nativos (desktop)
  elemento.addEventListener('dragover', (e) => {
    if (esDispositivoMovil()) return;
    e.preventDefault();
    if (onDragOver) onDragOver(e);
  });
  
  elemento.addEventListener('dragleave', (e) => {
    if (esDispositivoMovil()) return;
    if (onDragLeave) onDragLeave(e);
  });
  
  elemento.addEventListener('drop', (e) => {
    if (esDispositivoMovil()) return;
    e.preventDefault();
    if (onDrop) onDrop(e);
  });
  
  // Evento personalizado para touch (móvil)
  elemento.addEventListener('touchdrop', (e) => {
    if (!esDispositivoMovil()) return;
    const { tipoDrag, data, target } = e.detail;
    
    const fakeEvent = {
      preventDefault: () => {},
      dataTransfer: {
        getData: (type) => {
          if (type === 'tipo-drag') return tipoDrag;
          if (type === 'etiqueta-id') return tipoDrag === 'etiqueta-reorder' ? data : '';
          return data;
        }
      },
      target: target
    };
    
    if (onDrop) onDrop(fakeEvent);
  });
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado de la sesión
let sesionId = null;
let eventoId = null;
let nombreParticipante = '';
let eventoData = null;
let participantesDisponibles = []; // Lista de participantes del Admin
let nombresOcupados = new Set(); // Nombres ya seleccionados por otros participantes
let etiquetasDisponibles = [];
let naipesDisponibles = [];
let seleccionesEtiquetas = {}; // { etiquetaId: etiquetaNombre }
let seleccionesNaipes = {}; // { etiquetaId: naipeId } o { etiquetaId: { naipeId, timestamp } } para nuevas asignaciones
let seleccionesNaipesTimestamps = {}; // { etiquetaId: timestamp } - timestamps de cuando se asignó cada naipe
let ordenEtiquetas = []; // Array de etiquetaId en orden de preferencia (ranking)
let calificacionesEtiquetas = {}; // { etiquetaId: calificacion (1-5) }
let pasoActual = 1; // 1: nombre, 2: etiquetas, 3: naipes, 4: ranking
let timerExpiraEn = null; // Timestamp en milisegundos cuando expira el timer
let timerInterval = null; // Interval para actualizar el timer
let timerVotacionInterval = null; // Interval para actualizar el timer de votación
let timerVotacionUnsubscribe = null; // Función para cancelar la suscripción del timer de votación
let cambiosPermitidos = true; // Si se pueden hacer cambios de nombre
let verificacionResultadosInterval = null; // Interval para verificar si resultados fueron revelados

// Obtener PIN o eventoId de la URL (si existe, para auto-rellenar)
const urlParams = new URLSearchParams(window.location.search);
const pinFromURL = urlParams.get('pin');
const eventoIdFromURL = urlParams.get('evento');

// Claves para localStorage
const STORAGE_KEY_ULTIMO_EVENTO = 'ultimo_evento_id';
const STORAGE_KEY_ULTIMO_PIN = 'ultimo_pin';
const STORAGE_KEY_SESIONES_ACTIVAS = 'sesiones_activas'; // Array de {eventoId, pin, timestamp}

// Función para obtener sesiones activas desde localStorage
function obtenerSesionesActivas() {
  try {
    const sesionesStr = localStorage.getItem(STORAGE_KEY_SESIONES_ACTIVAS);
    if (!sesionesStr) return [];
    return JSON.parse(sesionesStr);
  } catch (error) {
    console.error('Error al obtener sesiones activas:', error);
    return [];
  }
}

// Función para guardar sesión activa
function guardarSesionActiva(eventoId, pin) {
  try {
    const sesiones = obtenerSesionesActivas();
    
    // Remover sesión existente con el mismo eventoId si existe
    const sesionesFiltradas = sesiones.filter(s => s.eventoId !== eventoId);
    
    // Agregar nueva sesión al inicio (más reciente primero)
    sesionesFiltradas.unshift({
      eventoId,
      pin,
      timestamp: Date.now()
    });
    
    // Mantener solo las últimas 10 sesiones
    const sesionesLimitadas = sesionesFiltradas.slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY_SESIONES_ACTIVAS, JSON.stringify(sesionesLimitadas));
    localStorage.setItem(STORAGE_KEY_ULTIMO_EVENTO, eventoId);
    localStorage.setItem(STORAGE_KEY_ULTIMO_PIN, pin);
  } catch (error) {
    console.error('Error al guardar sesión activa:', error);
  }
}

// Función para mostrar pantalla de bienvenida
function mostrarPantallaBienvenida() {
  const splashScreen = document.getElementById('splashScreen');
  const mainContent = document.getElementById('mainContent');
  
  if (splashScreen) splashScreen.classList.remove('hidden');
  if (mainContent) mainContent.classList.add('hidden');
  
  // Configurar evento del botón ingresar
  const btnIngresar = document.getElementById('btnIngresar');
  const pinInput = document.getElementById('pinInput');
  
  // Restablecer botón Ingresar a su estado normal
  if (btnIngresar) {
    btnIngresar.disabled = false;
    btnIngresar.textContent = 'Ingresar';
    btnIngresar.onclick = async () => {
      await ingresarConPIN();
    };
  }
  
  // Prioridad 1: Si hay PIN en la URL, autocompletarlo e ingresar automáticamente
  if (pinFromURL && pinInput) {
    pinInput.value = pinFromURL;
    // Ingresar automáticamente después de un breve delay para que el DOM esté listo
    setTimeout(async () => {
      await ingresarConPIN();
    }, 300);
    return; // Salir temprano ya que vamos a ingresar automáticamente
  }
  
  // Prioridad 2: Verificar si hay múltiples sesiones activas para autocompletar PIN
  const sesionesActivas = obtenerSesionesActivas();
  if (sesionesActivas.length >= 2 && pinInput) {
    // Autocompletar con el PIN de la última sesión (la más reciente)
    const ultimaSesion = sesionesActivas[0];
    pinInput.value = ultimaSesion.pin || '';
  } else {
    // Si solo hay una sesión o ninguna, dejar el campo vacío
    if (pinInput) {
      pinInput.value = '';
    }
  }
  
  // Permitir ingresar con Enter
  if (pinInput) {
    pinInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await ingresarConPIN();
      }
    });
    
    // Focus automático en el input
    setTimeout(() => {
      pinInput.focus();
    }, 100);
  }
}

// Función para ocultar pantalla de bienvenida
function ocultarPantallaBienvenida() {
  const splashScreen = document.getElementById('splashScreen');
  const mainContent = document.getElementById('mainContent');
  
  // Limpiar el campo PIN antes de ocultar
  const pinInput = document.getElementById('pinInput');
  if (pinInput) {
    pinInput.value = '';
  }
  
  // Limpiar mensajes de error
  const pinError = document.getElementById('pinError');
  if (pinError) {
    pinError.classList.add('hidden');
    pinError.textContent = '';
  }
  
  if (splashScreen) splashScreen.classList.add('hidden');
  if (mainContent) mainContent.classList.remove('hidden');
}

// Función para verificar que el evento tenga los requisitos mínimos
async function verificarRequisitosEvento(eventoId) {
  try {
    // Contar participantes del evento
    const participantesRef = collection(db, 'participantes');
    const qParticipantes = query(participantesRef, where('eventoId', '==', eventoId));
    const participantesSnapshot = await getDocs(qParticipantes);
    
    const cantidadParticipantes = participantesSnapshot.size;
    
    // Contar etiquetas del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const qEtiquetas = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(qEtiquetas);
    
    // Contar etiquetas únicas (por etiquetaId)
    const etiquetasUnicas = new Set();
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      const etiquetaId = data.etiquetaId || '';
      if (etiquetaId) {
        etiquetasUnicas.add(etiquetaId);
      }
    });
    
    const cantidadEtiquetas = etiquetasUnicas.size;
    
    console.log('Verificación de requisitos:', {
      eventoId,
      participantes: cantidadParticipantes,
      etiquetas: cantidadEtiquetas
    });
    
    // Verificar que tenga al menos 2 participantes y 2 etiquetas
    return {
      ok: cantidadParticipantes >= 2 && cantidadEtiquetas >= 2,
      cantidadParticipantes,
      cantidadEtiquetas
    };
  } catch (error) {
    console.error('Error al verificar requisitos del evento:', error);
    return {
      ok: false,
      error: 'Error al verificar requisitos del evento'
    };
  }
}

// Función para ingresar con PIN
async function ingresarConPIN() {
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');
  const btnIngresar = document.getElementById('btnIngresar');
  
  if (!pinInput) return;
  
  const pin = pinInput.value.trim();
  
  // Validar que sea un número de 5 dígitos
  if (!pin) {
    if (pinError) {
      pinError.textContent = 'Por favor, ingresá un PIN';
      pinError.classList.remove('hidden');
      pinError.classList.remove('text-white');
      pinError.classList.add('text-red-500');
    }
    return;
  }
  
  if (!/^\d{5}$/.test(pin)) {
    if (pinError) {
      pinError.textContent = 'El PIN debe ser un número de 5 dígitos';
      pinError.classList.remove('hidden');
      pinError.classList.remove('text-white');
      pinError.classList.add('text-red-500');
    }
    return;
  }
  
  // Deshabilitar botón y mostrar loading
  if (btnIngresar) {
    btnIngresar.disabled = true;
    btnIngresar.textContent = 'Verificando...';
  }
  
  if (pinError) {
    pinError.classList.add('hidden');
  }
  
  try {
    // Importar función de búsqueda por PIN
    const { buscarEventoPorPIN } = await import('./firestore.js');
    
    // Buscar evento por PIN
    const resultado = await buscarEventoPorPIN(pin);
    
    if (!resultado.ok) {
      if (pinError) {
        // Mostrar mensaje de error en blanco cuando el evento no está disponible
        pinError.textContent = 'El evento no está disponible';
        pinError.classList.remove('hidden');
        pinError.classList.remove('text-red-500');
        pinError.classList.add('text-white');
      }
      if (btnIngresar) {
        btnIngresar.disabled = false;
        btnIngresar.textContent = 'Ingresar';
      }
      return;
    }
    
    // PIN válido y evento activo, establecer eventoId temporalmente para verificar requisitos
    const eventoIdTemp = resultado.data.id;
    
    // Verificar que el evento tenga los requisitos mínimos
    const verificacionRequisitos = await verificarRequisitosEvento(eventoIdTemp);
    
    if (!verificacionRequisitos.ok) {
      if (pinError) {
        pinError.textContent = 'El evento no está disponible';
        pinError.classList.remove('hidden');
        pinError.classList.remove('text-red-500');
        pinError.classList.add('text-white');
      }
      if (btnIngresar) {
        btnIngresar.disabled = false;
        btnIngresar.textContent = 'Ingresar';
      }
      return;
    }
    
    // Requisitos cumplidos, establecer eventoId
    eventoId = eventoIdTemp;
    
    console.log('Evento encontrado y validado:', {
      id: eventoId,
      nombre: resultado.data.nombre,
      activo: resultado.data.activo,
      participantes: verificacionRequisitos.cantidadParticipantes,
      etiquetas: verificacionRequisitos.cantidadEtiquetas
    });
    
    // Guardar sesión activa en localStorage
    guardarSesionActiva(eventoId, pin);
    
    // Actualizar URL sin recargar la página
    const nuevaURL = `/?evento=${eventoId}`;
    window.history.pushState({ eventoId }, '', nuevaURL);
    
    // Ocultar splash y mostrar contenido
    ocultarPantallaBienvenida();
    
    // Inicializar la aplicación
    inicializar();
    
  } catch (error) {
    console.error('Error al verificar PIN:', error);
    if (pinError) {
      pinError.textContent = 'El evento no está disponible';
      pinError.classList.remove('hidden');
      pinError.classList.remove('text-red-500');
      pinError.classList.add('text-white');
    }
    if (btnIngresar) {
      btnIngresar.disabled = false;
      btnIngresar.textContent = 'Ingresar';
    }
  }
}

// Inicializar sesión
function inicializarSesion() {
  // Generar o recuperar ID de sesión desde localStorage
  const storageKey = `sesion_${eventoId}`;
  sesionId = localStorage.getItem(storageKey);
  
  if (!sesionId) {
    // Generar nuevo ID de sesión único
    sesionId = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, sesionId);
  }
  
  console.log('Sesión inicializada:', sesionId);
}

// Cargar datos del evento
async function cargarEvento() {
  try {
    // Limpiar datos del evento anterior antes de cargar el nuevo evento
    // Esto previene que se muestren resultados de eventos anteriores
    nombreParticipante = '';
    seleccionesEtiquetas = {};
    seleccionesNaipes = {};
    seleccionesNaipesTimestamps = {};
    ordenEtiquetas = [];
    calificacionesEtiquetas = {};
    participantesDisponibles = [];
    nombresOcupados = new Set();
    etiquetasDisponibles = [];
    naipesDisponibles = [];
    
    // Limpiar mensaje de nombre en la UI
    const msgNombre = document.getElementById('msgNombre');
    if (msgNombre) {
      msgNombre.textContent = '';
      msgNombre.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
    }
    
    // Restablecer botón Finalizar si existe
    const btnFinalizar = document.getElementById('btnFinalizar');
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar';
      btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // Limpiar completamente el DOM del paso de ranking para evitar mostrar datos del evento anterior
    limpiarDOMPasoRanking();
    
    // Inicializar sesión para el nuevo evento (esto genera un nuevo sesionId si es necesario)
    inicializarSesion();
    
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      mostrarError('Evento no encontrado');
      return;
    }
    
    eventoData = eventoSnap.data();
    
    // Mostrar información del evento
    const tituloEvento = document.getElementById('tituloEvento');
    const fechaEvento = document.getElementById('fechaEvento');
    
    if (tituloEvento) {
      const nombreEvento = eventoData.nombre || 'Evento sin nombre';
      const pinEvento = eventoData.pin || '';
      // Mostrar el nombre del evento seguido del PIN si está disponible
      tituloEvento.textContent = pinEvento ? `${nombreEvento} — PIN: ${pinEvento}` : nombreEvento;
    }
    
    const fecha = eventoData.fecha || '';
    if (fecha && fechaEvento) {
      const fechaFormateada = formatearFecha(fecha);
      fechaEvento.textContent = `Fecha: ${fechaFormateada}`;
    }
    
    // La sección infoEvento ya está visible por defecto, no necesita mostrar/ocultar
    
    // El timer de cambios ya no se muestra visualmente, pero mantenemos la lógica
    // para permitir o bloquear cambios según el timer
    if (eventoData.timerActivo && eventoData.timerExpiraEn) {
      const expiraTimestamp = eventoData.timerExpiraEn instanceof Timestamp 
        ? eventoData.timerExpiraEn.toMillis() 
        : eventoData.timerExpiraEn;
      timerExpiraEn = expiraTimestamp;
      cambiosPermitidos = true;
    } else {
      timerExpiraEn = null;
      cambiosPermitidos = true; // Por defecto permitir cambios si no hay timer
    }
    
    // Iniciar escucha del timer de votación
    iniciarEscuchaTimerVotacion();
    
    // Cargar participantes disponibles del evento
    await cargarParticipantesDisponibles();
    
    // Cargar nombres ya ocupados por otros participantes
    await cargarNombresOcupados();
    
    // Cargar etiquetas del evento
    await cargarEtiquetas();
    
    // Verificar si ya hay datos guardados para esta sesión
    await verificarProgresoGuardado();
    
  } catch (error) {
    console.error('Error al cargar evento:', error);
    mostrarError('Error al cargar el evento');
  }
}

// Funciones del timer
// Funciones del timer de cambios (ya no se muestran visualmente, pero se mantiene la lógica)
function iniciarTimer() {
  detenerTimer(); // Limpiar timer anterior si existe
  
  if (!timerExpiraEn) return;
  
  cambiosPermitidos = true;
  
  // Función para verificar si el tiempo ha expirado
  const verificarTimer = () => {
    if (!timerExpiraEn) {
      detenerTimer();
      return;
    }
    
    const ahora = Date.now();
    const tiempoRestante = timerExpiraEn - ahora;
    
    if (tiempoRestante <= 0) {
      cambiosPermitidos = false;
      detenerTimer();
      renderizarOpcionesNombres(); // Actualizar UI para bloquear cambios
      return;
    }
  };
  
  // Ejecutar inmediatamente
  verificarTimer();
  
  // Configurar intervalo para verificar cada segundo
  timerInterval = setInterval(verificarTimer, 1000);
}

function detenerTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  cambiosPermitidos = true; // Por defecto permitir cambios si no hay timer
}

// Verificar si los resultados fueron revelados por el anfitrión
async function verificarResultadosRevelados() {
  try {
    if (!eventoId) return false;
    
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) return false;
    
    const eventoData = eventoSnap.data();
    // Verificar si el evento está finalizado (esto es lo que indica que los resultados están disponibles)
    return eventoData.eventoFinalizado === true;
  } catch (error) {
    console.error('Error al verificar resultados revelados:', error);
    return false;
  }
}

// Iniciar verificación periódica de resultados
function iniciarVerificacionResultados() {
  detenerVerificacionResultados();
  
  // Función para verificar y actualizar
  const verificarYActualizar = async () => {
    const revelados = await verificarResultadosRevelados();
    if (revelados) {
      // Los resultados fueron revelados
      if (pasoActual === 4) {
        // Ya estamos en el paso de ranking, actualizar resultados
        await mostrarPasoRanking();
      } else {
        // Cambiar al paso de ranking
        pasoActual = 4;
        await mostrarPasoRanking();
      }
      detenerVerificacionResultados();
    }
  };
  
  // Verificar inmediatamente
  verificarYActualizar();
  
  // Verificar cada 3 segundos
  verificacionResultadosInterval = setInterval(verificarYActualizar, 3000);
}

// Detener verificación de resultados
function detenerVerificacionResultados() {
  if (verificacionResultadosInterval) {
    clearInterval(verificacionResultadosInterval);
    verificacionResultadosInterval = null;
  }
}

/**
 * Iniciar escucha del timer de votación en tiempo real
 */
function iniciarEscuchaTimerVotacion() {
  // Limpiar suscripción anterior si existe
  if (timerVotacionUnsubscribe) {
    timerVotacionUnsubscribe();
    timerVotacionUnsubscribe = null;
  }
  
  // Limpiar intervalo anterior si existe
  if (timerVotacionInterval) {
    clearInterval(timerVotacionInterval);
    timerVotacionInterval = null;
  }
  
  if (!eventoId) return;
  
  const timerVotacionEl = document.getElementById('timerVotacion');
  const timerVotacionDisplay = document.getElementById('timerVotacionDisplay');
  
  if (!timerVotacionEl || !timerVotacionDisplay) return;
  
  // Verificar si el evento está finalizado
  const eventoRef = doc(db, 'eventos', eventoId);
  getDoc(eventoRef).then(eventoSnap => {
    if (eventoSnap.exists()) {
      const eventoData = eventoSnap.data();
      if (eventoData.eventoFinalizado) {
        // Evento finalizado - mostrar leyenda y congelar timer
        timerVotacionEl.classList.remove('hidden');
        timerVotacionDisplay.textContent = '--:--';
        timerVotacionDisplay.classList.add('text-red-600');
        
        // Agregar mensaje de evento finalizado
        const mensajeFinalizado = document.createElement('p');
        mensajeFinalizado.className = 'text-sm text-red-600 font-semibold mt-2';
        mensajeFinalizado.textContent = '⏸️ Evento finalizado por el anfitrión';
        timerVotacionEl.appendChild(mensajeFinalizado);
        return;
      }
    }
    
    // Suscribirse a cambios en tiempo real del timer de votación
    timerVotacionUnsubscribe = escucharTimerEvento(eventoId, (timerData) => {
      // Verificar nuevamente si el evento está finalizado
      getDoc(eventoRef).then(eventoSnap => {
        if (eventoSnap.exists()) {
          const eventoData = eventoSnap.data();
          if (eventoData.eventoFinalizado) {
            // Evento finalizado - mostrar leyenda y congelar timer
            timerVotacionEl.classList.remove('hidden');
            timerVotacionDisplay.textContent = '--:--';
            timerVotacionDisplay.classList.add('text-red-600');
            
            // Verificar si ya existe el mensaje
            let mensajeFinalizado = timerVotacionEl.querySelector('p.text-red-600.font-semibold');
            if (!mensajeFinalizado) {
              mensajeFinalizado = document.createElement('p');
              mensajeFinalizado.className = 'text-sm text-red-600 font-semibold mt-2';
              mensajeFinalizado.textContent = '⏸️ Evento finalizado por el anfitrión';
              timerVotacionEl.appendChild(mensajeFinalizado);
            }
            
            if (timerVotacionInterval) {
              clearInterval(timerVotacionInterval);
              timerVotacionInterval = null;
            }
            return;
          }
        }
        
        if (timerData.timerActivo && timerData.timerExpiraEn) {
          timerVotacionEl.classList.remove('hidden');
          
          // Remover mensaje de evento finalizado si existe
          const mensajeFinalizado = timerVotacionEl.querySelector('p.text-red-600.font-semibold');
          if (mensajeFinalizado) {
            mensajeFinalizado.remove();
          }
          
          // Actualizar display inmediatamente
          actualizarDisplayTimerVotacion(timerData.timerExpiraEn);
          
          // Iniciar intervalo para actualizar cada segundo
          if (timerVotacionInterval) {
            clearInterval(timerVotacionInterval);
          }
          timerVotacionInterval = setInterval(() => {
            actualizarDisplayTimerVotacion(timerData.timerExpiraEn);
          }, 1000);
        } else {
          timerVotacionEl.classList.add('hidden');
          
          if (timerVotacionInterval) {
            clearInterval(timerVotacionInterval);
            timerVotacionInterval = null;
          }
        }
      });
    });
  });
}

/**
 * Actualizar display del timer de votación
 */
function actualizarDisplayTimerVotacion(timestampExpira) {
  const timerVotacionDisplay = document.getElementById('timerVotacionDisplay');
  if (!timerVotacionDisplay) return;
  
  const ahora = Date.now();
  const tiempoRestante = timestampExpira - ahora;
  
  if (tiempoRestante <= 0) {
    timerVotacionDisplay.textContent = '00:00';
    timerVotacionDisplay.classList.add('text-red-600');
    
    // Finalizar votaciones automáticamente
    finalizarVotacionesAutomaticamente();
    
    // Detener el intervalo
    if (timerVotacionInterval) {
      clearInterval(timerVotacionInterval);
      timerVotacionInterval = null;
    }
    return;
  }
  
  const minutos = Math.floor(tiempoRestante / 60000);
  const segundos = Math.floor((tiempoRestante % 60000) / 1000);
  
  const minutosStr = minutos.toString().padStart(2, '0');
  const segundosStr = segundos.toString().padStart(2, '0');
  
  timerVotacionDisplay.textContent = `${minutosStr}:${segundosStr}`;
  
  // Cambiar color a rojo cuando queden menos de 2 minutos
  if (tiempoRestante < 2 * 60 * 1000) {
    timerVotacionDisplay.classList.add('text-red-600');
  } else {
    timerVotacionDisplay.classList.remove('text-red-600');
  }
}

/**
 * Finalizar votaciones automáticamente cuando el timer llegue a 0
 */
async function finalizarVotacionesAutomaticamente() {
  console.log('Timer de votación finalizado. Finalizando votaciones automáticamente...');
  
  // Si el participante ya finalizó, no hacer nada
  if (pasoActual === 4) {
    return;
  }
  
  // Si hay participantes seleccionados, asignar 0 a las selecciones sin calificar
  if (participantesDisponibles && participantesDisponibles.length > 0) {
    Object.keys(seleccionesNaipes).forEach(etiquetaId => {
      if (!calificacionesEtiquetas[etiquetaId] || calificacionesEtiquetas[etiquetaId] === 0) {
        calificacionesEtiquetas[etiquetaId] = 0;
      }
    });
  }
  
  // Guardar progreso como finalizado (incluso si hay selecciones incompletas)
  try {
    await guardarProgreso(true);
    
    // Cambiar al paso de ranking/selecciones finalizadas
    pasoActual = 4;
    await mostrarSeleccionesFinalizadas();
    
    // Mostrar mensaje
    const mensajeFinal = document.getElementById('mensajeFinal');
    if (mensajeFinal) {
      mensajeFinal.textContent = '⏰ Tiempo finalizado. Tu participación ha sido guardada automáticamente.';
      mensajeFinal.classList.add('text-red-600', 'font-semibold');
    }
  } catch (error) {
    console.error('Error al finalizar votaciones automáticamente:', error);
  }
}

// Cargar participantes disponibles del evento (creados por el Admin)
async function cargarParticipantesDisponibles() {
  try {
    console.log('Cargando participantes para evento:', eventoId);
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    participantesDisponibles = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const nombre = data.nombre || '';
      if (nombre) {
        participantesDisponibles.push({
          id: doc.id,
          nombre: nombre
        });
      }
    });
    
    console.log('Participantes disponibles cargados:', participantesDisponibles.length);
    console.log('Llamando a renderizarOpcionesNombres...');
    
    // Siempre renderizar después de cargar
    renderizarOpcionesNombres();
    
  } catch (error) {
    console.error('Error al cargar participantes:', error);
    const contenedor = document.getElementById('contenedorNombres');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600 text-sm">Error al cargar participantes. Por favor, recarga la página.</p>';
    }
  }
}

// Cargar nombres ya ocupados por otros participantes
async function cargarNombresOcupados() {
  try {
    const seleccionesRef = collection(db, 'selecciones');
    const q = query(seleccionesRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    nombresOcupados.clear();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const nombre = data.nombreParticipante || '';
      const sesionIdDoc = data.sesionId || '';
      
      // Solo considerar nombres ocupados por otras sesiones
      if (nombre && sesionIdDoc !== sesionId) {
        nombresOcupados.add(nombre.toLowerCase());
      }
    });
    
    console.log('Nombres ocupados:', Array.from(nombresOcupados));
    
  } catch (error) {
    console.error('Error al cargar nombres ocupados:', error);
  }
}

// Cargar etiquetas disponibles del evento
async function cargarEtiquetas() {
  try {
    const etiquetasRef = collection(db, 'etiquetas');
    const q = query(etiquetasRef, where('eventoId', '==', eventoId));
    const querySnapshot = await getDocs(q);
    
    etiquetasDisponibles = [];
    naipesDisponibles = [];
    const etiquetasUnicas = new Set();
    const naipesUnicos = new Map(); // Map para evitar duplicados de naipes
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const etiquetaId = data.etiquetaId || '';
      const etiquetaNombre = data.etiquetaNombre || '';
      const naipeId = data.naipeId || '';
      const naipeNombre = data.naipeNombre || '';
      
      // Agregar etiqueta si no está duplicada
      if (etiquetaId && etiquetaNombre && !etiquetasUnicas.has(etiquetaId)) {
        etiquetasDisponibles.push({
          id: etiquetaId,
          nombre: etiquetaNombre
        });
        etiquetasUnicas.add(etiquetaId);
      }
      
      // Agregar naipe si existe y no está duplicado
      if (naipeId && naipeNombre && !naipesUnicos.has(naipeId)) {
        naipesUnicos.set(naipeId, {
          id: naipeId,
          nombre: naipeNombre
        });
      }
    });
    
    // Convertir Map a Array
    naipesDisponibles = Array.from(naipesUnicos.values());
    
    console.log('Etiquetas cargadas:', etiquetasDisponibles.length);
    console.log('Naipes disponibles:', naipesDisponibles.length);
    
    if (etiquetasDisponibles.length === 0) {
      mostrarError('Este evento no tiene etiquetas configuradas aún');
    }
    
    if (naipesDisponibles.length === 0) {
      console.warn('No se encontraron naipes asociados a las etiquetas');
    }
    
  } catch (error) {
    console.error('Error al cargar etiquetas:', error);
    mostrarError('Error al cargar las etiquetas');
  }
}

// Cargar naipes disponibles (ya se cargan en cargarEtiquetas, esta función es para compatibilidad)
async function cargarNaipes() {
  // Si no hay naipes cargados, intentar cargar desde las etiquetas
  if (naipesDisponibles.length === 0 && eventoId) {
    try {
      await cargarEtiquetas();
    } catch (error) {
      console.error('Error al cargar etiquetas/naipes:', error);
    }
  }
  
  // Si por alguna razón no están cargados, usar los de constantes como fallback
  if (naipesDisponibles.length === 0) {
    console.warn('No hay naipes cargados desde las etiquetas, usando naipes estándar como fallback');
    naipesDisponibles = NAIPES_TRUCO.map(naipe => ({
      id: naipe.id,
      nombre: naipe.nombre
    }));
  }
}

// Verificar si hay progreso guardado
async function verificarProgresoGuardado() {
  try {
    // Asegurar que tenemos un eventoId válido
    if (!eventoId) {
      console.warn('No hay eventoId, limpiando progreso');
      pasoActual = 1;
      mostrarPasoNombre();
      return;
    }
    
    const seleccionesRef = collection(db, 'selecciones');
    // Filtrar por sesionId Y eventoId para asegurar que solo obtenemos datos del evento actual
    const q = query(
      seleccionesRef, 
      where('sesionId', '==', sesionId),
      where('eventoId', '==', eventoId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      
      // Verificación adicional: asegurar que el eventoId del documento coincide con el actual
      if (docData.eventoId !== eventoId) {
        console.warn('El progreso guardado pertenece a otro evento, limpiando datos');
        // Limpiar variables globales
        nombreParticipante = '';
        seleccionesEtiquetas = {};
        seleccionesNaipes = {};
        seleccionesNaipesTimestamps = {};
        ordenEtiquetas = [];
        calificacionesEtiquetas = {};
        pasoActual = 1;
        // Limpiar mensaje de nombre en la UI
        const msgNombre = document.getElementById('msgNombre');
        if (msgNombre) {
          msgNombre.textContent = '';
          msgNombre.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
        }
        // Restablecer botón Finalizar
        const btnFinalizar = document.getElementById('btnFinalizar');
        if (btnFinalizar) {
          btnFinalizar.disabled = false;
          btnFinalizar.textContent = 'Finalizar';
          btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        // Limpiar DOM del paso de ranking para evitar mostrar datos del evento anterior
        limpiarDOMPasoRanking();
        mostrarPasoNombre();
        return;
      }
      
      // Restaurar el nombre si existe en los participantes disponibles del evento actual
      const nombreRestaurado = docData.nombreParticipante || '';
      if (nombreRestaurado && participantesDisponibles.some(p => p.nombre === nombreRestaurado)) {
        nombreParticipante = nombreRestaurado;
      } else {
        // Si el nombre restaurado no existe en los participantes del evento actual, limpiarlo
        nombreParticipante = '';
        console.log('El nombre del participante restaurado no existe en los participantes del evento actual, limpiando');
      }
      
      // Restaurar selecciones (incluso si está finalizado, las necesitamos para mostrar resultados)
      seleccionesEtiquetas = docData.seleccionesEtiquetas || {};
      seleccionesNaipes = docData.seleccionesNaipes || {};
      seleccionesNaipesTimestamps = docData.seleccionesNaipesTimestamps || {};
      ordenEtiquetas = docData.ordenEtiquetas || []; // Restaurar orden guardado
      calificacionesEtiquetas = docData.calificacionesEtiquetas || {}; // Restaurar calificaciones
      
      // Restablecer botón Finalizar al restaurar progreso (pero deshabilitarlo si está finalizado)
      const btnFinalizar = document.getElementById('btnFinalizar');
      if (btnFinalizar) {
        if (docData.finalizado === true) {
          // Si está finalizado, deshabilitar el botón y cambiar el texto
          btnFinalizar.disabled = true;
          btnFinalizar.textContent = 'Finalizado';
          btnFinalizar.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          btnFinalizar.disabled = false;
          btnFinalizar.textContent = 'Finalizar';
          btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
      
      // Actualizar nombre del usuario en el header
      actualizarNombreUsuarioHeader();
      
      // Esperar a que el DOM esté listo antes de mostrar pasos
      // En móviles, dar más tiempo para que el DOM esté completamente listo
      const waitForDOM = () => {
        const pasoNombre = document.getElementById('pasoNombre');
        const pasoEtiquetas = document.getElementById('pasoEtiquetas');
        const pasoRanking = document.getElementById('pasoRanking');
        
        if (pasoNombre && pasoEtiquetas && pasoRanking) {
          determinarPasoDesdeProgreso(docData);
        } else {
          setTimeout(waitForDOM, 100);
        }
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDOM);
      } else {
        // Dar un pequeño delay incluso si el DOM está listo (para móviles)
        setTimeout(waitForDOM, 100);
      }
  } else {
    // No hay progreso guardado, mostrar paso 1 (seleccionar nombre)
    pasoActual = 1;
    // Restablecer botón Finalizar cuando no hay progreso guardado
    const btnFinalizar = document.getElementById('btnFinalizar');
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar';
      btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    mostrarPasoNombre();
  }
  
  // Asegurar que los botones se actualicen después de cargar el progreso
  setTimeout(() => {
    actualizarBotonFinalizar();
  }, 100);
  } catch (error) {
    console.error('Error al verificar progreso:', error);
    // En caso de error, mostrar paso 1
    pasoActual = 1;
    mostrarPasoNombre();
  }
}

// Función auxiliar para determinar el paso desde el progreso guardado
async function determinarPasoDesdeProgreso(docData) {
  // Verificar que los elementos existan antes de mostrar pasos
  const pasoRanking = document.getElementById('pasoRanking');
  const pasoEtiquetas = document.getElementById('pasoEtiquetas');
  const pasoNombre = document.getElementById('pasoNombre');
  
  if (!pasoRanking || !pasoEtiquetas || !pasoNombre) {
    console.warn('Elementos del DOM aún no están listos, reintentando...');
    setTimeout(() => determinarPasoDesdeProgreso(docData), 100);
    return;
  }
  
  // Determinar en qué paso está
  if (docData.finalizado) {
    pasoActual = 4;
    // Verificar si los resultados ya fueron revelados
    const revelados = await verificarResultadosRevelados();
    if (revelados) {
      await mostrarPasoRanking();
    } else {
      mostrarSeleccionesFinalizadas();
    }
  } else if (Object.keys(seleccionesNaipes).length > 0 || Object.keys(seleccionesEtiquetas).length > 0) {
    pasoActual = 2;
    actualizarNombreUsuarioHeader();
    // Usar setTimeout para asegurar que el DOM esté listo (especialmente en móviles)
    setTimeout(async () => {
      await mostrarPasoEtiquetas();
    }, 150);
  } else if (nombreParticipante) {
    pasoActual = 2;
    actualizarNombreUsuarioHeader();
    // Usar setTimeout para asegurar que el DOM esté listo (especialmente en móviles)
    setTimeout(async () => {
      await mostrarPasoEtiquetas();
    }, 150);
  } else {
    // No hay progreso, mostrar paso 1
    pasoActual = 1;
    mostrarPasoNombre();
  }
}

// Mostrar paso de nombre
function mostrarPasoNombre() {
  const pasoNombre = document.getElementById('pasoNombre');
  const pasoEtiquetas = document.getElementById('pasoEtiquetas');
  const pasoRanking = document.getElementById('pasoRanking');
  
  if (pasoNombre) pasoNombre.classList.remove('hidden');
  if (pasoEtiquetas) pasoEtiquetas.classList.add('hidden');
  if (pasoRanking) pasoRanking.classList.add('hidden');
  
  // Limpiar mensaje de nombre si no hay un nombre seleccionado válido para el evento actual
  // Esto previene que se muestre el nombre de un participante de un evento anterior
  if (!nombreParticipante || !participantesDisponibles.some(p => p.nombre === nombreParticipante)) {
    nombreParticipante = '';
    const msgNombre = document.getElementById('msgNombre');
    if (msgNombre) {
      msgNombre.textContent = '';
      msgNombre.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
    }
    // Deshabilitar botón continuar
    const btnContinuar = document.getElementById('btnContinuarNombre');
    if (btnContinuar) {
      btnContinuar.disabled = true;
      btnContinuar.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }
  
  // Renderizar opciones después de un breve delay para asegurar que el DOM esté actualizado
  setTimeout(() => {
    renderizarOpcionesNombres();
  }, 50);
}

// Variable para limitar reintentos
let reintentosRenderizarNombres = 0;
const MAX_REINTENTOS_RENDERIZAR = 50; // Máximo 5 segundos (50 * 100ms)

// Renderizar opciones de nombres disponibles
function renderizarOpcionesNombres() {
  console.log('renderizarOpcionesNombres llamado');
  console.log('participantesDisponibles:', participantesDisponibles);
  
  // Verificar que el paso de nombre esté visible primero
  const pasoNombre = document.getElementById('pasoNombre');
  if (!pasoNombre || pasoNombre.classList.contains('hidden')) {
    console.log('El paso de nombre no está visible, no se puede renderizar');
    return;
  }
  
  const contenedor = document.getElementById('contenedorNombres');
  if (!contenedor) {
    reintentosRenderizarNombres++;
    if (reintentosRenderizarNombres < MAX_REINTENTOS_RENDERIZAR) {
      console.warn(`No se encontró el contenedor de nombres (reintento ${reintentosRenderizarNombres}/${MAX_REINTENTOS_RENDERIZAR})`);
      // Reintentar después de un breve delay
      setTimeout(() => renderizarOpcionesNombres(), 100);
    } else {
      console.error('No se encontró el contenedor de nombres después de múltiples intentos. El paso de nombre puede no estar visible.');
      reintentosRenderizarNombres = 0; // Resetear para evitar bloqueo permanente
    }
    return;
  }
  
  // Resetear contador de reintentos si se encontró el contenedor
  reintentosRenderizarNombres = 0;
  
  console.log('Contenedor encontrado, limpiando...');
  contenedor.innerHTML = '';
  
  // Si aún no se han cargado los participantes, mostrar mensaje de carga
  if (participantesDisponibles === undefined || participantesDisponibles === null) {
    console.log('Participantes aún no cargados');
    const msg = document.createElement('p');
    msg.className = 'text-gray-600 text-sm';
    msg.textContent = 'Cargando nombres disponibles...';
    contenedor.appendChild(msg);
    return;
  }
  
  if (participantesDisponibles.length === 0) {
    console.log('No hay participantes disponibles');
    const msg = document.createElement('p');
    msg.className = 'text-yellow-600 text-sm';
    msg.textContent = 'El administrador aún no ha cargado participantes para este evento.';
    contenedor.appendChild(msg);
    return;
  }
  
  console.log('Renderizando', participantesDisponibles.length, 'participantes');
  
  participantesDisponibles.forEach((participante) => {
    const nombreLower = participante.nombre.toLowerCase();
    const estaOcupado = nombresOcupados.has(nombreLower);
    const estaSeleccionado = nombreParticipante && nombreParticipante.toLowerCase() === nombreLower;
    
    const div = document.createElement('div');
    div.className = `border rounded-xl p-4 cursor-pointer transition-all ${
      estaOcupado 
        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
        : estaSeleccionado
        ? 'bg-purple-100 border-purple-300'
        : 'bg-white border-gray-300 hover:bg-purple-50 hover:border-purple-200'
    }`;
    
    if (estaOcupado) {
      div.onclick = () => {
        const msgNombre = document.getElementById('msgNombre');
        if (msgNombre) {
          msgNombre.textContent = `"${participante.nombre}" ya fue seleccionado por otro participante.`;
          msgNombre.classList.remove('text-gray-600', 'text-green-600');
          msgNombre.classList.add('text-red-600');
        }
      };
    } else {
      div.onclick = () => {
        // Verificar si se permiten cambios
        if (!cambiosPermitidos && nombreParticipante) {
          const msgNombre = document.getElementById('msgNombre');
          if (msgNombre) {
            msgNombre.textContent = 'El tiempo para cambios ha expirado. No podés cambiar tu nombre.';
            msgNombre.classList.remove('text-gray-600', 'text-green-600');
            msgNombre.classList.add('text-red-600');
          }
          return;
        }
        
        // Deseleccionar otros
        contenedor.querySelectorAll('div').forEach(d => {
          d.classList.remove('bg-purple-100', 'border-purple-300');
          d.classList.add('bg-white', 'border-gray-300');
        });
        
        // Seleccionar este
        div.classList.remove('bg-white', 'border-gray-300');
        div.classList.add('bg-purple-100', 'border-purple-300');
        
        nombreParticipante = participante.nombre;
        
        const msgNombre = document.getElementById('msgNombre');
        if (msgNombre) {
          msgNombre.textContent = `Seleccionado: ${participante.nombre}`;
          msgNombre.classList.remove('text-gray-600', 'text-red-600');
          msgNombre.classList.add('text-green-600');
        }
        
        // Actualizar nombre del usuario en el header
        actualizarNombreUsuarioHeader();
        
        // Habilitar botón continuar
        const btnContinuar = document.getElementById('btnContinuarNombre');
        if (btnContinuar) {
          btnContinuar.disabled = false;
          btnContinuar.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      };
    }
    
    const nombreP = document.createElement('p');
    nombreP.className = `font-semibold ${estaOcupado ? 'text-gray-500' : 'text-gray-900'}`;
    nombreP.textContent = participante.nombre;
    
    if (estaOcupado) {
      const ocupadoBadge = document.createElement('span');
      ocupadoBadge.className = 'text-xs text-red-600 ml-2';
      ocupadoBadge.textContent = '(Ya seleccionado)';
      nombreP.appendChild(ocupadoBadge);
    }
    
    if (estaSeleccionado) {
      const seleccionadoBadge = document.createElement('span');
      seleccionadoBadge.className = 'text-xs text-green-600 ml-2';
      seleccionadoBadge.textContent = '(Tu selección)';
      nombreP.appendChild(seleccionadoBadge);
    }
    
    div.appendChild(nombreP);
    contenedor.appendChild(div);
  });
  
  // Si ya hay un nombre seleccionado Y ese nombre existe en los participantes disponibles del evento actual, marcarlo
  // Esto previene que se marque un nombre de un evento anterior que no existe en el evento actual
  if (nombreParticipante) {
    const nombreLower = nombreParticipante.toLowerCase();
    const existeEnParticipantes = participantesDisponibles.some(p => p.nombre.toLowerCase() === nombreLower);
    
    if (existeEnParticipantes) {
      contenedor.querySelectorAll('div').forEach((div, index) => {
        const participante = participantesDisponibles[index];
        if (participante && participante.nombre.toLowerCase() === nombreLower) {
          div.classList.remove('bg-white', 'border-gray-300');
          div.classList.add('bg-purple-100', 'border-purple-300');
        }
      });
    } else {
      // Si el nombre seleccionado no existe en los participantes del evento actual, limpiarlo
      nombreParticipante = '';
      const msgNombre = document.getElementById('msgNombre');
      if (msgNombre) {
        msgNombre.textContent = '';
        msgNombre.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
      }
      // Deshabilitar botón continuar
      const btnContinuar = document.getElementById('btnContinuarNombre');
      if (btnContinuar) {
        btnContinuar.disabled = true;
        btnContinuar.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  }
}

// Mostrar paso de etiquetas y naipes (juntos ahora)
async function mostrarPasoEtiquetas() {
  const pasoNombre = document.getElementById('pasoNombre');
  const pasoEtiquetas = document.getElementById('pasoEtiquetas');
  const pasoRanking = document.getElementById('pasoRanking');
  
  if (pasoNombre) pasoNombre.classList.add('hidden');
  if (pasoEtiquetas) pasoEtiquetas.classList.remove('hidden');
  if (pasoRanking) pasoRanking.classList.add('hidden');
  
  // Restablecer botón Finalizar al mostrar paso de etiquetas
  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) {
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = 'Finalizar';
    btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  
  // Asegurar que el contenido principal esté visible
  const mainContent = document.getElementById('mainContent');
  const splashScreen = document.getElementById('splashScreen');
  if (mainContent) mainContent.classList.remove('hidden');
  if (splashScreen) splashScreen.classList.add('hidden');
  
  // Cargar datos necesarios antes de renderizar
  await cargarNaipes();
  
  // Esperar un momento para asegurar que el DOM esté listo (especialmente en móviles)
  setTimeout(() => {
    renderizarEtiquetasYNaipes();
    actualizarBotonFinalizar();
  }, 100);
}

// Crear componente de estrellas de solo lectura (para mostrar calificaciones)
function crearEstrellasSoloLectura(calificacion) {
  const contenedor = document.createElement('div');
  contenedor.className = 'flex items-center justify-center gap-0.5 mt-1';
  contenedor.style.display = 'flex';
  contenedor.style.justifyContent = 'center';
  contenedor.style.alignItems = 'center';
  contenedor.style.gap = '2px';
  contenedor.style.marginTop = '4px';
  
  const calificacionNum = calificacion || 0;
  
  // Crear 5 estrellas pequeñas para que encajen bien sobre el naipe
  for (let i = 1; i <= 5; i++) {
    const estrella = document.createElement('div');
    estrella.style.display = 'inline-block';
    estrella.style.padding = '0';
    estrella.style.margin = '0';
    
    // SVG de estrella (rellena o vacía) - más pequeñas para que encajen
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', i <= calificacionNum ? '#fbbf24' : 'none');
    svg.setAttribute('stroke', '#fbbf24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.display = 'block';
    svg.style.pointerEvents = 'none';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);
    
    estrella.appendChild(svg);
    contenedor.appendChild(estrella);
  }
  
  return contenedor;
}

// Crear componente de estrellas para calificar etiquetas
function crearComponenteEstrellas(etiquetaId) {
  const contenedor = document.createElement('div');
  contenedor.className = 'flex items-center gap-1 mt-2';
  contenedor.id = `estrellas-${etiquetaId}`;
  contenedor.dataset.etiquetaId = etiquetaId;
  
  const calificacionActual = calificacionesEtiquetas[etiquetaId] || 0;
  
  // Guardar la calificación actual en el contenedor para referencia
  contenedor.dataset.calificacionActual = calificacionActual;
  
  // Crear 5 estrellas
  for (let i = 1; i <= 5; i++) {
    const estrella = document.createElement('button');
    estrella.type = 'button';
    estrella.className = 'focus:outline-none transition-transform hover:scale-110 estrella-calificacion';
    estrella.dataset.rating = i;
    estrella.setAttribute('aria-label', `Calificar con ${i} estrella${i > 1 ? 's' : ''}`);
    
    // Estilos específicos para permitir eventos táctiles en Android
    estrella.style.touchAction = 'manipulation';
    estrella.style.pointerEvents = 'auto';
    estrella.style.cursor = 'pointer';
    estrella.style.padding = '4px';
    estrella.style.margin = '0';
    estrella.style.border = 'none';
    estrella.style.background = 'transparent';
    
    // SVG de estrella (rellena o vacía)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', i <= calificacionActual ? '#fbbf24' : 'none');
    svg.setAttribute('stroke', '#fbbf24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', i <= calificacionActual ? 'text-yellow-400' : 'text-gray-300');
    svg.style.pointerEvents = 'none'; // El SVG no debe interceptar eventos
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);
    
    estrella.appendChild(svg);
    
    // Función para manejar la calificación
    const manejarCalificacion = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      calificarEtiqueta(etiquetaId, i);
    };
    
    // Evento click para calificar (desktop)
    estrella.addEventListener('click', manejarCalificacion);
    
    // Eventos touch para calificar (móvil Android/iOS) - mejorado para mejor compatibilidad
    // Usar un objeto para almacenar el estado de cada estrella
    const touchState = {
      startTime: 0,
      startX: 0,
      startY: 0,
      moved: false
    };
    
    estrella.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchState.startTime = Date.now();
      touchState.startX = touch.clientX;
      touchState.startY = touch.clientY;
      touchState.moved = false;
      // Agregar clase visual de feedback
      estrella.style.transform = 'scale(0.9)';
      e.stopPropagation();
    }, { passive: true });
    
    estrella.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchState.startX);
        const deltaY = Math.abs(touch.clientY - touchState.startY);
        // Si se movió más de 15px, considerar que es un drag
        if (deltaX > 15 || deltaY > 15) {
          touchState.moved = true;
          estrella.style.transform = '';
        }
      }
    }, { passive: true });
    
    estrella.addEventListener('touchend', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Restaurar transformación
      estrella.style.transform = '';
      
      // Solo calificar si fue un tap rápido y no se movió (no un drag)
      const touchDuration = Date.now() - touchState.startTime;
      if (!touchState.moved && touchDuration < 500) {
        // Calificar inmediatamente
        manejarCalificacion(e);
      }
      
      // Resetear estado
      touchState.moved = false;
      touchState.startTime = 0;
    }, { passive: false });
    
    estrella.addEventListener('touchcancel', (e) => {
      estrella.style.transform = '';
      touchState.moved = false;
      touchState.startTime = 0;
      e.stopPropagation();
    }, { passive: true });
    
    // Hover para preview (solo desktop)
    if (!esDispositivoMovil()) {
      estrella.addEventListener('mouseenter', () => {
        actualizarPreviewEstrellas(contenedor, i);
      });
    }
    
    contenedor.appendChild(estrella);
  }
  
  // Restaurar estado al salir del hover (solo desktop)
  if (!esDispositivoMovil()) {
    contenedor.addEventListener('mouseleave', () => {
      const calificacion = parseInt(contenedor.dataset.calificacionActual) || 0;
      actualizarPreviewEstrellas(contenedor, calificacion);
    });
  }
  
  return contenedor;
}

// Actualizar preview de estrellas (hover)
function actualizarPreviewEstrellas(contenedor, rating) {
  const estrellas = contenedor.querySelectorAll('svg');
  estrellas.forEach((svg, index) => {
    const numEstrella = index + 1;
    if (numEstrella <= rating) {
      svg.setAttribute('fill', '#fbbf24');
      svg.setAttribute('class', 'text-yellow-400');
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('class', 'text-gray-300');
    }
  });
}

// Calificar una etiqueta
function calificarEtiqueta(etiquetaId, calificacion) {
  calificacionesEtiquetas[etiquetaId] = calificacion;
  
  // Actualizar visualmente las estrellas usando el ID específico
  const contenedorEstrellas = document.getElementById(`estrellas-${etiquetaId}`);
  if (contenedorEstrellas) {
    // Actualizar el dataset con la nueva calificación
    contenedorEstrellas.dataset.calificacionActual = calificacion;
    // Actualizar visualmente
    actualizarPreviewEstrellas(contenedorEstrellas, calificacion);
  }
  
  // Actualizar el botón Finalizar para verificar si todas las selecciones están calificadas
  actualizarBotonFinalizar();
  
  // Guardar progreso automáticamente
  guardarProgreso(false).catch(error => {
    console.error('Error al guardar calificación:', error);
  });
}

// Renderizar etiquetas y naipes con drag and drop
function renderizarEtiquetasYNaipes() {
  const contenedorEtiquetas = document.getElementById('contenedorEtiquetas');
  const contenedorNaipes = document.getElementById('contenedorNaipes');
  
  // Verificar que los contenedores existan
  if (!contenedorEtiquetas || !contenedorNaipes) {
    console.warn('Contenedores de etiquetas/naipes no encontrados, reintentando...');
    setTimeout(() => renderizarEtiquetasYNaipes(), 200);
    return;
  }
  
  contenedorEtiquetas.innerHTML = '';
  contenedorNaipes.innerHTML = '';
  
  // Inicializar orden de etiquetas si está vacío (mantener orden actual)
  if (ordenEtiquetas.length === 0) {
    ordenEtiquetas = etiquetasDisponibles.map(e => e.id);
  }
  
  // Asegurar que todas las etiquetas estén en el orden
  etiquetasDisponibles.forEach(etiqueta => {
    if (!ordenEtiquetas.includes(etiqueta.id)) {
      ordenEtiquetas.push(etiqueta.id);
    }
  });
  
  // Renderizar etiquetas según el orden de preferencia (ranking)
  ordenEtiquetas.forEach((etiquetaId, index) => {
    const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
    if (!etiqueta) return;
    
    const div = document.createElement('div');
    div.id = `etiqueta-${etiqueta.id}`;
    div.className = 'border-2 border-dashed border-purple-300 rounded-lg p-2 min-h-[90px] flex items-center justify-between gap-2 transition-all droppable draggable-etiqueta cursor-move';
    div.dataset.etiquetaId = etiqueta.id;
    div.dataset.etiquetaNombre = etiqueta.nombre;
    // Solo hacer draggable en desktop, en móvil usamos eventos táctiles
    div.draggable = !esDispositivoMovil();
    
    const contenido = document.createElement('div');
    contenido.className = 'flex-1 flex flex-col justify-center min-w-0';
    
    // Mostrar posición en el ranking (orden de mérito)
    const numero = document.createElement('div');
    numero.className = 'text-xs text-purple-600 font-semibold flex items-center gap-1';
    let leyendaRanking = '';
    if (index === 0) {
      leyendaRanking = '<span class="text-xs text-gray-400">(Me gustó más)</span>';
    } else if (index === ordenEtiquetas.length - 1) {
      leyendaRanking = '<span class="text-xs text-gray-400">(Me gustó menos)</span>';
    }
    numero.innerHTML = `<span class="text-lg">#${index + 1}</span>${leyendaRanking}`;
    
    const nombre = document.createElement('div');
    nombre.className = 'font-semibold text-gray-900 text-sm break-words';
    nombre.textContent = etiqueta.nombre;
    
    // Componente de calificación con estrellas
    const contenedorEstrellas = crearComponenteEstrellas(etiqueta.id);
    
    contenido.appendChild(numero);
    contenido.appendChild(nombre);
    contenido.appendChild(contenedorEstrellas);
    
    // Contenedor para la imagen del naipe (se mostrará al lado cuando esté asignado)
    const contenedorImagen = document.createElement('div');
    contenedorImagen.id = `imagen-naipe-${etiqueta.id}`;
    contenedorImagen.className = 'flex-shrink-0 flex flex-col items-center justify-center';
    
    if (seleccionesNaipes[etiqueta.id]) {
      const naipe = naipesDisponibles.find(n => n.id === seleccionesNaipes[etiqueta.id]);
      if (naipe) {
        // Mostrar imagen del naipe asignado al lado (más pequeña para optimizar espacio)
        const imgNaipeLateral = document.createElement('img');
        const rutaImagenLateral = obtenerImagenNaipe(naipe.id);
        imgNaipeLateral.src = rutaImagenLateral;
        imgNaipeLateral.alt = naipe.nombre;
        imgNaipeLateral.className = 'w-14 h-20 object-contain drop-shadow-md';
        imgNaipeLateral.draggable = false;
        imgNaipeLateral.title = naipe.nombre;
        
        // Fallback a SVG si la imagen no carga
        imgNaipeLateral.onerror = function() {
          this.src = generarSVGNaipe(naipe.id);
          this.onerror = null; // Evitar loops infinitos
        };
        
        contenedorImagen.appendChild(imgNaipeLateral);
        
        div.classList.remove('border-purple-300', 'border-dashed');
        div.classList.add('border-green-400', 'bg-green-50', 'border-solid');
        
        // Agregar botón para limpiar selección (más pequeño)
        const btnLimpiar = document.createElement('button');
        btnLimpiar.type = 'button';
        btnLimpiar.className = 'text-xs text-red-600 hover:text-red-800 mt-1 underline focus:outline-none';
        btnLimpiar.textContent = 'Limpiar';
        
        // Estilos específicos para permitir eventos táctiles en móviles
        btnLimpiar.style.touchAction = 'manipulation';
        btnLimpiar.style.pointerEvents = 'auto';
        btnLimpiar.style.cursor = 'pointer';
        btnLimpiar.style.userSelect = 'none';
        btnLimpiar.style.webkitUserSelect = 'none';
        btnLimpiar.style.webkitTapHighlightColor = 'transparent';
        
        // Función para manejar el click/touch
        const manejarLimpiar = (e) => {
          if (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          limpiarSeleccion(etiqueta.id);
        };
        
        // Evento click para desktop
        btnLimpiar.addEventListener('click', manejarLimpiar);
        
        // Eventos táctiles para móviles (Android e iPhone)
        let touchState = { startTime: 0, startX: 0, startY: 0, moved: false };
        
        btnLimpiar.addEventListener('touchstart', (e) => {
          const touch = e.touches[0];
          touchState.startTime = Date.now();
          touchState.startX = touch.clientX;
          touchState.startY = touch.clientY;
          touchState.moved = false;
          // Feedback visual
          btnLimpiar.style.transform = 'scale(0.95)';
          btnLimpiar.style.opacity = '0.8';
        }, { passive: true });
        
        btnLimpiar.addEventListener('touchmove', (e) => {
          if (e.touches.length > 0) {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchState.startX);
            const deltaY = Math.abs(touch.clientY - touchState.startY);
            // Si se movió más de 15px, considerar que es un drag
            if (deltaX > 15 || deltaY > 15) {
              touchState.moved = true;
            }
          }
        }, { passive: true });
        
        btnLimpiar.addEventListener('touchend', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          // Restaurar transformación
          btnLimpiar.style.transform = '';
          btnLimpiar.style.opacity = '';
          
          const duration = Date.now() - touchState.startTime;
          // Solo ejecutar si fue un tap rápido (< 500ms) y no se movió mucho
          if (!touchState.moved && duration < 500) {
            manejarLimpiar(e);
          }
          
          touchState.moved = false;
          touchState.startTime = 0;
        });
        
        btnLimpiar.addEventListener('touchcancel', (e) => {
          btnLimpiar.style.transform = '';
          btnLimpiar.style.opacity = '';
          touchState.moved = false;
          touchState.startTime = 0;
          e.stopPropagation();
        }, { passive: true });
        
        contenido.appendChild(btnLimpiar);
      }
    } else {
      // Mostrar placeholder cuando no hay naipe asignado (más compacto)
      const placeholder = document.createElement('div');
      placeholder.className = 'text-xs text-gray-400 italic text-center px-2';
      placeholder.textContent = 'Arrastrá aquí';
      contenedorImagen.appendChild(placeholder);
    }
    
    div.appendChild(contenido);
    div.appendChild(contenedorImagen);
    
    // Configurar zona de drop para naipes y reordenamiento de etiquetas
    configurarZonaDrop(div, {
      onDragOver: (e) => {
        // Solo permitir drop de naipes si no es un drag de reordenamiento de etiquetas
        const tipoDrag = e.dataTransfer.getData('tipo-drag');
        if (!tipoDrag || tipoDrag !== 'etiqueta-reorder') {
          div.classList.add('border-purple-500', 'bg-purple-50');
        }
      },
      onDragLeave: () => {
        if (!seleccionesNaipes[etiqueta.id]) {
          div.classList.remove('border-purple-500', 'bg-purple-50');
        }
      },
      onDrop: (e) => {
        const tipoDrag = e.dataTransfer.getData('tipo-drag');
        
        if (tipoDrag === 'etiqueta-reorder') {
          // Reordenar etiquetas
          const etiquetaIdOrigen = e.dataTransfer.getData('etiqueta-id');
          reordenarEtiquetas(etiquetaIdOrigen, etiqueta.id);
        } else {
          // Asignar naipe a etiqueta
          const naipeId = e.dataTransfer.getData('text/plain');
          asignarNaipeAEtiqueta(etiqueta.id, naipeId);
        }
        div.classList.remove('border-purple-500', 'bg-purple-50');
      }
    });
    
    // Configurar drag para REORDENAR etiquetas (arrastrar etiqueta para cambiar orden)
    configurarDragAndDrop(div, {
      tipoDrag: 'etiqueta-reorder',
      getDragData: () => etiqueta.id,
      onDragStart: () => {
        div.style.opacity = '0.5';
      },
      onDragEnd: () => {
        div.style.opacity = '';
      }
    });
    
    // Indicador visual de que es arrastrable para reordenar
    const iconoArrastrar = document.createElement('div');
    iconoArrastrar.className = 'text-gray-400 hover:text-gray-600 cursor-move';
    iconoArrastrar.innerHTML = '☰';
    iconoArrastrar.title = 'Arrastrá para reordenar (ranking de preferencia)';
    iconoArrastrar.style.fontSize = '18px';
    iconoArrastrar.style.lineHeight = '1';
    contenido.insertBefore(iconoArrastrar, contenido.firstChild);
    
    contenedorEtiquetas.appendChild(div);
  });
  
  // Renderizar naipes (arrastrables) como imágenes sin cuadros
  const naipesUsados = new Set(Object.values(seleccionesNaipes));
  
  naipesDisponibles.forEach((naipe) => {
    const div = document.createElement('div');
    div.id = `naipe-${naipe.id}`;
    div.className = `cursor-move transition-all draggable inline-block ${
      naipesUsados.has(naipe.id)
        ? 'opacity-40'
        : 'hover:scale-105 hover:z-10'
    }`;
    // Solo hacer draggable en desktop, en móvil usamos eventos táctiles
    div.draggable = !esDispositivoMovil();
    div.dataset.naipeId = naipe.id;
    div.dataset.naipeNombre = naipe.nombre;
    div.style.position = 'relative';
    
    // Crear imagen del naipe sin contenedor con borde
    const imgNaipe = document.createElement('img');
    const rutaImagen = obtenerImagenNaipe(naipe.id);
    imgNaipe.src = rutaImagen;
    imgNaipe.alt = naipe.nombre;
    imgNaipe.className = 'w-16 h-22 object-contain drop-shadow-md';
    imgNaipe.draggable = false; // La imagen no es arrastrable, el contenedor sí
    
    // Tooltip con el nombre del naipe
    imgNaipe.title = naipe.nombre;
    
    // Fallback a SVG si la imagen no carga
    imgNaipe.onerror = function() {
      this.src = generarSVGNaipe(naipe.id);
      this.onerror = null; // Evitar loops infinitos
    };
    
    // Indicador visual si está asignado (pequeño badge)
    if (naipesUsados.has(naipe.id)) {
      const badge = document.createElement('div');
      badge.className = 'absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold';
      badge.textContent = '✓';
      badge.style.zIndex = '10';
      div.appendChild(badge);
    }
    
    div.appendChild(imgNaipe);
    
    // Configurar drag para naipes
    configurarDragAndDrop(div, {
      tipoDrag: 'naipe',
      getDragData: () => naipe.id,
      onDragStart: (e) => {
        // Solo para desktop: crear imagen de arrastre
        if (!esDispositivoMovil() && e.dataTransfer) {
          const dragImage = document.createElement('img');
          const rutaImagenDrag = obtenerImagenNaipe(naipe.id);
          dragImage.src = rutaImagenDrag;
          dragImage.style.position = 'absolute';
          dragImage.style.top = '-1000px';
          dragImage.style.left = '-1000px';
          dragImage.style.width = '80px';
          dragImage.style.height = '112px';
          dragImage.style.pointerEvents = 'none';
          dragImage.style.opacity = '0.8';
          dragImage.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
          document.body.appendChild(dragImage);
          
          // Fallback a SVG si la imagen no carga
          dragImage.onerror = function() {
            this.src = generarSVGNaipe(naipe.id);
            this.onerror = null;
          };
          
          // Esperar a que la imagen se cargue antes de usarla como dragImage
          dragImage.onload = () => {
            if (e.dataTransfer) {
              e.dataTransfer.setDragImage(dragImage, 40, 56);
            }
          };
          
          // Si la imagen ya está cargada, usar inmediatamente
          if (dragImage.complete) {
            e.dataTransfer.setDragImage(dragImage, 40, 56);
          }
          
          // Eliminar el elemento temporal después de un breve delay
          setTimeout(() => {
            if (document.body.contains(dragImage)) {
              document.body.removeChild(dragImage);
            }
          }, 0);
        }
        
        // Reducir opacidad del elemento original
        div.style.opacity = '0.4';
      },
      onDragEnd: () => {
        div.style.opacity = '';
      }
    });
    
    contenedorNaipes.appendChild(div);
  });
  
  // El contenedor de naipes ya tiene el estilo aplicado en el HTML
}

// Reordenar etiquetas (cambiar posición en el ranking)
function reordenarEtiquetas(etiquetaIdOrigen, etiquetaIdDestino) {
  if (etiquetaIdOrigen === etiquetaIdDestino) return;
  
  const indiceOrigen = ordenEtiquetas.indexOf(etiquetaIdOrigen);
  const indiceDestino = ordenEtiquetas.indexOf(etiquetaIdDestino);
  
  if (indiceOrigen === -1 || indiceDestino === -1) return;
  
  // Remover del índice original
  ordenEtiquetas.splice(indiceOrigen, 1);
  // Insertar en el nuevo índice
  ordenEtiquetas.splice(indiceDestino, 0, etiquetaIdOrigen);
  
  // Re-renderizar para mostrar el nuevo orden
  renderizarEtiquetasYNaipes();
  
  // Guardar el orden en el progreso
  guardarProgreso(false).catch(error => {
    console.error('Error al guardar orden:', error);
  });
}

// Limpiar selección de una etiqueta
function limpiarSeleccion(etiquetaId) {
  if (seleccionesNaipes[etiquetaId]) {
    delete seleccionesNaipes[etiquetaId];
    delete seleccionesNaipesTimestamps[etiquetaId]; // Limpiar también el timestamp
    // Mantener el nombre de la etiqueta para preservar la información
    const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
    if (etiqueta && !seleccionesEtiquetas[etiquetaId]) {
      seleccionesEtiquetas[etiquetaId] = etiqueta.nombre;
    }
  }
  
  // Limpiar también la calificación de estrellas
  if (calificacionesEtiquetas[etiquetaId]) {
    delete calificacionesEtiquetas[etiquetaId];
  }
  
  // Re-renderizar para actualizar visualmente
  renderizarEtiquetasYNaipes();
  actualizarBotonFinalizar();
  
  // Guardar progreso automáticamente después de limpiar
  guardarProgreso(false).catch(error => {
    console.error('Error al guardar automáticamente:', error);
  });
}

// Asignar naipe a etiqueta
function asignarNaipeAEtiqueta(etiquetaId, naipeId) {
  // Asegurar que tenemos el nombre de la etiqueta antes de asignar
  const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
  if (!etiqueta) {
    console.error('Etiqueta no encontrada:', etiquetaId);
    return;
  }
  
  // Verificar si el naipe ya está asignado a otra etiqueta
  const etiquetaAnterior = Object.keys(seleccionesNaipes).find(
    eId => seleccionesNaipes[eId] === naipeId
  );
  
  if (etiquetaAnterior && etiquetaAnterior !== etiquetaId) {
    // Remover asignación anterior pero mantener el nombre de la etiqueta
    delete seleccionesNaipes[etiquetaAnterior];
    const etiquetaAnteriorObj = etiquetasDisponibles.find(e => e.id === etiquetaAnterior);
    if (etiquetaAnteriorObj) {
      seleccionesEtiquetas[etiquetaAnterior] = etiquetaAnteriorObj.nombre;
    }
  }
  
  // Asignar nuevo naipe y asegurar que el nombre de la etiqueta esté guardado
  seleccionesNaipes[etiquetaId] = naipeId;
  seleccionesEtiquetas[etiquetaId] = etiqueta.nombre;
  
  // Guardar timestamp de cuando se asignó el naipe (para calcular bonus)
  seleccionesNaipesTimestamps[etiquetaId] = Date.now();
  
  // Re-renderizar para actualizar visualmente
  renderizarEtiquetasYNaipes();
  actualizarBotonFinalizar();
  
  // Guardar progreso automáticamente después de asignar
  guardarProgreso(false).catch(error => {
    console.error('Error al guardar automáticamente:', error);
  });
}

// Función eliminada: actualizarConexiones() - Las líneas de conexión ya no son necesarias

// Actualizar botones limpiar y finalizar
function actualizarBotonFinalizar() {
  const btnLimpiarTodo = document.getElementById('btnLimpiarTodo');
  const btnFinalizar = document.getElementById('btnFinalizar');
  const msgCalificaciones = document.getElementById('msgCalificaciones');
  
  if (!btnLimpiarTodo || !btnFinalizar) {
    // Los botones aún no existen en el DOM, reintentar después
    setTimeout(() => actualizarBotonFinalizar(), 100);
    return;
  }
  
  // Verificar si hay al menos una selección para habilitar Limpiar todo
  const tieneSelecciones = Object.keys(seleccionesNaipes).length > 0;
  
  // Verificar si todas las etiquetas tienen naipe asignado para habilitar Finalizar
  const todasAsignadas = etiquetasDisponibles.length > 0 && etiquetasDisponibles.every(
    etiqueta => seleccionesNaipes[etiqueta.id]
  );
  
  // Verificar si hay participantes seleccionados en la sesión
  const hayParticipantesSeleccionados = participantesDisponibles && participantesDisponibles.length > 0;
  
  // Si hay participantes seleccionados, verificar que todas las selecciones tengan calificación
  let todasCalificadas = true;
  let seleccionesSinCalificar = [];
  
  if (hayParticipantesSeleccionados && todasAsignadas) {
    // Verificar que cada selección tenga calificación (estrellas)
    Object.keys(seleccionesNaipes).forEach(etiquetaId => {
      const calificacion = calificacionesEtiquetas[etiquetaId];
      if (!calificacion || calificacion === 0) {
        todasCalificadas = false;
        const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
        if (etiqueta) {
          seleccionesSinCalificar.push(etiqueta.nombre);
        }
      }
    });
  }
  
  // Mostrar mensaje de advertencia si hay selecciones sin calificar
  if (msgCalificaciones) {
    if (hayParticipantesSeleccionados && todasAsignadas && !todasCalificadas) {
      msgCalificaciones.textContent = 'Completa selección y calificación';
      msgCalificaciones.classList.remove('hidden', 'text-green-600', 'text-gray-600');
      msgCalificaciones.classList.add('text-red-600');
    } else {
      msgCalificaciones.classList.add('hidden');
      msgCalificaciones.textContent = '';
    }
  }
  
  // Botón Limpiar todo: habilitado si hay al menos una selección
  if (tieneSelecciones) {
    btnLimpiarTodo.disabled = false;
    btnLimpiarTodo.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    btnLimpiarTodo.disabled = true;
    btnLimpiarTodo.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  // Botón Finalizar: habilitado solo si:
  // 1. Todas las etiquetas tienen naipe asignado
  // 2. Si hay participantes seleccionados, todas las selecciones deben estar calificadas
  const puedeFinalizar = todasAsignadas && (!hayParticipantesSeleccionados || todasCalificadas);
  
  if (puedeFinalizar) {
    btnFinalizar.disabled = false;
    btnFinalizar.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    btnFinalizar.disabled = true;
    btnFinalizar.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

// Función auxiliar para actualizar mensajes y conexiones después de cambios
function actualizarEstadoUI() {
  // Actualizar mensaje
  const msg = document.getElementById('msgEtiquetas');
  if (msg) {
    const faltantes = etiquetasDisponibles.filter(
      etiqueta => !seleccionesNaipes[etiqueta.id]
    ).length;
    
    if (faltantes > 0) {
      msg.textContent = `Faltan asignar ${faltantes} naipe${faltantes > 1 ? 's' : ''}`;
      msg.classList.remove('text-green-600');
      msg.classList.add('text-yellow-600');
    } else {
      msg.textContent = '✓ Todas las etiquetas tienen naipe asignado';
      msg.classList.remove('text-yellow-600');
      msg.classList.add('text-green-600');
    }
  }
  
  // Las líneas de conexión ya no son necesarias
}

// Limpiar completamente el DOM del paso de ranking
// Esto previene que se muestren datos mezclados del evento anterior
function limpiarDOMPasoRanking() {
  // Limpiar contenedor principal de ranking
  const contenedorRanking = document.getElementById('contenedorRanking');
  if (contenedorRanking) {
    contenedorRanking.innerHTML = '';
  }
  
  // Limpiar todas las secciones de resultados completos
  const contenedorRespuestasCorrectas = document.getElementById('contenedorRespuestasCorrectasParticipante');
  if (contenedorRespuestasCorrectas) {
    contenedorRespuestasCorrectas.innerHTML = '';
  }
  
  const contenedorResultadosTodos = document.getElementById('contenedorResultadosTodos');
  if (contenedorResultadosTodos) {
    contenedorResultadosTodos.innerHTML = '';
  }
  
  const contenedorTuResultado = document.getElementById('contenedorTuResultado');
  if (contenedorTuResultado) {
    contenedorTuResultado.innerHTML = '';
  }
  
  const contenedorSeleccionesUsuarios = document.getElementById('contenedorSeleccionesUsuarios');
  if (contenedorSeleccionesUsuarios) {
    contenedorSeleccionesUsuarios.innerHTML = '';
  }
  
  // Ocultar todas las secciones de resultados completos
  const respuestasCorrectasSection = document.getElementById('respuestasCorrectasParticipante');
  const resultadosTodosSection = document.getElementById('resultadosTodosParticipantes');
  const tuResultadoSection = document.getElementById('tuResultadoSection');
  const seleccionesUsuariosSection = document.getElementById('seleccionesUsuariosSection');
  
  if (respuestasCorrectasSection) respuestasCorrectasSection.classList.add('hidden');
  if (resultadosTodosSection) resultadosTodosSection.classList.add('hidden');
  if (tuResultadoSection) tuResultadoSection.classList.add('hidden');
  if (seleccionesUsuariosSection) seleccionesUsuariosSection.classList.add('hidden');
  
  // Mostrar el contenedor de ranking simple (se ocultará si hay resultados completos)
  if (contenedorRanking) {
    contenedorRanking.classList.remove('hidden');
  }
  
  // Resetear mensajes del paso de ranking
  const tituloRanking = document.getElementById('tituloRanking');
  const mensajeRanking = document.getElementById('mensajeRanking');
  const mensajeFinal = document.getElementById('mensajeFinal');
  
  if (tituloRanking) tituloRanking.textContent = 'Resultados';
  if (mensajeRanking) mensajeRanking.textContent = 'Esperando a que el anfitrión revele los resultados...';
  if (mensajeFinal) mensajeFinal.textContent = 'Gracias por participar. Los resultados se mostrarán cuando el anfitrión los revele.';
  
  console.log('DOM del paso de ranking limpiado completamente');
}

// Mostrar paso de ranking
// Mostrar selecciones finalizadas (sin resultados)
async function mostrarSeleccionesFinalizadas() {
  // Limpiar completamente el DOM antes de mostrar nuevas selecciones
  limpiarDOMPasoRanking();
  
  const pasoNombre = document.getElementById('pasoNombre');
  const pasoEtiquetas = document.getElementById('pasoEtiquetas');
  const pasoRanking = document.getElementById('pasoRanking');
  
  if (pasoNombre) pasoNombre.classList.add('hidden');
  if (pasoEtiquetas) pasoEtiquetas.classList.add('hidden');
  if (pasoRanking) pasoRanking.classList.remove('hidden');
  
  const tituloRanking = document.getElementById('tituloRanking');
  const mensajeRanking = document.getElementById('mensajeRanking');
  const mensajeFinal = document.getElementById('mensajeFinal');
  
  if (tituloRanking) tituloRanking.textContent = 'Tus Selecciones';
  if (mensajeRanking) mensajeRanking.textContent = 'Esperando a que el anfitrión revele los resultados...';
  if (mensajeFinal) mensajeFinal.textContent = 'Gracias por participar. Los resultados se mostrarán cuando el anfitrión los revele.';
  
  const contenedor = document.getElementById('contenedorRanking');
  if (!contenedor) {
    console.error('No se encontró el contenedor de ranking');
    return;
  }
  
  contenedor.innerHTML = '';
  
  const etiquetasSeleccionadas = Object.keys(seleccionesEtiquetas);
  
  if (etiquetasSeleccionadas.length === 0) {
    contenedor.innerHTML = '<p class="text-gray-600">No hay selecciones para mostrar</p>';
    return;
  }
  
  // Mostrar solo las selecciones sin indicar si son correctas
  etiquetasSeleccionadas.forEach((etiquetaId) => {
    const naipeId = seleccionesNaipes[etiquetaId];
    const naipe = naipesDisponibles.find(n => n.id === naipeId);
    
    const div = document.createElement('div');
    div.className = 'border rounded-xl p-4 bg-gray-50 border-gray-200';
    
    const info = document.createElement('div');
    info.className = 'flex justify-between items-center';
    
    const etiquetaNombre = document.createElement('p');
    etiquetaNombre.className = 'font-semibold text-gray-900';
    etiquetaNombre.textContent = seleccionesEtiquetas[etiquetaId];
    
    const naipeNombre = document.createElement('p');
    naipeNombre.className = 'text-gray-700';
    naipeNombre.textContent = naipe ? naipe.nombre : 'Naipe no encontrado';
    
    info.appendChild(etiquetaNombre);
    info.appendChild(naipeNombre);
    div.appendChild(info);
    contenedor.appendChild(div);
  });
  
  // Iniciar verificación periódica de resultados revelados
  iniciarVerificacionResultados();
}

async function mostrarPasoRanking() {
  // Limpiar completamente el DOM antes de mostrar nuevos resultados
  limpiarDOMPasoRanking();
  
  const pasoNombre = document.getElementById('pasoNombre');
  const pasoEtiquetas = document.getElementById('pasoEtiquetas');
  const pasoRanking = document.getElementById('pasoRanking');
  
  if (pasoNombre) pasoNombre.classList.add('hidden');
  if (pasoEtiquetas) pasoEtiquetas.classList.add('hidden');
  if (pasoRanking) pasoRanking.classList.remove('hidden');
  
  const tituloRanking = document.getElementById('tituloRanking');
  const mensajeRanking = document.getElementById('mensajeRanking');
  const mensajeFinal = document.getElementById('mensajeFinal');
  
  if (tituloRanking) tituloRanking.textContent = 'Resultados';
  if (mensajeRanking) mensajeRanking.textContent = 'Esperando a que el anfitrión revele los resultados...';
  if (mensajeFinal) mensajeFinal.textContent = 'Gracias por participar.';
  
  await calcularRanking();
}

// Calcular ranking personal y mostrar resultados completos
async function calcularRanking() {
  // Validar que tenemos un eventoId válido
  if (!eventoId) {
    console.error('No hay eventoId, no se puede calcular el ranking');
    const contenedor = document.getElementById('contenedorRanking');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error: No se pudo identificar el evento actual.</p>';
    }
    return;
  }
  
  // Limpiar completamente el contenedor antes de calcular el ranking
  const contenedor = document.getElementById('contenedorRanking');
  if (contenedor) {
    contenedor.innerHTML = '';
  }
  
  const etiquetasSeleccionadas = Object.keys(seleccionesEtiquetas);
  
  if (etiquetasSeleccionadas.length === 0) {
    contenedor.innerHTML = '<p class="text-gray-600">No hay selecciones para mostrar</p>';
    return;
  }
  
  // Cargar las respuestas correctas del anfitrión (sesionId = 'ANFITRION')
  const seleccionesRef = collection(db, 'selecciones');
  const qAnfitrion = query(
    seleccionesRef, 
    where('eventoId', '==', eventoId),
    where('sesionId', '==', 'ANFITRION'),
    where('finalizado', '==', true)
  );
  const anfitrionSnapshot = await getDocs(qAnfitrion);
  
  let respuestasCorrectas = {}; // { etiquetaId: naipeId }
  let seleccionesEtiquetasAnfitrion = {}; // { etiquetaId: etiquetaNombre }
  
  if (!anfitrionSnapshot.empty) {
    const anfitrionData = anfitrionSnapshot.docs[0].data();
    respuestasCorrectas = anfitrionData.seleccionesNaipes || {};
    seleccionesEtiquetasAnfitrion = anfitrionData.seleccionesEtiquetas || {};
  }
  
  // Cargar naipes del evento para obtener nombres
  const etiquetasRef = collection(db, 'etiquetas');
  const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
  const etiquetasSnapshot = await getDocs(etiquetasQuery);
  
  const naipes = [];
  etiquetasSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.naipeId && data.naipeNombre) {
      naipes.push({
        id: data.naipeId,
        nombre: data.naipeNombre
      });
    }
  });
  
  // Crear array de selecciones con información de si son correctas
  const seleccionesArray = etiquetasSeleccionadas.map(etiquetaId => {
    const naipeSeleccionado = seleccionesNaipes[etiquetaId] || null;
    const naipeCorrecto = respuestasCorrectas[etiquetaId] || null;
    const esCorrecta = naipeSeleccionado && naipeCorrecto && naipeSeleccionado === naipeCorrecto;
    
    const naipeSeleccionadoObj = naipes.find(n => n.id === naipeSeleccionado);
    const naipeCorrectoObj = naipes.find(n => n.id === naipeCorrecto);
    
    return {
      etiquetaId,
      etiquetaNombre: seleccionesEtiquetas[etiquetaId],
      naipeSeleccionado: naipeSeleccionadoObj ? naipeSeleccionadoObj.nombre : null,
      naipeCorrecto: naipeCorrectoObj ? naipeCorrectoObj.nombre : null,
      esCorrecta
    };
  });
  
  // Contar aciertos y fallos
  const aciertos = seleccionesArray.filter(s => s.esCorrecta).length;
  const fallos = seleccionesArray.filter(s => !s.esCorrecta).length;
  const total = seleccionesArray.length;
  
  // Mostrar resumen simplificado: Cantidad de aciertos vs fallos
  const resumen = document.createElement('div');
  resumen.className = 'border-2 border-purple-300 rounded-xl p-6 mb-4';
  // Estilos inline para compatibilidad (fallback si gradient no funciona)
  resumen.style.backgroundColor = '#faf5ff';
  resumen.style.background = 'linear-gradient(to right, #faf5ff, #eff6ff)';
  resumen.style.border = '2px solid #c084fc';
  resumen.style.borderRadius = '0.75rem';
  resumen.style.padding = '1.5rem';
  resumen.style.marginBottom = '1rem';
  
  const tituloResumen = document.createElement('h3');
  tituloResumen.className = 'text-lg font-semibold text-gray-900 mb-4 text-center';
  tituloResumen.textContent = 'Cantidad de aciertos vs fallos';
  resumen.appendChild(tituloResumen);
  
    const statsContainer = document.createElement('div');
    // Usar flexbox en lugar de grid para mejor compatibilidad móvil (Android e iPhone)
    statsContainer.className = 'flex';
    statsContainer.style.display = 'flex';
    statsContainer.style.flexDirection = 'row';
    statsContainer.style.flexWrap = 'wrap';
    statsContainer.style.justifyContent = 'space-around';
    statsContainer.style.gap = '0.75rem';
    statsContainer.style.width = '100%';
    statsContainer.style.boxSizing = 'border-box';
    
    // Aciertos
    const aciertosDiv = document.createElement('div');
    aciertosDiv.className = 'bg-green-50 border-2 border-green-400 rounded-lg p-4 text-center';
    aciertosDiv.style.backgroundColor = '#f0fdf4';
    aciertosDiv.style.border = '2px solid #4ade80';
    aciertosDiv.style.borderRadius = '0.5rem';
    aciertosDiv.style.padding = '1rem';
    aciertosDiv.style.textAlign = 'center';
    aciertosDiv.style.flex = '1';
    aciertosDiv.style.minWidth = '100px';
    aciertosDiv.style.maxWidth = '150px';
    aciertosDiv.style.boxSizing = 'border-box';
    aciertosDiv.style.overflow = 'hidden';
    
    const aciertosLabel = document.createElement('p');
    aciertosLabel.className = 'text-sm font-medium text-green-700 mb-2';
    aciertosLabel.style.fontSize = '0.75rem';
    aciertosLabel.style.fontWeight = '500';
    aciertosLabel.style.color = '#15803d';
    aciertosLabel.style.marginBottom = '0.5rem';
    aciertosLabel.textContent = 'Aciertos';
    
    const aciertosValor = document.createElement('p');
    aciertosValor.className = 'font-bold text-green-800';
    aciertosValor.style.fontSize = '1.5rem';
    aciertosValor.style.fontWeight = '700';
    aciertosValor.style.color = '#166534';
    aciertosValor.style.lineHeight = '1.2';
    aciertosValor.style.overflow = 'hidden';
    aciertosValor.style.textOverflow = 'ellipsis';
    aciertosValor.style.whiteSpace = 'nowrap';
    aciertosValor.textContent = aciertos;
    
    aciertosDiv.appendChild(aciertosLabel);
    aciertosDiv.appendChild(aciertosValor);
    
    // Fallos
    const fallosDiv = document.createElement('div');
    fallosDiv.className = 'bg-red-50 border-2 border-red-400 rounded-lg p-4 text-center';
    fallosDiv.style.backgroundColor = '#fef2f2';
    fallosDiv.style.border = '2px solid #f87171';
    fallosDiv.style.borderRadius = '0.5rem';
    fallosDiv.style.padding = '1rem';
    fallosDiv.style.textAlign = 'center';
    fallosDiv.style.flex = '1';
    fallosDiv.style.minWidth = '100px';
    fallosDiv.style.maxWidth = '150px';
    fallosDiv.style.boxSizing = 'border-box';
    fallosDiv.style.overflow = 'hidden';
    
    const fallosLabel = document.createElement('p');
    fallosLabel.className = 'text-sm font-medium text-red-700 mb-2';
    fallosLabel.style.fontSize = '0.75rem';
    fallosLabel.style.fontWeight = '500';
    fallosLabel.style.color = '#b91c1c';
    fallosLabel.style.marginBottom = '0.5rem';
    fallosLabel.textContent = 'Fallos';
    
    const fallosValor = document.createElement('p');
    fallosValor.className = 'font-bold text-red-800';
    fallosValor.style.fontSize = '1.5rem';
    fallosValor.style.fontWeight = '700';
    fallosValor.style.color = '#991b1b';
    fallosValor.style.lineHeight = '1.2';
    fallosValor.style.overflow = 'hidden';
    fallosValor.style.textOverflow = 'ellipsis';
    fallosValor.style.whiteSpace = 'nowrap';
    fallosValor.textContent = fallos;
    
    fallosDiv.appendChild(fallosLabel);
    fallosDiv.appendChild(fallosValor);
  
  statsContainer.appendChild(aciertosDiv);
  statsContainer.appendChild(fallosDiv);
  resumen.appendChild(statsContainer);
  
  // Total
  const totalDiv = document.createElement('div');
  totalDiv.className = 'mt-4 text-center';
  const totalTexto = document.createElement('p');
  totalTexto.className = 'text-sm text-gray-600';
  totalTexto.textContent = `Total: ${total} selecciones`;
  totalDiv.appendChild(totalTexto);
  resumen.appendChild(totalDiv);
  
  contenedor.appendChild(resumen);
  
  // Mostrar resultados completos de todos los participantes si el evento está finalizado
  await mostrarResultadosCompletos();
}

// Mostrar resultados completos (respuestas correctas y resultados de todos los participantes)
async function mostrarResultadosCompletos() {
  try {
    // Validar que tenemos un eventoId válido
    if (!eventoId) {
      console.error('No hay eventoId, no se pueden mostrar resultados completos');
      return;
    }
    
    // Verificar si el evento está finalizado
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists() || !eventoSnap.data().eventoFinalizado) {
      // El evento no está finalizado, ocultar secciones de resultados completos
      const respuestasCorrectasSection = document.getElementById('respuestasCorrectasParticipante');
      const resultadosTodosSection = document.getElementById('resultadosTodosParticipantes');
      const tuResultadoSection = document.getElementById('tuResultadoSection');
      const seleccionesUsuariosSection = document.getElementById('seleccionesUsuariosSection');
      if (respuestasCorrectasSection) respuestasCorrectasSection.classList.add('hidden');
      if (resultadosTodosSection) resultadosTodosSection.classList.add('hidden');
      if (tuResultadoSection) tuResultadoSection.classList.add('hidden');
      if (seleccionesUsuariosSection) seleccionesUsuariosSection.classList.add('hidden');
      return;
    }
    
    // Ocultar el resumen simple de aciertos/fallos cuando hay resultados completos
    const contenedorRanking = document.getElementById('contenedorRanking');
    if (contenedorRanking) {
      contenedorRanking.classList.add('hidden');
    }
    
    // Mostrar secciones de resultados completos en el orden correcto
    const respuestasCorrectasSection = document.getElementById('respuestasCorrectasParticipante');
    const resultadosTodosSection = document.getElementById('resultadosTodosParticipantes');
    const tuResultadoSection = document.getElementById('tuResultadoSection');
    const seleccionesUsuariosSection = document.getElementById('seleccionesUsuariosSection');
    
    if (respuestasCorrectasSection) respuestasCorrectasSection.classList.remove('hidden');
    if (resultadosTodosSection) resultadosTodosSection.classList.remove('hidden');
    if (tuResultadoSection) tuResultadoSection.classList.remove('hidden');
    if (seleccionesUsuariosSection) seleccionesUsuariosSection.classList.remove('hidden');
    
    // 1. Cargar solución del evento (primero)
    await cargarRespuestasCorrectasParticipante();
    
    // 2. Cargar podio y lista de participantes (segundo)
    await cargarResultadosTodosParticipantes();
    
    // 2b. Cargar podio de etiquetas (después del podio de participantes)
    await cargarResultadosEtiquetasPodio();
    
    // 3. Cargar "Tu resultado" (tercero)
    await cargarTuResultado();
    
    // 4. Cargar selecciones de todos los usuarios (cuarto)
    await cargarSeleccionesTodosUsuarios();
    
  } catch (error) {
    console.error('Error al mostrar resultados completos:', error);
  }
}

// Cargar respuestas correctas del anfitrión para mostrar al participante
async function cargarRespuestasCorrectasParticipante() {
  try {
    const seleccionesRef = collection(db, 'selecciones');
    const qAnfitrion = query(
      seleccionesRef, 
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const anfitrionSnapshot = await getDocs(qAnfitrion);
    
    const contenedor = document.getElementById('contenedorRespuestasCorrectasParticipante');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    if (anfitrionSnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No se encontraron respuestas correctas.</p>';
      return;
    }
    
    const anfitrionData = anfitrionSnapshot.docs[0].data();
    const seleccionesNaipes = anfitrionData.seleccionesNaipes || {};
    const seleccionesEtiquetas = anfitrionData.seleccionesEtiquetas || {};
    const ordenEtiquetas = anfitrionData.ordenEtiquetas || [];
    
    // Cargar naipes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const naipes = [];
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.naipeId && data.naipeNombre) {
        naipes.push({
          id: data.naipeId,
          nombre: data.naipeNombre
        });
      }
    });
    
    // Crear array de etiquetas con sus naipes para ordenar por rank del naipe
    const etiquetasConNaipes = [];
    Object.keys(seleccionesNaipes).forEach((etiquetaId) => {
      const naipeId = seleccionesNaipes[etiquetaId];
      const etiquetaNombre = seleccionesEtiquetas[etiquetaId] || 'Etiqueta desconocida';
      const naipe = naipes.find(n => n.id === naipeId);
      const naipeNombre = naipe ? naipe.nombre : 'Naipe desconocido';
      
      // Obtener el rank del naipe desde NAIPES_TRUCO
      const naipeInfo = NAIPES_TRUCO.find(n => n.id === naipeId);
      const naipeRank = naipeInfo ? naipeInfo.rank : 999; // Si no se encuentra, poner al final
      
      etiquetasConNaipes.push({
        etiquetaId,
        etiquetaNombre,
        naipeId,
        naipeNombre,
        naipeRank
      });
    });
    
    // Ordenar por rank del naipe (menor rank = más fuerte, va primero)
    // Si hay empates en el rank, ordenar alfabéticamente por nombre de etiqueta
    etiquetasConNaipes.sort((a, b) => {
      if (a.naipeRank !== b.naipeRank) {
        return a.naipeRank - b.naipeRank; // Menor rank primero (más fuerte primero)
      }
      return a.etiquetaNombre.localeCompare(b.etiquetaNombre); // Empate: orden alfabético
    });
    
    // Mostrar respuestas correctas ordenadas por rank del naipe
    etiquetasConNaipes.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'bg-white border border-green-300 rounded-lg p-3 flex justify-between items-center';
      
      const info = document.createElement('div');
      info.className = 'flex-1 flex items-center gap-3';
      
      const etiquetaEl = document.createElement('p');
      etiquetaEl.className = 'font-semibold text-gray-900';
      etiquetaEl.textContent = item.etiquetaNombre;
      
      // Mostrar imagen del naipe en lugar del texto
      const naipeImgContainer = document.createElement('div');
      naipeImgContainer.className = 'flex-shrink-0';
      
      const naipeImg = document.createElement('img');
      const rutaImagen = obtenerImagenNaipe(item.naipeId);
      naipeImg.src = rutaImagen;
      naipeImg.alt = item.naipeNombre;
      naipeImg.className = 'w-14 h-20 object-contain drop-shadow-md';
      naipeImg.title = item.naipeNombre;
      
      // Fallback a SVG si la imagen no carga
      naipeImg.onerror = function() {
        this.src = generarSVGNaipe(item.naipeId);
        this.onerror = null; // Evitar loops infinitos
      };
      
      naipeImgContainer.appendChild(naipeImg);
      
      info.appendChild(etiquetaEl);
      info.appendChild(naipeImgContainer);
      
      const check = document.createElement('div');
      check.className = 'text-green-600 text-xl';
      check.innerHTML = '✓';
      
      div.appendChild(info);
      div.appendChild(check);
      contenedor.appendChild(div);
    });
    
  } catch (error) {
    console.error('Error al cargar respuestas correctas:', error);
    const contenedor = document.getElementById('contenedorRespuestasCorrectasParticipante');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar respuestas correctas.</p>';
    }
  }
}

// Cargar resultados de todos los participantes para mostrar al participante
async function cargarResultadosTodosParticipantes() {
  try {
    // Cargar información del evento para obtener timerIniciadoEn y timerExpiraEn
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    let timerIniciadoEn = null;
    let duracionTimerMinutos = 30; // Duración por defecto
    if (eventoSnap.exists()) {
      const eventoData = eventoSnap.data();
      timerIniciadoEn = eventoData.timerIniciadoEn ? (eventoData.timerIniciadoEn instanceof Timestamp ? eventoData.timerIniciadoEn.toMillis() : eventoData.timerIniciadoEn) : null;
      // Calcular duración total del timer (puede tener minutos añadidos)
      if (timerIniciadoEn && eventoData.timerExpiraEn) {
        const timerExpiraEn = eventoData.timerExpiraEn instanceof Timestamp ? eventoData.timerExpiraEn.toMillis() : eventoData.timerExpiraEn;
        duracionTimerMinutos = (timerExpiraEn - timerIniciadoEn) / (1000 * 60);
      }
    }
    
    // Cargar respuestas correctas del anfitrión para comparar
    const seleccionesRef = collection(db, 'selecciones');
    const qAnfitrion = query(
      seleccionesRef, 
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const anfitrionSnapshot = await getDocs(qAnfitrion);
    
    let respuestasCorrectas = {};
    if (!anfitrionSnapshot.empty) {
      const anfitrionData = anfitrionSnapshot.docs[0].data();
      respuestasCorrectas = anfitrionData.seleccionesNaipes || {};
    }
    
    // Cargar todas las selecciones finalizadas de participantes (excluyendo anfitrión)
    const qParticipantes = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('finalizado', '==', true)
    );
    const participantesSnapshot = await getDocs(qParticipantes);
    
    const contenedor = document.getElementById('contenedorResultadosTodos');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    if (participantesSnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No hay participantes que hayan finalizado.</p>';
      return;
    }
    
    // Cargar naipes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const naipes = [];
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.naipeId && data.naipeNombre) {
        naipes.push({
          id: data.naipeId,
          nombre: data.naipeNombre
        });
      }
    });
    
    // Procesar cada participante
    const participantesConPuntaje = [];
    
    participantesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Saltar si es el anfitrión
      if (data.sesionId === 'ANFITRION') {
        return;
      }
      
      const nombreParticipante = data.nombreParticipante || 'Participante sin nombre';
      const seleccionesNaipes = data.seleccionesNaipes || {};
      const seleccionesEtiquetas = data.seleccionesEtiquetas || {};
      const seleccionesNaipesTimestamps = data.seleccionesNaipesTimestamps || {};
      
      // Calcular puntaje: 100 puntos por cada acierto + bonus por tiempo (igual que en resultados.js)
      let puntos = 0;
      const seleccionesArray = [];
      
      Object.keys(seleccionesNaipes).forEach((etiquetaId) => {
        const naipeSeleccionado = seleccionesNaipes[etiquetaId];
        const naipeCorrecto = respuestasCorrectas[etiquetaId];
        const esCorrecta = naipeSeleccionado && naipeCorrecto && naipeSeleccionado === naipeCorrecto;
        
        let puntosAcierto = 0;
        let puntosBonus = 0;
        
        // Si hay acierto, sumar 100 puntos base
        if (esCorrecta) {
          puntosAcierto = 100;
          
          // Calcular bonus por tiempo si hay timestamp y timer iniciado
          if (timerIniciadoEn && seleccionesNaipesTimestamps[etiquetaId]) {
            const timestampAsignacion = seleccionesNaipesTimestamps[etiquetaId];
            const tiempoTranscurrido = (timestampAsignacion - timerIniciadoEn) / (1000 * 60); // en minutos
            const tiempoRestante = duracionTimerMinutos - tiempoTranscurrido;
            
            // Bonus según tiempo:
            // Primeros 15 minutos: +25 puntos
            // Entre 15 y 25 minutos: +10 puntos
            // Últimos 5 minutos (o minutos añadidos): 0 puntos bonus
            if (tiempoTranscurrido <= 15) {
              puntosBonus = 25;
            } else if (tiempoTranscurrido <= 25) {
              puntosBonus = 10;
            } else if (tiempoRestante <= 5) {
              // Últimos 5 minutos: no hay bonus
              puntosBonus = 0;
            } else {
              // Después de 25 minutos pero no en los últimos 5: tampoco hay bonus
              puntosBonus = 0;
            }
          }
        }
        
        puntos += puntosAcierto + puntosBonus;
        
        const naipe = naipes.find(n => n.id === naipeSeleccionado);
        const naipeCorrectoObj = naipes.find(n => n.id === naipeCorrecto);
        
        seleccionesArray.push({
          etiquetaNombre: seleccionesEtiquetas[etiquetaId] || 'Etiqueta desconocida',
          naipeSeleccionado: naipe ? naipe.nombre : 'Naipe desconocido',
          naipeCorrecto: naipeCorrectoObj ? naipeCorrectoObj.nombre : 'Naipe desconocido',
          esCorrecta
        });
      });
      
      participantesConPuntaje.push({
        nombre: nombreParticipante,
        puntos,
        selecciones: seleccionesArray
      });
    });
    
    // Ordenar por puntaje decreciente (mayor a menor)
    participantesConPuntaje.sort((a, b) => {
      if (b.puntos !== a.puntos) {
        return b.puntos - a.puntos;
      }
      return a.nombre.localeCompare(b.nombre);
    });
    
    // Agrupar por puntaje para manejar empates
    const participantesAgrupados = [];
    let grupoActual = [];
    let puntajeAnterior = null;
    
    participantesConPuntaje.forEach((participante, index) => {
      if (puntajeAnterior === null || participante.puntos === puntajeAnterior) {
        // Mismo puntaje que el anterior (empate)
        grupoActual.push({ ...participante, indiceOriginal: index });
      } else {
        // Nuevo puntaje, guardar grupo anterior y empezar nuevo
        if (grupoActual.length > 0) {
          participantesAgrupados.push({
            puntaje: puntajeAnterior,
            participantes: grupoActual,
            posicionInicial: participantesAgrupados.reduce((sum, g) => sum + g.participantes.length, 0) + 1
          });
        }
        grupoActual = [{ ...participante, indiceOriginal: index }];
      }
      puntajeAnterior = participante.puntos;
    });
    
    // Agregar el último grupo
    if (grupoActual.length > 0) {
      participantesAgrupados.push({
        puntaje: puntajeAnterior,
        participantes: grupoActual,
        posicionInicial: participantesAgrupados.reduce((sum, g) => sum + g.participantes.length, 0) + 1
      });
    }
    
    // Separar podio (primeros 3 puestos, considerando empates) del resto
    const podio = [];
    const resto = [];
    let posicionActual = 1;
    
    participantesAgrupados.forEach(grupo => {
      const posicionFinal = posicionActual + grupo.participantes.length - 1;
      
      if (posicionActual <= 3) {
        // Está en el podio (puede haber empates)
        grupo.participantes.forEach(p => {
          podio.push({ ...p, posicion: posicionActual, posicionFinal });
        });
      } else {
        // Fuera del podio
        grupo.participantes.forEach(p => {
          resto.push({ ...p, posicion: posicionActual });
        });
      }
      
      posicionActual = posicionFinal + 1;
    });
    
    // Crear contenedor del podio (manejando empates)
    if (podio.length > 0) {
      const podioContainer = document.createElement('div');
      podioContainer.className = 'mb-8';
      
      const podioTitle = document.createElement('h2');
      podioTitle.className = 'text-2xl font-bold text-center text-purple-700 mb-6';
      podioTitle.textContent = '🏆 Podio de Participantes';
      podioContainer.appendChild(podioTitle);
      
      // Agrupar podio por posición (para manejar empates)
      const podioPorPosicion = {
        1: podio.filter(p => p.posicion === 1),
        2: podio.filter(p => p.posicion === 2),
        3: podio.filter(p => p.posicion === 3)
      };
      
      // Detectar si hay empates
      const hayEmpate = (podioPorPosicion[1] && podioPorPosicion[1].length > 1) ||
                        (podioPorPosicion[2] && podioPorPosicion[2].length > 1) ||
                        (podioPorPosicion[3] && podioPorPosicion[3].length > 1);
      
      const tienePosicion1 = podioPorPosicion[1] && podioPorPosicion[1].length > 0;
      const tienePosicion2 = podioPorPosicion[2] && podioPorPosicion[2].length > 0;
      const tienePosicion3 = podioPorPosicion[3] && podioPorPosicion[3].length > 0;
      
      const podioGrid = document.createElement('div');
      podioGrid.className = 'flex items-end justify-center mb-6 flex-wrap';
      // Estilos inline para compatibilidad cross-browser
      podioGrid.style.display = 'flex';
      podioGrid.style.marginBottom = '1.5rem';
      podioGrid.style.width = '100%';
      
      if (hayEmpate) {
        // Si hay empate: mostrar todo el podio verticalmente
        podioGrid.style.flexDirection = 'column';
        podioGrid.style.alignItems = 'center';
        podioGrid.style.justifyContent = 'flex-start';
        podioGrid.style.flexWrap = 'nowrap';
      } else {
        // Si NO hay empate: podio horizontal tradicional
        podioGrid.style.flexDirection = 'row';
        podioGrid.style.alignItems = 'flex-end';
        podioGrid.style.justifyContent = 'center';
        podioGrid.style.flexWrap = 'wrap';
      }
      
      if (hayEmpate) {
        // Si hay empate: mostrar verticalmente en orden descendente
        // Orden: 1ro (arriba), 2do (medio), 3ro (abajo)
        const crearContenedorEmpate = (participantes, posicionReal, tipoMedalla) => {
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '0.5rem 0'; // Margen vertical cuando hay empate
          container.style.marginLeft = '0';
          container.style.marginRight = '0';
          container.style.width = '100%';
          container.style.maxWidth = '300px';
          
          // Ordenar participantes en orden descendente (mayor a menor puntaje)
          const participantesOrdenados = [...participantes].sort((a, b) => b.puntos - a.puntos);
          
          participantesOrdenados.forEach((p, idx) => {
            const item = crearPodiumItemParticipante(p, posicionReal, tipoMedalla, participantes.length > 1);
            if (idx > 0) {
              item.style.marginTop = '0.5rem';
            }
            container.appendChild(item);
          });
          
          return container;
        };
        
        // Mostrar en orden: 1ro, 2do, 3ro (verticalmente)
        if (tienePosicion1) {
          const primeroContainer = crearContenedorEmpate(podioPorPosicion[1], 1, 'oro');
          podioGrid.appendChild(primeroContainer);
        }
        
        if (tienePosicion2) {
          const segundoContainer = crearContenedorEmpate(podioPorPosicion[2], 2, 'plata');
          podioGrid.appendChild(segundoContainer);
        }
        
        if (tienePosicion3) {
          const terceroContainer = crearContenedorEmpate(podioPorPosicion[3], 3, 'bronce');
          podioGrid.appendChild(terceroContainer);
        }
      } else {
        // Si NO hay empate: podio tradicional
        // Orden: centro (1ro, más alto), derecha (2do, levemente más abajo), izquierda (3ro, levemente más abajo)
        const crearContenedorTradicional = (participante, posicionReal, tipoMedalla, altura) => {
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '0 0.5rem';
          container.style.minWidth = '120px';
          
          // Ajustar altura según posición (1ro más alto, 2do medio, 3ro más bajo)
          if (altura === 'alto') {
            // Primero: más arriba (sin margen inferior adicional)
            container.style.marginBottom = '0';
          } else if (altura === 'medio') {
            // Segundo: levemente más abajo
            container.style.marginBottom = '1rem';
          } else if (altura === 'bajo') {
            // Tercero: más abajo que el segundo
            container.style.marginBottom = '1.5rem';
          }
          
          const item = crearPodiumItemParticipante(participante, posicionReal, tipoMedalla, false);
          container.appendChild(item);
          
          return container;
        };
        
        // Orden tradicional: centro (1ro), derecha (2do), izquierda (3ro)
        if (tienePosicion1) {
          const primeroContainer = crearContenedorTradicional(
            podioPorPosicion[1][0], 
            1, 
            'oro', 
            'alto'
          );
          primeroContainer.style.order = '2'; // Centro
          podioGrid.appendChild(primeroContainer);
        }
        
        if (tienePosicion2) {
          const segundoContainer = crearContenedorTradicional(
            podioPorPosicion[2][0], 
            2, 
            'plata', 
            'medio'
          );
          segundoContainer.style.order = '3'; // Derecha
          podioGrid.appendChild(segundoContainer);
        }
        
        if (tienePosicion3) {
          const terceroContainer = crearContenedorTradicional(
            podioPorPosicion[3][0], 
            3, 
            'bronce', 
            'bajo'
          );
          terceroContainer.style.order = '1'; // Izquierda
          podioGrid.appendChild(terceroContainer);
        }
      }
      
      podioContainer.appendChild(podioGrid);
      contenedor.appendChild(podioContainer);
    }
    
    // Mostrar el resto en lista
    if (resto.length > 0) {
      const listaTitle = document.createElement('h2');
      listaTitle.className = 'text-xl font-bold text-gray-700 mb-4';
      listaTitle.textContent = 'Resto de participantes';
      contenedor.appendChild(listaTitle);
    }
    
    resto.forEach((participante) => {
      const div = crearParticipanteListItemParticipante(participante, participante.posicion);
      contenedor.appendChild(div);
    });
    
  } catch (error) {
    console.error('Error al cargar resultados de participantes:', error);
    const contenedor = document.getElementById('contenedorResultadosTodos');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar resultados de participantes.</p>';
    }
  }
}

// Cargar resultados del podio de etiquetas basado en orden de preferencia
async function cargarResultadosEtiquetasPodio() {
  try {
    // Cargar todas las selecciones finalizadas de participantes (excluyendo anfitrión)
    const seleccionesRef = collection(db, 'selecciones');
    const qParticipantes = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('finalizado', '==', true)
    );
    const participantesSnapshot = await getDocs(qParticipantes);
    
    // Cargar etiquetas del evento para obtener la cantidad total y nombres
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const cantidadTotalEtiquetas = etiquetasSnapshot.size;
    if (cantidadTotalEtiquetas === 0) {
      return; // No hay etiquetas, no mostrar podio
    }
    
    // Crear mapa de etiquetas: { etiquetaId: { id, nombre, puntos: 0, calificaciones: [] } }
    const etiquetasMap = {};
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      const etiquetaId = data.etiquetaId || doc.id;
      etiquetasMap[etiquetaId] = {
        id: etiquetaId,
        nombre: data.etiquetaNombre || 'Etiqueta sin nombre',
        puntos: 0,
        calificaciones: [] // Array para acumular calificaciones válidas (excluyendo 0)
      };
    });
    
    // Cargar solución del anfitrión para obtener el orden de mérito
    const qAnfitrion = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const anfitrionSnapshot = await getDocs(qAnfitrion);

    let ordenEtiquetasAnfitrion = [];
    let seleccionesNaipesAnfitrion = {};
    if (!anfitrionSnapshot.empty) {
      const anfitrionData = anfitrionSnapshot.docs[0].data();
      ordenEtiquetasAnfitrion = anfitrionData.ordenEtiquetas || [];
      seleccionesNaipesAnfitrion = anfitrionData.seleccionesNaipes || {};
      console.log('Solución del anfitrión cargada:');
      console.log('  ordenEtiquetasAnfitrion:', ordenEtiquetasAnfitrion);
      console.log('  seleccionesNaipesAnfitrion:', seleccionesNaipesAnfitrion);
    } else {
      console.log('⚠️ No se encontró solución del anfitrión');
    }
    
    console.log(`\n=== Solución del Anfitrión ===`);
    console.log(`Orden de etiquetas del anfitrión:`, ordenEtiquetasAnfitrion);
    console.log(`Selecciones de naipes del anfitrión:`, seleccionesNaipesAnfitrion);
    
    const CONSTANTE_SCORING = 50;
    
    // Procesar cada participante y acumular puntos por etiqueta
    participantesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Saltar si es el anfitrión
      if (data.sesionId === 'ANFITRION') {
        return;
      }
      
      const nombreParticipante = data.nombreParticipante || 'Participante sin nombre';
      const seleccionesNaipesParticipante = data.seleccionesNaipes || {};
      const calificacionesParticipante = data.calificacionesEtiquetas || {}; // Calificaciones de estrellas (1-5)
      
      console.log(`\n=== Participante: ${nombreParticipante} ===`);
      console.log(`Selecciones de naipes:`, seleccionesNaipesParticipante);
      console.log(`Calificaciones de estrellas:`, calificacionesParticipante);
      
      // Nueva lógica de scoring basada en calificaciones de estrellas:
      // 1. Iterar sobre las etiquetas que el participante calificó (con estrellas)
      // 2. Para cada etiqueta calificada, obtener el naipe que el participante asignó
      // 3. Buscar en la solución del anfitrión qué etiqueta tiene ese mismo naipe
      // 4. Obtener la calificación de estrellas (1-5) o usar 1 como mínimo si no hay calificación
      // 5. Calcular puntos = 50 × calificación
      // 6. Sumar puntos a la etiqueta REAL del anfitrión
      Object.keys(calificacionesParticipante).forEach((etiquetaIdParticipante) => {
        const calificacion = calificacionesParticipante[etiquetaIdParticipante];
        // Usar calificación o 1 como mínimo si no hay calificación válida
        const calificacionFinal = (calificacion && calificacion >= 1 && calificacion <= 5) ? calificacion : 1;
        const naipeIdParticipante = seleccionesNaipesParticipante[etiquetaIdParticipante];
        
        // Solo calcular si el participante asignó un naipe a esta etiqueta
        if (!naipeIdParticipante) {
          console.log(`  Etiqueta ${etiquetaIdParticipante}: Participante no asignó naipe`);
          return;
        }
        
        // Buscar en la solución del anfitrión qué etiqueta tiene este naipe
        let etiquetaIdAnfitrionEncontrada = null;
        const naipeIdParticipanteNormalizado = String(naipeIdParticipante).trim();
        
        for (const etiquetaIdAnfitrion of Object.keys(seleccionesNaipesAnfitrion)) {
          const naipeIdAnfitrion = seleccionesNaipesAnfitrion[etiquetaIdAnfitrion];
          const naipeIdAnfitrionNormalizado = String(naipeIdAnfitrion).trim();
          
          if (naipeIdAnfitrionNormalizado === naipeIdParticipanteNormalizado) {
            etiquetaIdAnfitrionEncontrada = etiquetaIdAnfitrion;
            break; // Encontramos el naipe, no necesitamos seguir buscando
          }
        }
        
        if (etiquetaIdAnfitrionEncontrada && etiquetasMap[etiquetaIdAnfitrionEncontrada]) {
          // Calcular puntos basado en la calificación de estrellas
          // 5 estrellas = 50 × 5 = 250 puntos
          // 4 estrellas = 50 × 4 = 200 puntos
          // 3 estrellas = 50 × 3 = 150 puntos
          // 2 estrellas = 50 × 2 = 100 puntos
          // 1 estrella = 50 × 1 = 50 puntos
          // Sin estrellas = 50 × 1 = 50 puntos (valor mínimo)
          const puntosEtiqueta = CONSTANTE_SCORING * calificacionFinal;
          
          // Acumular calificación válida (excluyendo 0) para calcular promedio
          if (calificacionFinal > 0) {
            etiquetasMap[etiquetaIdAnfitrionEncontrada].calificaciones.push(calificacionFinal);
          }
          
          console.log(`  Etiqueta calificada por participante:`);
          console.log(`    Etiqueta del participante: ${etiquetasMap[etiquetaIdParticipante]?.nombre || etiquetaIdParticipante} (${etiquetaIdParticipante})`);
          console.log(`    Naipe asignado: ${naipeIdParticipante}`);
          console.log(`    Calificación de estrellas: ${calificacionFinal}`);
          console.log(`    Etiqueta REAL (solución anfitrión): ${etiquetasMap[etiquetaIdAnfitrionEncontrada].nombre} (${etiquetaIdAnfitrionEncontrada})`);
          console.log(`    Puntos: ${puntosEtiqueta} (50 × ${calificacionFinal})`);
          console.log(`    Puntos acumulados para ${etiquetasMap[etiquetaIdAnfitrionEncontrada].nombre}: ${etiquetasMap[etiquetaIdAnfitrionEncontrada].puntos} → ${etiquetasMap[etiquetaIdAnfitrionEncontrada].puntos + puntosEtiqueta}`);
          
          etiquetasMap[etiquetaIdAnfitrionEncontrada].puntos += puntosEtiqueta;
        } else {
          console.log(`  Etiqueta ${etiquetaIdParticipante} - Naipe ${naipeIdParticipante} no encontrado en solución del anfitrión`);
          if (!etiquetaIdAnfitrionEncontrada) {
            console.log(`    Buscando naipe ${naipeIdParticipante} en seleccionesNaipesAnfitrion:`, seleccionesNaipesAnfitrion);
          }
        }
      });
    });
    
    // Calcular promedio de calificaciones para cada etiqueta
    Object.keys(etiquetasMap).forEach(etiquetaId => {
      const etiqueta = etiquetasMap[etiquetaId];
      if (etiqueta.calificaciones.length > 0) {
        const suma = etiqueta.calificaciones.reduce((acc, cal) => acc + cal, 0);
        etiqueta.promedioCalificacion = suma / etiqueta.calificaciones.length;
      } else {
        etiqueta.promedioCalificacion = null; // No hay calificaciones válidas
      }
    });
    
    // Convertir mapa a array y ordenar por puntos decreciente
    console.log(`\n=== Resumen final de puntos por etiqueta ===`);
    const etiquetasConPuntaje = Object.values(etiquetasMap).filter(e => e.puntos > 0);
    etiquetasConPuntaje.forEach(e => {
      console.log(`${e.nombre}: ${e.puntos} puntos, promedio: ${e.promedioCalificacion || 'N/A'}`);
    });
    
    // Ordenar por puntaje decreciente (mayor a menor)
    etiquetasConPuntaje.sort((a, b) => {
      if (b.puntos !== a.puntos) {
        return b.puntos - a.puntos;
      }
      return a.nombre.localeCompare(b.nombre);
    });
    
    // Agrupar por puntaje para manejar empates
    const etiquetasAgrupadas = [];
    let grupoActual = [];
    let puntajeAnterior = null;
    
    etiquetasConPuntaje.forEach((etiqueta, index) => {
      if (puntajeAnterior === null || etiqueta.puntos === puntajeAnterior) {
        grupoActual.push({ ...etiqueta, indiceOriginal: index });
      } else {
        if (grupoActual.length > 0) {
          etiquetasAgrupadas.push({
            puntaje: puntajeAnterior,
            etiquetas: grupoActual,
            posicionInicial: etiquetasAgrupadas.reduce((sum, g) => sum + g.etiquetas.length, 0) + 1
          });
        }
        grupoActual = [{ ...etiqueta, indiceOriginal: index }];
      }
      puntajeAnterior = etiqueta.puntos;
    });
    
    if (grupoActual.length > 0) {
      etiquetasAgrupadas.push({
        puntaje: puntajeAnterior,
        etiquetas: grupoActual,
        posicionInicial: etiquetasAgrupadas.reduce((sum, g) => sum + g.etiquetas.length, 0) + 1
      });
    }
    
    // Separar podio (primeros 3 puestos) del resto
    const podio = [];
    const resto = [];
    let posicionActual = 1;
    
    etiquetasAgrupadas.forEach(grupo => {
      const posicionFinal = posicionActual + grupo.etiquetas.length - 1;
      
      if (posicionActual <= 3) {
        grupo.etiquetas.forEach(e => {
          podio.push({ ...e, posicion: posicionActual, posicionFinal });
        });
      } else {
        grupo.etiquetas.forEach(e => {
          resto.push({ ...e, posicion: posicionActual });
        });
      }
      
      posicionActual = posicionFinal + 1;
    });
    
    // Obtener contenedor (usar el mismo contenedor de resultados o crear uno nuevo)
    const contenedor = document.getElementById('contenedorResultadosTodos');
    if (!contenedor) return;
    
    // Crear contenedor del podio de etiquetas
    if (podio.length > 0) {
      const podioContainer = document.createElement('div');
      podioContainer.className = 'mb-8';
      
      const podioTitle = document.createElement('h2');
      podioTitle.className = 'text-2xl font-bold text-center text-purple-700 mb-6';
      podioTitle.textContent = '🏆 Podio de Etiquetas';
      podioContainer.appendChild(podioTitle);
      
      // Agrupar podio por posición (para manejar empates)
      const podioPorPosicion = {
        1: podio.filter(p => p.posicion === 1),
        2: podio.filter(p => p.posicion === 2),
        3: podio.filter(p => p.posicion === 3)
      };
      
      // Detectar si hay empates
      const hayEmpate = (podioPorPosicion[1] && podioPorPosicion[1].length > 1) ||
                        (podioPorPosicion[2] && podioPorPosicion[2].length > 1) ||
                        (podioPorPosicion[3] && podioPorPosicion[3].length > 1);
      
      const tienePosicion1 = podioPorPosicion[1] && podioPorPosicion[1].length > 0;
      const tienePosicion2 = podioPorPosicion[2] && podioPorPosicion[2].length > 0;
      const tienePosicion3 = podioPorPosicion[3] && podioPorPosicion[3].length > 0;
      
      const podioGrid = document.createElement('div');
      podioGrid.className = 'flex items-end justify-center mb-6 flex-wrap';
      // Estilos inline para compatibilidad cross-browser
      podioGrid.style.display = 'flex';
      podioGrid.style.marginBottom = '1.5rem';
      podioGrid.style.width = '100%';
      
      if (hayEmpate) {
        // Si hay empate: mostrar todo el podio verticalmente
        podioGrid.style.flexDirection = 'column';
        podioGrid.style.alignItems = 'center';
        podioGrid.style.justifyContent = 'flex-start';
        podioGrid.style.flexWrap = 'nowrap';
      } else {
        // Si NO hay empate: podio horizontal centrado en orden descendente
        podioGrid.style.flexDirection = 'row';
        podioGrid.style.alignItems = 'center'; // Todos alineados al mismo nivel
        podioGrid.style.justifyContent = 'center';
        podioGrid.style.flexWrap = 'wrap';
      }
      
      if (hayEmpate) {
        // Si hay empate: mostrar verticalmente en orden descendente
        // Orden: 1ro (arriba), 2do (medio), 3ro (abajo)
        const crearContenedorEmpate = (etiquetas, posicionReal, tipoMedalla) => {
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '0.5rem 0'; // Margen vertical cuando hay empate
          container.style.marginLeft = '0';
          container.style.marginRight = '0';
          container.style.width = '100%';
          container.style.maxWidth = '300px';
          
          // Ordenar etiquetas en orden descendente (mayor a menor puntaje)
          const etiquetasOrdenadas = [...etiquetas].sort((a, b) => b.puntos - a.puntos);
          
          etiquetasOrdenadas.forEach((e, idx) => {
            const item = crearPodiumItemEtiqueta(e, posicionReal, tipoMedalla, etiquetas.length > 1);
            if (idx > 0) {
              item.style.marginTop = '0.5rem';
            }
            container.appendChild(item);
          });
          
          return container;
        };
        
        // Mostrar en orden: 1ro, 2do, 3ro (verticalmente)
        if (tienePosicion1) {
          const primeroContainer = crearContenedorEmpate(podioPorPosicion[1], 1, 'oro');
          podioGrid.appendChild(primeroContainer);
        }
        
        if (tienePosicion2) {
          const segundoContainer = crearContenedorEmpate(podioPorPosicion[2], 2, 'plata');
          podioGrid.appendChild(segundoContainer);
        }
        
        if (tienePosicion3) {
          const terceroContainer = crearContenedorEmpate(podioPorPosicion[3], 3, 'bronce');
          podioGrid.appendChild(terceroContainer);
        }
      } else {
        // Si NO hay empate: podio horizontal centrado en orden descendente (#1, #2, #3)
        const crearContenedorSimple = (etiqueta, posicionReal, tipoMedalla) => {
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '0 0.5rem';
          container.style.minWidth = '120px';
          
          const item = crearPodiumItemEtiqueta(etiqueta, posicionReal, tipoMedalla, false);
          container.appendChild(item);
          
          return container;
        };
        
        // Orden descendente simple: #1, #2, #3 (de izquierda a derecha, centrado)
        if (tienePosicion1) {
          const primeroContainer = crearContenedorSimple(
            podioPorPosicion[1][0], 
            1, 
            'oro'
          );
          podioGrid.appendChild(primeroContainer);
        }
        
        if (tienePosicion2) {
          const segundoContainer = crearContenedorSimple(
            podioPorPosicion[2][0], 
            2, 
            'plata'
          );
          podioGrid.appendChild(segundoContainer);
        }
        
        if (tienePosicion3) {
          const terceroContainer = crearContenedorSimple(
            podioPorPosicion[3][0], 
            3, 
            'bronce'
          );
          podioGrid.appendChild(terceroContainer);
        }
      }
      
      podioContainer.appendChild(podioGrid);
      contenedor.appendChild(podioContainer);
    }
    
    // Mostrar el resto en lista si hay
    if (resto.length > 0) {
      const listaTitle = document.createElement('h2');
      listaTitle.className = 'text-xl font-bold text-gray-700 mb-4';
      listaTitle.textContent = 'Resto de etiquetas';
      contenedor.appendChild(listaTitle);
    }
    
    resto.forEach((etiqueta) => {
      const div = crearEtiquetaListItem(etiqueta, etiqueta.posicion);
      contenedor.appendChild(div);
    });
    
  } catch (error) {
    console.error('Error al cargar resultados de etiquetas:', error);
  }
}

// Crear item del podio para etiquetas
function crearPodiumItemEtiqueta(etiqueta, posicion, tipoMedalla, esEmpate = false) {
  const div = document.createElement('div');
  div.className = 'flex flex-col items-center';
  // Estilos inline para compatibilidad
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'center';
  div.style.width = '100%';
  div.style.maxWidth = '200px';
  
  const medallas = {
    oro: '🥇',
    plata: '🥈',
    bronce: '🥉'
  };
  
  const colores = {
    oro: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
    plata: { bg: '#f3f4f6', border: '#9ca3af', text: '#1f2937' },
    bronce: { bg: '#fed7aa', border: '#fb923c', text: '#9a3412' }
  };
  
  const color = colores[tipoMedalla];
  
  // Medalla - ajustar al mismo nivel
  const medalla = document.createElement('div');
  medalla.className = 'text-6xl mb-2';
  medalla.style.fontSize = '3.75rem';
  medalla.style.lineHeight = '1';
  medalla.style.marginBottom = '0.5rem';
  medalla.style.display = 'block';
  medalla.style.height = '4rem'; // Altura fija para alinear todas las medallas
  medalla.style.display = 'flex';
  medalla.style.alignItems = 'center';
  medalla.style.justifyContent = 'center';
  medalla.textContent = medallas[tipoMedalla];
  div.appendChild(medalla);
  
  // Nombre
  const nombre = document.createElement('h3');
  nombre.className = `text-lg font-bold mb-1`;
  nombre.style.fontSize = '1.125rem';
  nombre.style.fontWeight = '700';
  nombre.style.color = color.text;
  nombre.style.marginBottom = '0.25rem';
  nombre.style.textAlign = 'center';
  nombre.style.wordBreak = 'break-word';
  nombre.textContent = etiqueta.nombre;
  div.appendChild(nombre);
  
  // Puntos
  const puntaje = document.createElement('div');
  puntaje.className = `text-xl font-bold`;
  puntaje.style.fontSize = '1.25rem';
  puntaje.style.fontWeight = '700';
  puntaje.style.color = color.text;
  puntaje.style.textAlign = 'center';
  puntaje.textContent = `${etiqueta.puntos} puntos`;
  div.appendChild(puntaje);
  
  // Promedio de calificaciones en formato de estrellas
  if (etiqueta.promedioCalificacion !== null && etiqueta.promedioCalificacion !== undefined) {
    const promedioContainer = document.createElement('div');
    promedioContainer.className = 'flex items-center justify-center gap-1 mt-2';
    promedioContainer.style.marginTop = '0.5rem';
    
    const promedioEstrellas = crearEstrellasPromedio(etiqueta.promedioCalificacion);
    promedioContainer.appendChild(promedioEstrellas);
    
    div.appendChild(promedioContainer);
  }
  
  // Indicador de empate si aplica
  if (esEmpate) {
    const empateLabel = document.createElement('div');
    empateLabel.className = 'text-xs text-gray-600 mt-1';
    empateLabel.style.fontSize = '0.75rem';
    empateLabel.style.color = '#4b5563';
    empateLabel.style.marginTop = '0.25rem';
    empateLabel.textContent = '(Empate)';
    div.appendChild(empateLabel);
  }
  
  return div;
}

// Crear componente de estrellas para mostrar promedio (con decimales)
function crearEstrellasPromedio(promedio) {
  const contenedor = document.createElement('div');
  contenedor.className = 'flex items-center gap-0.5';
  
  // Crear 5 estrellas
  for (let i = 1; i <= 5; i++) {
    const estrella = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    estrella.setAttribute('width', '16');
    estrella.setAttribute('height', '16');
    estrella.setAttribute('viewBox', '0 0 24 24');
    estrella.setAttribute('stroke', '#fbbf24');
    estrella.setAttribute('stroke-width', '2');
    estrella.setAttribute('stroke-linecap', 'round');
    estrella.setAttribute('stroke-linejoin', 'round');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    
    // Determinar si la estrella está completamente llena, parcialmente llena, o vacía
    if (i <= Math.floor(promedio)) {
      // Estrella completamente llena
      estrella.setAttribute('fill', '#fbbf24');
      estrella.setAttribute('class', 'text-yellow-400');
      path.setAttribute('fill', '#fbbf24');
    } else if (i === Math.ceil(promedio) && promedio % 1 !== 0) {
      // Estrella parcialmente llena - usar clipPath para mostrar solo la parte llena
      const porcentaje = (promedio % 1) * 100;
      const clipId = `clip-${i}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Crear definiciones para el clipPath
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipId);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', `${porcentaje}%`);
      rect.setAttribute('height', '24');
      
      clipPath.appendChild(rect);
      defs.appendChild(clipPath);
      estrella.appendChild(defs);
      
      // Estrella de fondo (vacía)
      const pathFondo = path.cloneNode(true);
      pathFondo.setAttribute('fill', 'none');
      pathFondo.setAttribute('class', 'text-gray-300');
      estrella.appendChild(pathFondo);
      
      // Estrella llena con clipPath
      const pathLlena = path.cloneNode(true);
      pathLlena.setAttribute('fill', '#fbbf24');
      pathLlena.setAttribute('clip-path', `url(#${clipId})`);
      estrella.appendChild(pathLlena);
      
      estrella.setAttribute('class', 'text-yellow-400');
    } else {
      // Estrella vacía
      estrella.setAttribute('fill', 'none');
      estrella.setAttribute('class', 'text-gray-300');
      path.setAttribute('fill', 'none');
    }
    
    if (!(i === Math.ceil(promedio) && promedio % 1 !== 0)) {
      estrella.appendChild(path);
    }
    
    contenedor.appendChild(estrella);
  }
  
  // Agregar el valor numérico del promedio
  const promedioTexto = document.createElement('span');
  promedioTexto.className = 'text-xs text-gray-600 ml-1';
  promedioTexto.style.fontSize = '0.75rem';
  promedioTexto.style.color = '#4b5563';
  promedioTexto.style.marginLeft = '0.25rem';
  promedioTexto.textContent = promedio.toFixed(1);
  contenedor.appendChild(promedioTexto);
  
  return contenedor;
}

// Crear item del podio para participantes
function crearPodiumItemParticipante(participante, posicion, tipoMedalla, esEmpate = false) {
  const div = document.createElement('div');
  div.className = 'flex flex-col items-center';
  // Estilos inline para compatibilidad
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'center';
  div.style.width = '100%';
  div.style.maxWidth = '200px';
  
  const medallas = {
    oro: '🥇',
    plata: '🥈',
    bronce: '🥉'
  };
  
  const colores = {
    oro: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
    plata: { bg: '#f3f4f6', border: '#9ca3af', text: '#1f2937' },
    bronce: { bg: '#fed7aa', border: '#fb923c', text: '#9a3412' }
  };
  
  const color = colores[tipoMedalla];
  
  // Medalla - ajustar al mismo nivel
  const medalla = document.createElement('div');
  medalla.className = 'text-6xl mb-2';
  medalla.style.fontSize = '3.75rem';
  medalla.style.lineHeight = '1';
  medalla.style.marginBottom = '0.5rem';
  medalla.style.display = 'block';
  medalla.style.height = '4rem'; // Altura fija para alinear todas las medallas
  medalla.style.display = 'flex';
  medalla.style.alignItems = 'center';
  medalla.style.justifyContent = 'center';
  medalla.textContent = medallas[tipoMedalla];
  div.appendChild(medalla);
  
  // Nombre
  const nombre = document.createElement('h3');
  nombre.className = `text-lg font-bold mb-1`;
  nombre.style.fontSize = '1.125rem';
  nombre.style.fontWeight = '700';
  nombre.style.color = color.text;
  nombre.style.marginBottom = '0.25rem';
  nombre.style.textAlign = 'center';
  nombre.style.wordBreak = 'break-word';
  nombre.textContent = participante.nombre;
  div.appendChild(nombre);
  
  // Puntos
  const puntaje = document.createElement('div');
  puntaje.className = `text-xl font-bold`;
  puntaje.style.fontSize = '1.25rem';
  puntaje.style.fontWeight = '700';
  puntaje.style.color = color.text;
  puntaje.style.textAlign = 'center';
  puntaje.textContent = `${participante.puntos} puntos`;
  div.appendChild(puntaje);
  
  // Indicador de empate si aplica
  if (esEmpate) {
    const empateLabel = document.createElement('div');
    empateLabel.className = 'text-xs text-gray-600 mt-1';
    empateLabel.style.fontSize = '0.75rem';
    empateLabel.style.color = '#4b5563';
    empateLabel.style.marginTop = '0.25rem';
    empateLabel.textContent = '(Empate)';
    div.appendChild(empateLabel);
  }
  
  return div;
}

// Cargar "Tu resultado" - resultado del participante actual
async function cargarTuResultado() {
  try {
    const contenedor = document.getElementById('contenedorTuResultado');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Buscar la selección del participante actual
    const seleccionesRef = collection(db, 'selecciones');
    const qParticipante = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('sesionId', '==', sesionId),
      where('finalizado', '==', true)
    );
    const participanteSnapshot = await getDocs(qParticipante);
    
    if (participanteSnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No se encontró tu resultado.</p>';
      return;
    }
    
    const participanteData = participanteSnapshot.docs[0].data();
    const seleccionesNaipesParticipante = participanteData.seleccionesNaipes || {};
    const seleccionesEtiquetasParticipante = participanteData.seleccionesEtiquetas || {};
    const seleccionesNaipesTimestampsParticipante = participanteData.seleccionesNaipesTimestamps || {};
    
    // Cargar respuestas correctas del anfitrión
    const qAnfitrion = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const anfitrionSnapshot = await getDocs(qAnfitrion);
    
    let respuestasCorrectas = {};
    if (!anfitrionSnapshot.empty) {
      const anfitrionData = anfitrionSnapshot.docs[0].data();
      respuestasCorrectas = anfitrionData.seleccionesNaipes || {};
    }
    
    // Cargar información del evento para calcular bonus
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    let timerIniciadoEn = null;
    let duracionTimerMinutos = 30;
    if (eventoSnap.exists()) {
      const eventoData = eventoSnap.data();
      timerIniciadoEn = eventoData.timerIniciadoEn ? (eventoData.timerIniciadoEn instanceof Timestamp ? eventoData.timerIniciadoEn.toMillis() : eventoData.timerIniciadoEn) : null;
      if (timerIniciadoEn && eventoData.timerExpiraEn) {
        const timerExpiraEn = eventoData.timerExpiraEn instanceof Timestamp ? eventoData.timerExpiraEn.toMillis() : eventoData.timerExpiraEn;
        duracionTimerMinutos = (timerExpiraEn - timerIniciadoEn) / (1000 * 60);
      }
    }
    
    // Cargar naipes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const naipes = [];
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.naipeId && data.naipeNombre) {
        naipes.push({
          id: data.naipeId,
          nombre: data.naipeNombre
        });
      }
    });
    
    // Calcular puntaje total
    let puntosTotal = 0;
    let aciertos = 0;
    let fallos = 0;
    const seleccionesArray = [];
    
    Object.keys(seleccionesNaipesParticipante).forEach((etiquetaId) => {
      const naipeSeleccionado = seleccionesNaipesParticipante[etiquetaId];
      const naipeCorrecto = respuestasCorrectas[etiquetaId];
      const esCorrecta = naipeSeleccionado && naipeCorrecto && naipeSeleccionado === naipeCorrecto;
      
      let puntosAcierto = 0;
      let puntosBonus = 0;
      
      if (esCorrecta) {
        aciertos++;
        puntosAcierto = 100;
        
        // Calcular bonus
        if (timerIniciadoEn && seleccionesNaipesTimestampsParticipante[etiquetaId]) {
          const timestampAsignacion = seleccionesNaipesTimestampsParticipante[etiquetaId];
          const tiempoTranscurrido = (timestampAsignacion - timerIniciadoEn) / (1000 * 60);
          const tiempoRestante = duracionTimerMinutos - tiempoTranscurrido;
          
          if (tiempoTranscurrido <= 15) {
            puntosBonus = 25;
          } else if (tiempoTranscurrido <= 25) {
            puntosBonus = 10;
          } else if (tiempoRestante <= 5) {
            puntosBonus = 0;
          } else {
            puntosBonus = 0;
          }
        }
      } else {
        fallos++;
      }
      
      puntosTotal += puntosAcierto + puntosBonus;
      
      const naipe = naipes.find(n => n.id === naipeSeleccionado);
      const naipeCorrectoObj = naipes.find(n => n.id === naipeCorrecto);
      
      seleccionesArray.push({
        etiquetaNombre: seleccionesEtiquetasParticipante[etiquetaId] || 'Etiqueta desconocida',
        naipeSeleccionado: naipe ? naipe.nombre : 'Naipe desconocido',
        naipeIdSeleccionado: naipeSeleccionado, // ID del naipe seleccionado
        naipeCorrecto: naipeCorrectoObj ? naipeCorrectoObj.nombre : 'Naipe desconocido',
        naipeIdCorrecto: naipeCorrecto, // ID del naipe correcto
        esCorrecta,
        puntos: puntosAcierto + puntosBonus
      });
    });
    
    // Mostrar resumen
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'bg-white border-2 border-purple-400 rounded-xl p-6 mb-4';
    resumenDiv.style.padding = '1.5rem';
    resumenDiv.style.marginBottom = '1rem';
    
    const tituloResumen = document.createElement('h3');
    tituloResumen.className = 'text-lg font-bold text-purple-800 mb-4 text-center';
    tituloResumen.style.fontSize = '0.9375rem';
    tituloResumen.style.fontWeight = '700';
    tituloResumen.style.color = '#6b21a8';
    tituloResumen.style.marginBottom = '1rem';
    tituloResumen.style.textAlign = 'center';
    tituloResumen.style.wordBreak = 'break-word';
    tituloResumen.style.overflowWrap = 'break-word';
    tituloResumen.style.lineHeight = '1.4';
    tituloResumen.style.maxWidth = '100%';
    tituloResumen.style.boxSizing = 'border-box';
    tituloResumen.style.overflow = 'hidden';
    tituloResumen.textContent = `${nombreParticipante || 'Tu'} - ${puntosTotal} puntos`;
    resumenDiv.appendChild(tituloResumen);
    
    // Contenedor principal con layout vertical: Aciertos/Fallos arriba, Puntos abajo
    const statsContainer = document.createElement('div');
    statsContainer.style.display = 'flex';
    statsContainer.style.flexDirection = 'column';
    statsContainer.style.gap = '0.75rem';
    statsContainer.style.marginBottom = '1rem';
    statsContainer.style.width = '100%';
    statsContainer.style.boxSizing = 'border-box';
    
    // Primera fila: Aciertos y Fallos (lado a lado)
    const primeraFila = document.createElement('div');
    primeraFila.style.display = 'flex';
    primeraFila.style.flexDirection = 'row';
    primeraFila.style.justifyContent = 'space-around';
    primeraFila.style.gap = '0.75rem';
    primeraFila.style.width = '100%';
    primeraFila.style.boxSizing = 'border-box';
    
    // Aciertos
    const aciertosDiv = document.createElement('div');
    aciertosDiv.className = 'bg-green-50 border-2 border-green-400 rounded-lg p-4 text-center';
    aciertosDiv.style.backgroundColor = '#f0fdf4';
    aciertosDiv.style.border = '2px solid #4ade80';
    aciertosDiv.style.borderRadius = '0.5rem';
    aciertosDiv.style.padding = '1rem';
    aciertosDiv.style.textAlign = 'center';
    aciertosDiv.style.flex = '1';
    aciertosDiv.style.minWidth = '100px';
    aciertosDiv.style.maxWidth = '200px';
    aciertosDiv.style.boxSizing = 'border-box';
    aciertosDiv.style.overflow = 'hidden';
    
    const aciertosLabel = document.createElement('p');
    aciertosLabel.className = 'text-sm font-medium text-green-700 mb-2';
    aciertosLabel.style.fontSize = '0.75rem';
    aciertosLabel.style.fontWeight = '500';
    aciertosLabel.style.color = '#15803d';
    aciertosLabel.style.marginBottom = '0.5rem';
    aciertosLabel.textContent = 'Aciertos';
    
    const aciertosValor = document.createElement('p');
    aciertosValor.className = 'font-bold text-green-800';
    aciertosValor.style.fontSize = '1.5rem';
    aciertosValor.style.fontWeight = '700';
    aciertosValor.style.color = '#166534';
    aciertosValor.style.lineHeight = '1.2';
    aciertosValor.style.overflow = 'hidden';
    aciertosValor.style.textOverflow = 'ellipsis';
    aciertosValor.style.whiteSpace = 'nowrap';
    aciertosValor.textContent = aciertos;
    
    aciertosDiv.appendChild(aciertosLabel);
    aciertosDiv.appendChild(aciertosValor);
    
    // Fallos
    const fallosDiv = document.createElement('div');
    fallosDiv.className = 'bg-red-50 border-2 border-red-400 rounded-lg p-4 text-center';
    fallosDiv.style.backgroundColor = '#fef2f2';
    fallosDiv.style.border = '2px solid #f87171';
    fallosDiv.style.borderRadius = '0.5rem';
    fallosDiv.style.padding = '1rem';
    fallosDiv.style.textAlign = 'center';
    fallosDiv.style.flex = '1';
    fallosDiv.style.minWidth = '100px';
    fallosDiv.style.maxWidth = '200px';
    fallosDiv.style.boxSizing = 'border-box';
    fallosDiv.style.overflow = 'hidden';
    
    const fallosLabel = document.createElement('p');
    fallosLabel.className = 'text-sm font-medium text-red-700 mb-2';
    fallosLabel.style.fontSize = '0.75rem';
    fallosLabel.style.fontWeight = '500';
    fallosLabel.style.color = '#b91c1c';
    fallosLabel.style.marginBottom = '0.5rem';
    fallosLabel.textContent = 'Fallos';
    
    const fallosValor = document.createElement('p');
    fallosValor.className = 'font-bold text-red-800';
    fallosValor.style.fontSize = '1.5rem';
    fallosValor.style.fontWeight = '700';
    fallosValor.style.color = '#991b1b';
    fallosValor.style.lineHeight = '1.2';
    fallosValor.style.overflow = 'hidden';
    fallosValor.style.textOverflow = 'ellipsis';
    fallosValor.style.whiteSpace = 'nowrap';
    fallosValor.textContent = fallos;
    
    fallosDiv.appendChild(fallosLabel);
    fallosDiv.appendChild(fallosValor);
    
    primeraFila.appendChild(aciertosDiv);
    primeraFila.appendChild(fallosDiv);
    
    // Segunda fila: Puntos (centrado, ancho completo o limitado)
    const segundaFila = document.createElement('div');
    segundaFila.style.display = 'flex';
    segundaFila.style.flexDirection = 'row';
    segundaFila.style.justifyContent = 'center';
    segundaFila.style.width = '100%';
    segundaFila.style.boxSizing = 'border-box';
    
    // Puntos totales
    const puntosDiv = document.createElement('div');
    puntosDiv.className = 'bg-purple-50 border-2 border-purple-400 rounded-lg p-4 text-center';
    puntosDiv.style.backgroundColor = '#faf5ff';
    puntosDiv.style.border = '2px solid #c084fc';
    puntosDiv.style.borderRadius = '0.5rem';
    puntosDiv.style.padding = '1rem';
    puntosDiv.style.textAlign = 'center';
    puntosDiv.style.minWidth = '150px';
    puntosDiv.style.maxWidth = '250px';
    puntosDiv.style.width = '100%';
    puntosDiv.style.boxSizing = 'border-box';
    puntosDiv.style.overflow = 'hidden';
    
    const puntosLabel = document.createElement('p');
    puntosLabel.className = 'text-sm font-medium text-purple-700 mb-2';
    puntosLabel.style.fontSize = '0.75rem';
    puntosLabel.style.fontWeight = '500';
    puntosLabel.style.color = '#7e22ce';
    puntosLabel.style.marginBottom = '0.5rem';
    puntosLabel.textContent = 'Puntos';
    
    const puntosValor = document.createElement('p');
    puntosValor.className = 'font-bold text-purple-800';
    puntosValor.style.fontSize = '1.5rem';
    puntosValor.style.fontWeight = '700';
    puntosValor.style.color = '#6b21a8';
    puntosValor.style.lineHeight = '1.2';
    puntosValor.style.overflow = 'hidden';
    puntosValor.style.textOverflow = 'ellipsis';
    puntosValor.style.whiteSpace = 'nowrap';
    puntosValor.textContent = puntosTotal;
    
    puntosDiv.appendChild(puntosLabel);
    puntosDiv.appendChild(puntosValor);
    
    segundaFila.appendChild(puntosDiv);
    
    statsContainer.appendChild(primeraFila);
    statsContainer.appendChild(segundaFila);
    resumenDiv.appendChild(statsContainer);
    
    contenedor.appendChild(resumenDiv);
    
    // Mostrar detalles de selecciones
    const detallesTitle = document.createElement('h4');
    detallesTitle.className = 'text-lg font-semibold text-gray-900 mb-3 mt-4';
    detallesTitle.textContent = 'Tu elección';
    contenedor.appendChild(detallesTitle);
    
    const seleccionesDiv = document.createElement('div');
    seleccionesDiv.className = 'space-y-2';
    
    seleccionesArray.forEach((sel) => {
      const selDiv = document.createElement('div');
      selDiv.className = `border rounded-lg p-3 ${
        sel.esCorrecta 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`;
      
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-2';
      
      const etiqueta = document.createElement('p');
      etiqueta.className = 'font-semibold text-gray-900';
      etiqueta.style.fontSize = '0.875rem';
      etiqueta.style.fontWeight = '600';
      etiqueta.style.color = '#111827';
      etiqueta.style.wordBreak = 'break-word';
      etiqueta.style.overflowWrap = 'break-word';
      etiqueta.textContent = sel.etiquetaNombre;
      
      const puntosSel = document.createElement('p');
      puntosSel.className = `font-bold`;
      puntosSel.style.fontSize = '0.875rem';
      puntosSel.style.fontWeight = '700';
      puntosSel.style.color = sel.esCorrecta ? '#15803d' : '#dc2626';
      puntosSel.textContent = sel.esCorrecta ? `+${sel.puntos} pts` : '0 pts';
      
      header.appendChild(etiqueta);
      header.appendChild(puntosSel);
      
      // Mostrar naipes según UX mejorada:
      // - Aciertos: solo el naipe seleccionado en highlight (verde)
      // - Fallos: naipe seleccionado apagado/semi-transparente + naipe correcto en highlight (verde)
      const naipesContainer = document.createElement('div');
      naipesContainer.className = 'flex items-center gap-3 mt-2';
      // Estilos inline explícitos para compatibilidad Android
      naipesContainer.style.display = 'flex';
      naipesContainer.style.flexDirection = 'row';
      naipesContainer.style.alignItems = 'center';
      naipesContainer.style.justifyContent = 'flex-start';
      naipesContainer.style.gap = '0.75rem';
      naipesContainer.style.marginTop = '0.5rem';
      naipesContainer.style.marginBottom = '0';
      naipesContainer.style.flexWrap = 'wrap';
      naipesContainer.style.width = '100%';
      naipesContainer.style.boxSizing = 'border-box';
      
      if (sel.esCorrecta) {
        // ACIERTO: Solo mostrar el naipe seleccionado en highlight (verde)
        if (sel.naipeIdSeleccionado) {
          const naipeImgContainer = document.createElement('div');
          naipeImgContainer.style.position = 'relative';
          naipeImgContainer.style.display = 'inline-block';
          naipeImgContainer.style.margin = '0';
          naipeImgContainer.style.padding = '0';
          naipeImgContainer.style.verticalAlign = 'middle';
          
          const naipeImg = document.createElement('img');
          naipeImg.src = obtenerImagenNaipe(sel.naipeIdSeleccionado);
          naipeImg.alt = sel.naipeSeleccionado;
          naipeImg.title = sel.naipeSeleccionado;
          naipeImg.className = 'w-16 h-auto rounded shadow-sm';
          // Estilos inline explícitos para compatibilidad Android
          naipeImg.style.width = '4rem';
          naipeImg.style.maxWidth = '4rem';
          naipeImg.style.height = 'auto';
          naipeImg.style.minHeight = 'auto';
          naipeImg.style.borderRadius = '0.375rem';
          // Borde verde para highlight (acierto)
          naipeImg.style.border = '3px solid #22c55e';
          naipeImg.style.borderWidth = '3px';
          naipeImg.style.borderStyle = 'solid';
          naipeImg.style.borderColor = '#22c55e';
          naipeImg.style.boxSizing = 'border-box';
          naipeImg.style.display = 'block';
          naipeImg.style.margin = '0';
          naipeImg.style.padding = '0';
          naipeImg.style.filter = 'none'; // Sin filtro para aciertos
          naipeImg.onerror = function() {
            // Si la imagen no carga, mostrar el nombre como fallback
            this.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.className = 'text-sm px-2 py-1 rounded';
            fallback.style.border = '3px solid #22c55e';
            fallback.style.backgroundColor = '#f0fdf4';
            fallback.style.color = '#15803d';
            fallback.style.display = 'inline-block';
            fallback.style.padding = '0.25rem 0.5rem';
            fallback.style.borderRadius = '0.375rem';
            fallback.textContent = sel.naipeSeleccionado;
            naipeImgContainer.appendChild(fallback);
          };
          
          naipeImgContainer.appendChild(naipeImg);
          naipesContainer.appendChild(naipeImgContainer);
        }
      } else {
        // FALLO: Mostrar naipe seleccionado apagado + naipe correcto en highlight
        // 1. Naipe seleccionado (apagado/semi-transparente)
        if (sel.naipeIdSeleccionado) {
          const naipeImgContainer = document.createElement('div');
          naipeImgContainer.style.position = 'relative';
          naipeImgContainer.style.display = 'inline-block';
          naipeImgContainer.style.margin = '0';
          naipeImgContainer.style.padding = '0';
          naipeImgContainer.style.verticalAlign = 'middle';
          
          const naipeImg = document.createElement('img');
          naipeImg.src = obtenerImagenNaipe(sel.naipeIdSeleccionado);
          naipeImg.alt = sel.naipeSeleccionado;
          naipeImg.title = sel.naipeSeleccionado;
          naipeImg.className = 'w-16 h-auto rounded shadow-sm';
          // Estilos inline explícitos para compatibilidad Android
          naipeImg.style.width = '4rem';
          naipeImg.style.maxWidth = '4rem';
          naipeImg.style.height = 'auto';
          naipeImg.style.minHeight = 'auto';
          naipeImg.style.borderRadius = '0.375rem';
          // Sin borde o borde sutil para el fallo
          naipeImg.style.border = '2px solid #d1d5db';
          naipeImg.style.borderWidth = '2px';
          naipeImg.style.borderStyle = 'solid';
          naipeImg.style.borderColor = '#d1d5db';
          naipeImg.style.boxSizing = 'border-box';
          naipeImg.style.display = 'block';
          naipeImg.style.margin = '0';
          naipeImg.style.padding = '0';
          // Filtro para apagar la imagen (gris, opacidad reducida)
          naipeImg.style.filter = 'grayscale(100%) opacity(0.5)';
          naipeImg.style.opacity = '0.5';
          naipeImg.onerror = function() {
            // Si la imagen no carga, mostrar el nombre como fallback
            this.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.className = 'text-sm px-2 py-1 rounded';
            fallback.style.border = '2px solid #d1d5db';
            fallback.style.backgroundColor = '#f9fafb';
            fallback.style.color = '#9ca3af';
            fallback.style.display = 'inline-block';
            fallback.style.padding = '0.25rem 0.5rem';
            fallback.style.borderRadius = '0.375rem';
            fallback.style.opacity = '0.5';
            fallback.textContent = sel.naipeSeleccionado;
            naipeImgContainer.appendChild(fallback);
          };
          
          naipeImgContainer.appendChild(naipeImg);
          naipesContainer.appendChild(naipeImgContainer);
        }
        
        // 2. Naipe correcto (highlight verde)
        const correctoImgContainer = document.createElement('div');
        correctoImgContainer.style.position = 'relative';
        correctoImgContainer.style.display = 'inline-block';
        correctoImgContainer.style.margin = '0';
        correctoImgContainer.style.padding = '0';
        correctoImgContainer.style.verticalAlign = 'middle';
        
        const correctoImg = document.createElement('img');
        correctoImg.src = obtenerImagenNaipe(sel.naipeIdCorrecto);
        correctoImg.alt = sel.naipeCorrecto;
        correctoImg.title = sel.naipeCorrecto;
        correctoImg.className = 'w-16 h-auto rounded shadow-sm';
        // Estilos inline explícitos para compatibilidad Android
        correctoImg.style.width = '4rem';
        correctoImg.style.maxWidth = '4rem';
        correctoImg.style.height = 'auto';
        correctoImg.style.minHeight = 'auto';
        correctoImg.style.borderRadius = '0.375rem';
        // Borde verde para highlight (solución correcta)
        correctoImg.style.border = '3px solid #22c55e';
        correctoImg.style.borderWidth = '3px';
        correctoImg.style.borderStyle = 'solid';
        correctoImg.style.borderColor = '#22c55e';
        correctoImg.style.boxSizing = 'border-box';
        correctoImg.style.display = 'block';
        correctoImg.style.margin = '0';
        correctoImg.style.padding = '0';
        correctoImg.style.filter = 'none'; // Sin filtro para destacar
        correctoImg.onerror = function() {
          // Si la imagen no carga, mostrar el nombre como fallback
          this.style.display = 'none';
          const fallback = document.createElement('span');
          fallback.className = 'text-sm px-2 py-1 rounded';
          fallback.style.border = '3px solid #22c55e';
          fallback.style.backgroundColor = '#f0fdf4';
          fallback.style.color = '#15803d';
          fallback.style.display = 'inline-block';
          fallback.style.padding = '0.25rem 0.5rem';
          fallback.style.borderRadius = '0.375rem';
          fallback.textContent = sel.naipeCorrecto;
          correctoImgContainer.appendChild(fallback);
        };
        
        correctoImgContainer.appendChild(correctoImg);
        naipesContainer.appendChild(correctoImgContainer);
      }
      
      selDiv.appendChild(header);
      selDiv.appendChild(naipesContainer);
      
      seleccionesDiv.appendChild(selDiv);
    });
    
    contenedor.appendChild(seleccionesDiv);
    
  } catch (error) {
    console.error('Error al cargar tu resultado:', error);
    const contenedor = document.getElementById('contenedorTuResultado');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar tu resultado.</p>';
    }
  }
}

// Cargar selecciones de todos los usuarios
async function cargarSeleccionesTodosUsuarios() {
  try {
    const contenedor = document.getElementById('contenedorSeleccionesUsuarios');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Cargar todas las selecciones finalizadas
    const seleccionesRef = collection(db, 'selecciones');
    const qParticipantes = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('finalizado', '==', true)
    );
    const participantesSnapshot = await getDocs(qParticipantes);
    
    if (participantesSnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No hay selecciones para mostrar.</p>';
      return;
    }
    
    // Cargar respuestas correctas del anfitrión para comparar
    const qAnfitrion = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const anfitrionSnapshot = await getDocs(qAnfitrion);
    
    let respuestasCorrectas = {};
    if (!anfitrionSnapshot.empty) {
      const anfitrionData = anfitrionSnapshot.docs[0].data();
      respuestasCorrectas = anfitrionData.seleccionesNaipes || {};
    }
    
    // Cargar naipes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const naipes = [];
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.naipeId && data.naipeNombre) {
        naipes.push({
          id: data.naipeId,
          nombre: data.naipeNombre
        });
      }
    });
    
    // Mostrar selecciones de cada participante
    participantesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Saltar anfitrión
      if (data.sesionId === 'ANFITRION') {
        return;
      }
      
      const nombreParticipante = data.nombreParticipante || 'Participante sin nombre';
      const seleccionesNaipes = data.seleccionesNaipes || {};
      const seleccionesEtiquetas = data.seleccionesEtiquetas || {};
      const ordenEtiquetasParticipante = data.ordenEtiquetas || [];
      const calificacionesEtiquetasParticipante = data.calificacionesEtiquetas || {};
      
      const usuarioDiv = document.createElement('div');
      usuarioDiv.className = 'bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4';
      
      const nombreHeader = document.createElement('h3');
      nombreHeader.className = 'text-lg font-semibold text-gray-900 mb-3';
      nombreHeader.textContent = nombreParticipante;
      usuarioDiv.appendChild(nombreHeader);
      
      const seleccionesList = document.createElement('div');
      seleccionesList.className = 'flex flex-wrap gap-3';
      seleccionesList.style.display = 'flex';
      seleccionesList.style.flexWrap = 'wrap';
      seleccionesList.style.gap = '0.75rem';
      seleccionesList.style.width = '100%';
      // En móviles, cada selección en su propia línea
      seleccionesList.style.flexDirection = window.innerWidth <= 768 ? 'column' : 'row';
      seleccionesList.style.alignItems = window.innerWidth <= 768 ? 'flex-start' : 'center';
      
      // Respetar el orden del array del participante
      const etiquetasOrdenadas = ordenEtiquetasParticipante.length > 0 
        ? ordenEtiquetasParticipante.filter(etiquetaId => seleccionesNaipes[etiquetaId])
        : Object.keys(seleccionesNaipes);
      
      etiquetasOrdenadas.forEach((etiquetaId, index) => {
        const naipeId = seleccionesNaipes[etiquetaId];
        if (!naipeId) return;
        
        const naipeCorrecto = respuestasCorrectas[etiquetaId];
        const esCorrecta = naipeId && naipeCorrecto && String(naipeId).trim() === String(naipeCorrecto).trim();
        
        // Obtener calificación para esta etiqueta
        const calificacion = calificacionesEtiquetasParticipante[etiquetaId] || 0;
        
        if (esCorrecta) {
          // ACIERTO: Mostrar el naipe con borde verde indicando acierto
          // Contenedor padre para agrupar naipe y estrellas
          const contenedorPadre = document.createElement('div');
          contenedorPadre.style.display = 'flex';
          contenedorPadre.style.flexDirection = 'column';
          contenedorPadre.style.alignItems = 'center';
          contenedorPadre.style.width = 'fit-content';
          contenedorPadre.style.marginBottom = '0.5rem'; // Espacio entre selecciones en móviles
          
          // Contenedor del naipe (sin borde, el borde va en la imagen)
          const naipeContainer = document.createElement('div');
          naipeContainer.style.position = 'relative';
          naipeContainer.style.display = 'inline-block';
          naipeContainer.style.margin = '0';
          naipeContainer.style.padding = '0';
          naipeContainer.style.verticalAlign = 'middle';
          
          const naipeImg = document.createElement('img');
          const rutaImagen = obtenerImagenNaipe(naipeId);
          naipeImg.src = rutaImagen;
          naipeImg.alt = naipeId;
          naipeImg.className = 'w-16 h-auto rounded shadow-sm';
          naipeImg.title = 'Acierto';
          naipeImg.style.width = '4rem';
          naipeImg.style.maxWidth = '4rem';
          naipeImg.style.height = 'auto';
          naipeImg.style.borderRadius = '0.375rem';
          naipeImg.style.border = '3px solid #22c55e';
          naipeImg.style.borderWidth = '3px';
          naipeImg.style.borderStyle = 'solid';
          naipeImg.style.borderColor = '#22c55e';
          naipeImg.style.boxSizing = 'border-box';
          naipeImg.style.display = 'block';
          naipeImg.style.margin = '0';
          naipeImg.style.padding = '0';
          naipeImg.style.filter = 'none';
          
          // Fallback a SVG si la imagen no carga
          naipeImg.onerror = function() {
            this.src = generarSVGNaipe(naipeId);
            this.onerror = null;
          };
          
          naipeContainer.appendChild(naipeImg);
          contenedorPadre.appendChild(naipeContainer);
          
          // Agregar estrellas debajo del naipe (fuera del borde)
          const estrellasContainer = crearEstrellasSoloLectura(calificacion);
          contenedorPadre.appendChild(estrellasContainer);
          
          seleccionesList.appendChild(contenedorPadre);
        } else {
          // FALLO: Mostrar naipe elegido con transparencia y borde rojo, seguido del naipe correcto sin borde
          // Contenedor principal para toda la selección (naipe elegido + naipe correcto + estrellas)
          const contenedorFallo = document.createElement('div');
          contenedorFallo.style.display = 'flex';
          contenedorFallo.style.flexDirection = 'column';
          contenedorFallo.style.alignItems = 'center';
          contenedorFallo.style.width = 'fit-content';
          contenedorFallo.style.marginBottom = '0.5rem'; // Espacio entre selecciones en móviles
          
          // Contenedor horizontal para los dos naipes (elegido y correcto) en la misma línea
          const contenedorNaipes = document.createElement('div');
          contenedorNaipes.style.display = 'flex';
          contenedorNaipes.style.flexDirection = 'row';
          contenedorNaipes.style.alignItems = 'flex-start'; // Alinear arriba para que las estrellas no afecten
          contenedorNaipes.style.gap = '0.5rem';
          
          // 1. Contenedor para naipe seleccionado con estrellas
          const contenedorNaipeElegidoConEstrellas = document.createElement('div');
          contenedorNaipeElegidoConEstrellas.style.display = 'flex';
          contenedorNaipeElegidoConEstrellas.style.flexDirection = 'column';
          contenedorNaipeElegidoConEstrellas.style.alignItems = 'center';
          contenedorNaipeElegidoConEstrellas.style.width = 'fit-content';
          
          // Naipe seleccionado (con transparencia y borde rojo - solo la imagen)
          const naipeContainerSeleccionado = document.createElement('div');
          naipeContainerSeleccionado.style.position = 'relative';
          naipeContainerSeleccionado.style.display = 'inline-block';
          naipeContainerSeleccionado.style.margin = '0';
          naipeContainerSeleccionado.style.padding = '0';
          naipeContainerSeleccionado.style.verticalAlign = 'middle';
          
          const naipeImgSeleccionado = document.createElement('img');
          const rutaImagenSeleccionado = obtenerImagenNaipe(naipeId);
          naipeImgSeleccionado.src = rutaImagenSeleccionado;
          naipeImgSeleccionado.alt = naipeId;
          naipeImgSeleccionado.className = 'w-16 h-auto rounded shadow-sm';
          naipeImgSeleccionado.title = 'Fallo - Tu elección';
          naipeImgSeleccionado.style.width = '4rem';
          naipeImgSeleccionado.style.maxWidth = '4rem';
          naipeImgSeleccionado.style.height = 'auto';
          naipeImgSeleccionado.style.borderRadius = '0.375rem';
          naipeImgSeleccionado.style.border = '3px solid #ef4444'; // Borde rojo
          naipeImgSeleccionado.style.borderWidth = '3px';
          naipeImgSeleccionado.style.borderStyle = 'solid';
          naipeImgSeleccionado.style.borderColor = '#ef4444';
          naipeImgSeleccionado.style.boxSizing = 'border-box';
          naipeImgSeleccionado.style.display = 'block';
          naipeImgSeleccionado.style.margin = '0';
          naipeImgSeleccionado.style.padding = '0';
          naipeImgSeleccionado.style.filter = 'opacity(0.5)'; // Transparencia
          naipeImgSeleccionado.style.opacity = '0.5';
          
          // Fallback a SVG si la imagen no carga
          naipeImgSeleccionado.onerror = function() {
            this.src = generarSVGNaipe(naipeId);
            this.onerror = null;
          };
          
          naipeContainerSeleccionado.appendChild(naipeImgSeleccionado);
          contenedorNaipeElegidoConEstrellas.appendChild(naipeContainerSeleccionado);
          
          // Agregar estrellas debajo SOLO del naipe elegido
          const estrellasContainerSeleccionado = crearEstrellasSoloLectura(calificacion);
          contenedorNaipeElegidoConEstrellas.appendChild(estrellasContainerSeleccionado);
          
          contenedorNaipes.appendChild(contenedorNaipeElegidoConEstrellas);
          
          // 2. Naipe correcto (sin borde, solo la imagen) - mismo tamaño, al lado
          if (naipeCorrecto) {
            const naipeContainerCorrecto = document.createElement('div');
            naipeContainerCorrecto.style.position = 'relative';
            naipeContainerCorrecto.style.display = 'inline-block';
            naipeContainerCorrecto.style.margin = '0';
            naipeContainerCorrecto.style.padding = '0';
            naipeContainerCorrecto.style.verticalAlign = 'middle';
            
            const naipeImgCorrecto = document.createElement('img');
            const rutaImagenCorrecto = obtenerImagenNaipe(naipeCorrecto);
            naipeImgCorrecto.src = rutaImagenCorrecto;
            naipeImgCorrecto.alt = naipeCorrecto;
            naipeImgCorrecto.className = 'w-16 h-auto rounded shadow-sm';
            naipeImgCorrecto.title = 'Solución correcta';
            naipeImgCorrecto.style.width = '4rem';
            naipeImgCorrecto.style.maxWidth = '4rem';
            naipeImgCorrecto.style.height = 'auto';
            naipeImgCorrecto.style.borderRadius = '0.375rem';
            naipeImgCorrecto.style.border = '3px solid #22c55e';
            naipeImgCorrecto.style.borderWidth = '3px';
            naipeImgCorrecto.style.borderStyle = 'solid';
            naipeImgCorrecto.style.borderColor = '#22c55e';
            naipeImgCorrecto.style.boxSizing = 'border-box';
            naipeImgCorrecto.style.display = 'block';
            naipeImgCorrecto.style.margin = '0';
            naipeImgCorrecto.style.padding = '0';
            naipeImgCorrecto.style.filter = 'none';
            naipeImgCorrecto.style.opacity = '1';
            
            // Fallback a SVG si la imagen no carga
            naipeImgCorrecto.onerror = function() {
              this.src = generarSVGNaipe(naipeCorrecto);
              this.onerror = null;
            };
            
            naipeContainerCorrecto.appendChild(naipeImgCorrecto);
            contenedorNaipes.appendChild(naipeContainerCorrecto);
          }
          
          // Agregar el contenedor de naipes al contenedor principal
          contenedorFallo.appendChild(contenedorNaipes);
          
          seleccionesList.appendChild(contenedorFallo);
        }
      });
      
      usuarioDiv.appendChild(seleccionesList);
      contenedor.appendChild(usuarioDiv);
    });
    
  } catch (error) {
    console.error('Error al cargar selecciones de usuarios:', error);
    const contenedor = document.getElementById('contenedorSeleccionesUsuarios');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar selecciones.</p>';
    }
  }
}

// Crear item de lista para participantes del 4to en adelante
// Crear item de lista para etiquetas
function crearEtiquetaListItem(etiqueta, posicion) {
  const div = document.createElement('div');
  div.className = 'border rounded-lg p-4 bg-gray-50 border-gray-200';
  div.style.display = 'flex';
  div.style.justifyContent = 'space-between';
  div.style.alignItems = 'center';
  div.style.padding = '1rem';
  div.style.marginBottom = '0.5rem';
  
  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.alignItems = 'center';
  info.style.gap = '1rem';
  
  const posicionSpan = document.createElement('span');
  posicionSpan.className = 'font-bold text-gray-700';
  posicionSpan.style.fontSize = '1.125rem';
  posicionSpan.style.fontWeight = '700';
  posicionSpan.style.minWidth = '2rem';
  posicionSpan.textContent = `#${posicion} `;
  
  const nombreSpan = document.createElement('span');
  nombreSpan.className = 'text-gray-900';
  nombreSpan.style.fontSize = '1rem';
  nombreSpan.style.fontWeight = '500';
  nombreSpan.style.wordBreak = 'break-word';
  nombreSpan.textContent = etiqueta.nombre;
  
  info.appendChild(posicionSpan);
  info.appendChild(nombreSpan);
  
  const puntosSpan = document.createElement('span');
  puntosSpan.className = 'font-bold text-purple-700';
  puntosSpan.style.fontSize = '1.125rem';
  puntosSpan.style.fontWeight = '700';
  puntosSpan.textContent = `${etiqueta.puntos} pts`;
  
  div.appendChild(info);
  div.appendChild(puntosSpan);
  
  return div;
}

function crearParticipanteListItemParticipante(participante, posicion) {
  const div = document.createElement('div');
  div.className = 'bg-gray-50 border border-gray-300 rounded-xl p-6 space-y-4 mb-4';
  
  // Header del participante
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between border-b pb-3';
  
  const nombreDiv = document.createElement('div');
  nombreDiv.className = 'flex items-center gap-3';
  
  const posicionEl = document.createElement('div');
  posicionEl.className = 'text-2xl font-bold text-purple-600';
  posicionEl.textContent = `#${posicion}`;
  
  const nombre = document.createElement('h3');
  nombre.className = 'text-lg font-semibold text-gray-900';
  nombre.textContent = participante.nombre;
  
  nombreDiv.appendChild(posicionEl);
  nombreDiv.appendChild(nombre);
  
  const puntaje = document.createElement('div');
  puntaje.className = 'text-xl font-bold text-purple-700';
  puntaje.textContent = `${participante.puntos} puntos`;
  
  header.appendChild(nombreDiv);
  header.appendChild(puntaje);
  
  // Selecciones
  const seleccionesDiv = document.createElement('div');
  seleccionesDiv.className = 'space-y-2 mt-3';
  
  participante.selecciones.forEach((sel) => {
    const selDiv = document.createElement('div');
    selDiv.className = `border rounded-lg p-3 flex justify-between items-center ${
      sel.esCorrecta 
        ? 'bg-green-50 border-green-300' 
        : 'bg-red-50 border-red-300'
    }`;
    
    const info = document.createElement('div');
    info.className = 'flex-1';
    
    const etiqueta = document.createElement('p');
    etiqueta.className = 'font-semibold text-gray-900';
    etiqueta.textContent = sel.etiquetaNombre;
    info.appendChild(etiqueta);
    
    // Mostrar naipes según UX mejorada
    const naipesContainer = document.createElement('div');
    naipesContainer.className = 'flex items-center gap-2 mt-2';
    naipesContainer.style.display = 'flex';
    naipesContainer.style.flexDirection = 'row';
    naipesContainer.style.alignItems = 'center';
    naipesContainer.style.gap = '0.5rem';
    naipesContainer.style.marginTop = '0.5rem';
    
    if (sel.esCorrecta) {
      // ACIERTO: Solo mostrar el naipe seleccionado en highlight
      if (sel.naipeIdSeleccionado) {
        const naipeImgContainer = document.createElement('div');
        naipeImgContainer.style.position = 'relative';
        naipeImgContainer.style.display = 'inline-block';
        
        const naipeImg = document.createElement('img');
        naipeImg.src = obtenerImagenNaipe(sel.naipeIdSeleccionado);
        naipeImg.alt = sel.naipeSeleccionado;
        naipeImg.title = sel.naipeSeleccionado;
        naipeImg.className = 'w-12 h-16 object-contain rounded';
        naipeImg.style.width = '3rem';
        naipeImg.style.height = '4rem';
        naipeImg.style.border = '2px solid #22c55e';
        naipeImg.style.borderRadius = '0.375rem';
        naipeImg.style.filter = 'none';
        
        naipeImg.onerror = function() {
          this.src = generarSVGNaipe(sel.naipeIdSeleccionado);
          this.onerror = null;
        };
        
        naipeImgContainer.appendChild(naipeImg);
        naipesContainer.appendChild(naipeImgContainer);
      }
    } else {
      // FALLO: Mostrar naipe seleccionado apagado + naipe correcto en highlight
      if (sel.naipeIdSeleccionado) {
        const naipeImgContainerSeleccionado = document.createElement('div');
        naipeImgContainerSeleccionado.style.position = 'relative';
        naipeImgContainerSeleccionado.style.display = 'inline-block';
        
        const naipeImgSeleccionado = document.createElement('img');
        naipeImgSeleccionado.src = obtenerImagenNaipe(sel.naipeIdSeleccionado);
        naipeImgSeleccionado.alt = sel.naipeSeleccionado;
        naipeImgSeleccionado.title = sel.naipeSeleccionado;
        naipeImgSeleccionado.className = 'w-12 h-16 object-contain rounded';
        naipeImgSeleccionado.style.width = '3rem';
        naipeImgSeleccionado.style.height = '4rem';
        naipeImgSeleccionado.style.border = '2px solid #d1d5db';
        naipeImgSeleccionado.style.borderRadius = '0.375rem';
        naipeImgSeleccionado.style.filter = 'grayscale(100%) opacity(0.5)';
        naipeImgSeleccionado.style.opacity = '0.5';
        
        naipeImgSeleccionado.onerror = function() {
          this.src = generarSVGNaipe(sel.naipeIdSeleccionado);
          this.onerror = null;
        };
        
        naipeImgContainerSeleccionado.appendChild(naipeImgSeleccionado);
        naipesContainer.appendChild(naipeImgContainerSeleccionado);
      }
      
      // Naipe correcto (highlight)
      if (sel.naipeIdCorrecto) {
        const naipeImgContainerCorrecto = document.createElement('div');
        naipeImgContainerCorrecto.style.position = 'relative';
        naipeImgContainerCorrecto.style.display = 'inline-block';
        
        const naipeImgCorrecto = document.createElement('img');
        naipeImgCorrecto.src = obtenerImagenNaipe(sel.naipeIdCorrecto);
        naipeImgCorrecto.alt = sel.naipeCorrecto;
        naipeImgCorrecto.title = sel.naipeCorrecto;
        naipeImgCorrecto.className = 'w-12 h-16 object-contain rounded';
        naipeImgCorrecto.style.width = '3rem';
        naipeImgCorrecto.style.height = '4rem';
        naipeImgCorrecto.style.border = '2px solid #22c55e';
        naipeImgCorrecto.style.borderRadius = '0.375rem';
        naipeImgCorrecto.style.filter = 'none';
        
        naipeImgCorrecto.onerror = function() {
          this.src = generarSVGNaipe(sel.naipeIdCorrecto);
          this.onerror = null;
        };
        
        naipeImgContainerCorrecto.appendChild(naipeImgCorrecto);
        naipesContainer.appendChild(naipeImgContainerCorrecto);
      }
    }
    
    info.appendChild(naipesContainer);
    
    const icono = document.createElement('div');
    icono.className = `text-xl ${sel.esCorrecta ? 'text-green-600' : 'text-red-600'}`;
    icono.innerHTML = sel.esCorrecta ? '✓' : '✗';
    
    selDiv.appendChild(info);
    selDiv.appendChild(icono);
    seleccionesDiv.appendChild(selDiv);
  });
  
  div.appendChild(header);
  div.appendChild(seleccionesDiv);
  
  return div;
}

// Guardar progreso
async function guardarProgreso(finalizado = false) {
  try {
    const seleccionesRef = collection(db, 'selecciones');
    const q = query(seleccionesRef, where('sesionId', '==', sesionId));
    const querySnapshot = await getDocs(q);
    
    // Asegurar que todas las etiquetas seleccionadas tengan su nombre guardado
    const seleccionesEtiquetasCompletas = { ...seleccionesEtiquetas };
    Object.keys(seleccionesNaipes).forEach(etiquetaId => {
      if (!seleccionesEtiquetasCompletas[etiquetaId]) {
        const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
        if (etiqueta) {
          seleccionesEtiquetasCompletas[etiquetaId] = etiqueta.nombre;
        }
      }
    });
    
    // Si se está finalizando y hay participantes seleccionados, asignar 0 a las selecciones sin calificar
    const calificacionesFinales = { ...calificacionesEtiquetas };
    if (finalizado && participantesDisponibles && participantesDisponibles.length > 0) {
      Object.keys(seleccionesNaipes).forEach(etiquetaId => {
        if (!calificacionesFinales[etiquetaId] || calificacionesFinales[etiquetaId] === 0) {
          calificacionesFinales[etiquetaId] = 0;
        }
      });
    }
    
    const datos = {
      sesionId,
      eventoId,
      nombreParticipante: nombreParticipante || '', // Asegurar que siempre haya un nombre
      seleccionesEtiquetas: seleccionesEtiquetasCompletas, // Nombres de etiquetas completos
      seleccionesNaipes,
      seleccionesNaipesTimestamps, // Timestamps de cuando se asignó cada naipe (para bonus)
      ordenEtiquetas: ordenEtiquetas, // Guardar el orden de preferencia (ranking)
      calificacionesEtiquetas: calificacionesFinales, // Guardar calificaciones (con 0 para no calificadas si se finaliza)
      finalizado,
      actualizadoEn: serverTimestamp()
    };
    
    if (!querySnapshot.empty) {
      // Actualizar documento existente
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, datos);
    } else {
      // Crear nuevo documento
      datos.creadoEn = serverTimestamp();
      await addDoc(seleccionesRef, datos);
    }
    
    console.log('Progreso guardado con nombres:', {
      nombreParticipante: datos.nombreParticipante,
      etiquetasConNombres: Object.keys(seleccionesEtiquetasCompletas).length
    });
  } catch (error) {
    console.error('Error al guardar progreso:', error);
  }
}

// Actualizar nombre del usuario en el header
function actualizarNombreUsuarioHeader() {
  const nombreUsuarioHeader = document.getElementById('nombreUsuarioHeader');
  const nombreUsuarioTexto = document.getElementById('nombreUsuarioTexto');
  
  if (nombreUsuarioHeader && nombreUsuarioTexto) {
    if (nombreParticipante) {
      nombreUsuarioTexto.textContent = nombreParticipante;
      nombreUsuarioHeader.classList.remove('hidden');
    } else {
      nombreUsuarioHeader.classList.add('hidden');
    }
  }
  
  // Asegurar que la sección infoEvento esté visible cuando hay datos del evento
  const infoEvento = document.getElementById('infoEvento');
  if (infoEvento && eventoId) {
    infoEvento.classList.remove('hidden');
  }
  
}

// Formatear fecha en formato DD-mes-YYYY (ej: "9 Dic 2025")
function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  
  let fechaParte = fechaISO;
  // Si incluye tiempo, tomar solo la parte de fecha
  if (fechaISO.includes('T')) {
    fechaParte = fechaISO.split('T')[0];
  }
  
  // Nombres de meses en español (abreviados)
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaParte)) {
    const [yyyy, mm, dd] = fechaParte.split('-');
    const mesIndex = parseInt(mm, 10) - 1;
    const dia = parseInt(dd, 10); // Sin padding para mostrar "9" en lugar de "09"
    const mesNombre = meses[mesIndex] || mm;
    return `${dia} ${mesNombre} ${yyyy}`;
  }
  
  // Si es formato DD-MM-YYYY (formato antiguo)
  if (/^\d{2}-\d{2}-\d{4}$/.test(fechaParte)) {
    const [dd, mm, yyyy] = fechaParte.split('-');
    const mesIndex = parseInt(mm, 10) - 1;
    const dia = parseInt(dd, 10);
    const mesNombre = meses[mesIndex] || mm;
    return `${dia} ${mesNombre} ${yyyy}`;
  }
  
  return fechaISO;
}

// Mostrar error
function mostrarError(mensaje) {
  document.body.innerHTML = `
    <div class="max-w-2xl mx-auto p-6">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6">
        <p class="text-red-600">${mensaje}</p>
      </div>
    </div>
  `;
}

// Inicializar página
async function inicializar() {
  if (!eventoId) return;
  
  // Asegurar que el contenido principal esté visible
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.classList.remove('hidden');
  }
  
  inicializarSesion();
  await cargarEvento();
  
  // Event listener para botón "Cerrar sesión"
  const btnCerrarSesion = document.getElementById('btnCerrarSesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.onclick = () => {
      cerrarSesion();
    };
  }
  
  // Mantener compatibilidad con botón "Cambiar evento" si existe
  const btnCambiarEvento = document.getElementById('btnCambiarEvento');
  if (btnCambiarEvento) {
    btnCambiarEvento.onclick = () => {
      cerrarSesion();
    };
  }
  
  // Event listeners
  const btnContinuarNombre = document.getElementById('btnContinuarNombre');
  if (btnContinuarNombre) {
    btnContinuarNombre.onclick = async () => {
      if (!nombreParticipante) {
      document.getElementById('msgNombre').textContent = 'Por favor, seleccioná un nombre de la lista';
      document.getElementById('msgNombre').classList.remove('text-gray-600', 'text-green-600');
      document.getElementById('msgNombre').classList.add('text-red-600');
      return;
    }
    
    // Verificar nuevamente que el nombre no esté ocupado
    await cargarNombresOcupados();
    const nombreLower = nombreParticipante.toLowerCase();
    
    if (nombresOcupados.has(nombreLower)) {
      document.getElementById('msgNombre').textContent = `"${nombreParticipante}" ya fue seleccionado por otro participante. Por favor, elegí otro.`;
      document.getElementById('msgNombre').classList.remove('text-gray-600', 'text-green-600');
      document.getElementById('msgNombre').classList.add('text-red-600');
      renderizarOpcionesNombres(); // Refrescar opciones
      return;
    }
    
      // Guardar usuario en la base de datos única
      try {
        const { guardarUsuario } = await import('./firestore.js');
        await guardarUsuario(nombreParticipante);
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        // No bloqueamos el flujo si falla guardar el usuario
      }
      
      await guardarProgreso(false);
      pasoActual = 2;
      actualizarNombreUsuarioHeader(); // Actualizar header antes de cambiar de paso
      mostrarPasoEtiquetas();
    };
    
    // Deshabilitar botón inicialmente
    btnContinuarNombre.disabled = true;
    btnContinuarNombre.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  // Botón Limpiar todo
  const btnLimpiarTodo = document.getElementById('btnLimpiarTodo');
  if (btnLimpiarTodo) {
    btnLimpiarTodo.onclick = async () => {
      // Limpiar todas las selecciones
      seleccionesNaipes = {};
  seleccionesNaipesTimestamps = {};
      seleccionesEtiquetas = {};
      seleccionesNaipesTimestamps = {};
      calificacionesEtiquetas = {};
      
      // Re-renderizar para actualizar visualmente
      renderizarEtiquetasYNaipes();
      actualizarBotonFinalizar();
      
      // Guardar progreso automáticamente después de limpiar
      btnLimpiarTodo.disabled = true;
      btnLimpiarTodo.textContent = 'Limpiando...';
      
      try {
        await guardarProgreso(false);
        const msg = document.getElementById('msgEtiquetas');
        if (msg) {
          msg.textContent = '✓ Todas las selecciones fueron limpiadas';
          msg.classList.remove('text-red-600', 'text-yellow-600');
          msg.classList.add('text-green-600');
        }
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          const msg = document.getElementById('msgEtiquetas');
          if (msg) {
            msg.textContent = '';
            msg.classList.remove('text-green-600');
          }
        }, 3000);
      } catch (error) {
        console.error('Error al guardar:', error);
        const msg = document.getElementById('msgEtiquetas');
        if (msg) {
          msg.textContent = 'Error al guardar. Por favor, intentá nuevamente.';
          msg.classList.remove('text-green-600', 'text-yellow-600');
          msg.classList.add('text-red-600');
        }
      } finally {
        btnLimpiarTodo.disabled = false;
        btnLimpiarTodo.textContent = 'Limpiar todo';
        // Re-habilitar según el estado actual
        actualizarBotonFinalizar();
      }
    };
  }
  
  // Botón Finalizar
  const btnFinalizar = document.getElementById('btnFinalizar');
  if (btnFinalizar) {
    btnFinalizar.onclick = async () => {
      // Validar que todas las etiquetas tengan naipe asignado
      const faltantes = etiquetasDisponibles.filter(
        etiqueta => !seleccionesNaipes[etiqueta.id]
      );
      
      if (faltantes.length > 0) {
        const msg = document.getElementById('msgEtiquetas');
        if (msg) {
          msg.textContent = `Por favor, asigná un naipe a todas las etiquetas. Faltan ${faltantes.length}`;
          msg.classList.remove('text-green-600', 'text-yellow-600');
          msg.classList.add('text-red-600');
        }
        return;
      }
      
      // Si hay participantes seleccionados, validar que todas las selecciones tengan calificación
      const hayParticipantesSeleccionados = participantesDisponibles && participantesDisponibles.length > 0;
      if (hayParticipantesSeleccionados) {
        const seleccionesSinCalificar = [];
        Object.keys(seleccionesNaipes).forEach(etiquetaId => {
          const calificacion = calificacionesEtiquetas[etiquetaId];
          if (!calificacion || calificacion === 0) {
            const etiqueta = etiquetasDisponibles.find(e => e.id === etiquetaId);
            if (etiqueta) {
              seleccionesSinCalificar.push(etiqueta.nombre);
            }
          }
        });
        
        if (seleccionesSinCalificar.length > 0) {
          const msgCalificaciones = document.getElementById('msgCalificaciones');
          if (msgCalificaciones) {
            msgCalificaciones.textContent = 'Completa selección y calificación';
            msgCalificaciones.classList.remove('hidden', 'text-green-600', 'text-gray-600');
            msgCalificaciones.classList.add('text-red-600');
          }
          return;
        }
      }
      
      // Guardar y finalizar
      btnFinalizar.disabled = true;
      btnFinalizar.textContent = 'Finalizando...';
      
      try {
        await guardarProgreso(true);
        pasoActual = 4;
        mostrarSeleccionesFinalizadas();
      } catch (error) {
        console.error('Error al finalizar:', error);
        const msg = document.getElementById('msgEtiquetas');
        if (msg) {
          msg.textContent = 'Error al finalizar. Por favor, intentá nuevamente.';
          msg.classList.remove('text-green-600', 'text-yellow-600');
          msg.classList.add('text-red-600');
        }
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = 'Finalizar';
      }
    };
  }
  
  // Las líneas de conexión ya no son necesarias
  
  // Mostrar paso inicial
  if (pasoActual === 1) {
    mostrarPasoNombre();
  }
}

// Función para cerrar sesión (limpiar sesión actual y volver al splash)
function cerrarSesion() {
  // Limpiar estado actual
  sesionId = null;
  eventoId = null;
  nombreParticipante = '';
  eventoData = null;
  participantesDisponibles = [];
  nombresOcupados = new Set();
  etiquetasDisponibles = [];
  naipesDisponibles = [];
  seleccionesEtiquetas = {};
  seleccionesNaipes = {};
  seleccionesNaipesTimestamps = {};
  calificacionesEtiquetas = {};
  pasoActual = 1;
  
  // Limpiar timers
  detenerTimer();
  detenerVerificacionResultados();
  if (timerVotacionInterval) {
    clearInterval(timerVotacionInterval);
    timerVotacionInterval = null;
  }
  if (timerVotacionUnsubscribe) {
    timerVotacionUnsubscribe();
    timerVotacionUnsubscribe = null;
  }
  
  // Restablecer botón Ingresar
  const btnIngresar = document.getElementById('btnIngresar');
  if (btnIngresar) {
    btnIngresar.disabled = false;
    const btnIngresarText = document.getElementById('btnIngresarText');
    if (btnIngresarText) {
      btnIngresarText.textContent = 'Ingresar';
    } else {
      btnIngresar.textContent = 'Ingresar';
    }
  }
  
  // Limpiar sesión del localStorage (mantener historial de sesiones pero limpiar última sesión activa)
  localStorage.removeItem(STORAGE_KEY_ULTIMO_EVENTO);
  localStorage.removeItem(STORAGE_KEY_ULTIMO_PIN);
  
  // Limpiar URL
  window.history.pushState({}, '', '/');
  
  // Mostrar pantalla de bienvenida
  mostrarPantallaBienvenida();
}

// Función para cambiar de evento (volver al splash) - mantiene compatibilidad
function cambiarEvento() {
  cerrarSesion();
}

// Verificar si hay una sesión guardada al cargar la página
async function verificarSesionGuardada() {
  // Si hay PIN en la URL pero no eventoId, buscar el evento por PIN y procesar
  if (pinFromURL && !eventoIdFromURL) {
    try {
      // Importar función de búsqueda por PIN
      const { buscarEventoPorPIN } = await import('./firestore.js');
      
      // Buscar evento por PIN
      const resultado = await buscarEventoPorPIN(pinFromURL);
      
      if (resultado.ok && resultado.data) {
        const eventoEncontrado = resultado.data;
        eventoId = eventoEncontrado.id;
        
        // Verificar requisitos del evento
        const verificacionRequisitos = await verificarRequisitosEvento(eventoId);
        
        if (verificacionRequisitos.ok) {
          // Guardar sesión activa con el PIN
          guardarSesionActiva(eventoId, pinFromURL);
          ocultarPantallaBienvenida();
          inicializar();
          return;
        } else {
          // Requisitos no cumplidos, mostrar pantalla de bienvenida (pero con PIN autocompletado)
          mostrarPantallaBienvenida();
          return;
        }
      } else {
        // PIN no encontrado o evento no disponible, mostrar pantalla de bienvenida (pero con PIN autocompletado)
        mostrarPantallaBienvenida();
        return;
      }
    } catch (error) {
      console.error('Error al buscar evento por PIN desde URL:', error);
      // En caso de error, mostrar pantalla de bienvenida (pero con PIN autocompletado)
      mostrarPantallaBienvenida();
      return;
    }
  }
  
  // Si hay eventoId en la URL, verificar requisitos antes de usar
  if (eventoIdFromURL) {
    const verificacionRequisitos = await verificarRequisitosEvento(eventoIdFromURL);
    
    if (verificacionRequisitos.ok) {
      eventoId = eventoIdFromURL;
      // Guardar sesión activa si hay PIN en la URL
      if (pinFromURL) {
        guardarSesionActiva(eventoId, pinFromURL);
      }
      ocultarPantallaBienvenida();
      inicializar();
      return;
    } else {
      // Requisitos no cumplidos, mostrar pantalla de bienvenida
      mostrarPantallaBienvenida();
      return;
    }
  }
  
  // Si no hay eventoId en URL, verificar localStorage
  const ultimoEventoId = localStorage.getItem(STORAGE_KEY_ULTIMO_EVENTO);
  if (ultimoEventoId) {
    // Verificar que el evento siga siendo válido
    try {
      const eventoRef = doc(db, 'eventos', ultimoEventoId);
      const eventoSnap = await getDoc(eventoRef);
      
      if (eventoSnap.exists() && eventoSnap.data().activo === true) {
        // Verificar requisitos del evento
        const verificacionRequisitos = await verificarRequisitosEvento(ultimoEventoId);
        
        if (verificacionRequisitos.ok) {
          // Evento válido y con requisitos cumplidos, recuperar sesión automáticamente
          eventoId = ultimoEventoId;
          // Obtener PIN de la sesión activa si está disponible
          const sesionesActivas = obtenerSesionesActivas();
          const sesionEncontrada = sesionesActivas.find(s => s.eventoId === ultimoEventoId);
          if (sesionEncontrada && sesionEncontrada.pin) {
            // Actualizar timestamp de la sesión
            guardarSesionActiva(ultimoEventoId, sesionEncontrada.pin);
          }
          ocultarPantallaBienvenida();
          inicializar();
          return;
        }
      }
    } catch (error) {
      console.error('Error al verificar evento guardado:', error);
    }
  }
  
  // No hay sesión válida o requisitos no cumplidos, mostrar pantalla de bienvenida
  mostrarPantallaBienvenida();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    verificarSesionGuardada();
  });
} else {
  verificarSesionGuardada();
}

// Limpiar timers al salir de la página
window.addEventListener('beforeunload', () => {
  detenerTimer();
  detenerVerificacionResultados();
});


