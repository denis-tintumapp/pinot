import { crearEvento as crearEventoFirestore, listarEventos as listarEventosFirestore, marcarEventoActivo as marcarEventoActivoFirestore, eliminarEvento as eliminarEventoFirestore, activarTimerEvento, desactivarTimerEvento, pausarTimerEvento, reanudarTimerEvento, aumentarTiempoTimer, escucharTimerEvento, normalizarFechaISO, formatearFechaParaUI, listarPlantillasParticipantes, listarPlantillasEtiquetas, crearPlantillaParticipante, crearPlantillaEtiqueta, eliminarPlantillaParticipante, eliminarPlantillaEtiqueta, listarUsuarios, listarParticipantes as listarParticipantesFirestore, listarEtiquetas as listarEtiquetasFirestore, obtenerOcrearAnfitrion } from './firestore.js';
import { getEventoActivo, setEventoActivo, actualizarEventoActivoLabels } from './estado.js';
import { cargarParticipantes } from './participantes.js';
import { resetConfiguracionEtiquetasNaipes, cargarEtiquetasDelEvento } from './etiquetas.js';
import { mostrarQRModal } from './qr.js';

// Almacenar intervalos de timers para cada evento en la lista
const timersDisplay = new Map();

// Flag para prevenir llamadas concurrentes a listarEventos
let listandoEventos = false;

// Flag para prevenir múltiples clicks en marcarEventoActivo
let marcandoActivo = false;

// Almacenar plantillas y selecciones
let plantillasParticipantes = [];
let plantillasEtiquetas = [];
let participantesSeleccionados = [];
let etiquetasSeleccionadas = [];

// Obtener referencias a elementos del DOM de forma segura
function getElements() {
  return {
    inputNombre: document.getElementById("evtNombre"),
    inputFecha: document.getElementById("evtFecha"),
    msgCrear: document.getElementById("msgCrear"),
    listaEventos: document.getElementById("listaEventos"),
    // Inputs removidos temporalmente para probar flujo punta a punta
    // inputParticipanteEvento: document.getElementById("inputParticipanteEvento"),
    // inputEtiquetaEvento: document.getElementById("inputEtiquetaEvento"),
    // sugerenciasParticipantes: document.getElementById("sugerenciasParticipantes"),
    // sugerenciasEtiquetas: document.getElementById("sugerenciasEtiquetas"),
    // participantesSeleccionados: document.getElementById("participantesSeleccionados"),
    // etiquetasSeleccionadas: document.getElementById("etiquetasSeleccionadas")
  };
}

// Obtener participantes seleccionados (deshabilitado temporalmente)
function obtenerParticipantesSeleccionados() {
  // return participantesSeleccionados.map(p => p.nombre);
  return []; // Por ahora, crear eventos sin participantes pre-seleccionados
}

// Obtener etiquetas seleccionadas (deshabilitado temporalmente)
function obtenerEtiquetasSeleccionadas() {
  // return etiquetasSeleccionadas.map(e => ({ nombre: e.nombre }));
  return []; // Por ahora, crear eventos sin etiquetas pre-seleccionadas
}

// Cargar plantillas de participantes y etiquetas
async function cargarPlantillas() {
  try {
    // Cargar usuarios históricos (base de datos única de participantes)
    const usuariosResult = await listarUsuarios();
    if (usuariosResult.ok) {
      // Usar usuarios históricos como plantillas de participantes
      plantillasParticipantes = usuariosResult.data.map(u => ({
        id: u.id,
        nombre: u.nombre
      }));
      console.log('Usuarios históricos cargados:', plantillasParticipantes.length);
    } else {
      console.error('Error al cargar usuarios:', usuariosResult.error);
      // Fallback a plantillas si falla cargar usuarios
      const participantesResult = await listarPlantillasParticipantes();
      if (participantesResult.ok) {
        plantillasParticipantes = participantesResult.data;
        console.log('Plantillas de participantes cargadas (fallback):', plantillasParticipantes.length);
      }
    }
    
    // Cargar plantillas de etiquetas
    const etiquetasResult = await listarPlantillasEtiquetas();
    if (etiquetasResult.ok) {
      plantillasEtiquetas = etiquetasResult.data;
      console.log('Plantillas de etiquetas cargadas:', plantillasEtiquetas.length);
    } else {
      console.error('Error al cargar plantillas de etiquetas:', etiquetasResult.error);
    }
  } catch (error) {
    console.error('Error al cargar plantillas:', error);
  }
}

// Mostrar sugerencias de participantes (deshabilitado temporalmente)
function mostrarSugerenciasParticipantes(texto) {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  const { sugerenciasParticipantes, inputParticipanteEvento } = getElements();
  if (!sugerenciasParticipantes || !inputParticipanteEvento) {
    console.log('Elementos no encontrados:', { sugerenciasParticipantes, inputParticipanteEvento });
    return;
  }
  
  const textoOriginal = texto;
  texto = texto.trim().toLowerCase();
  
  if (!texto) {
    sugerenciasParticipantes.classList.add('hidden');
    return;
  }
  
  console.log('Buscando sugerencias para:', textoOriginal, 'Plantillas disponibles:', plantillasParticipantes.length);
  
  // Filtrar plantillas que coincidan con el texto
  const sugerencias = plantillasParticipantes.filter(p => 
    p.nombre.toLowerCase().includes(texto) &&
    !participantesSeleccionados.some(sel => sel.nombre.toLowerCase() === p.nombre.toLowerCase())
  );
  
  console.log('Sugerencias encontradas:', sugerencias.length);
  
  sugerenciasParticipantes.innerHTML = '';
  
  if (sugerencias.length === 0 && texto.length > 0) {
    // Mostrar opción para crear nuevo
    const item = document.createElement('div');
    item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer border-b';
    item.innerHTML = `<span class="text-gray-600">Crear nuevo: "<strong>${inputParticipanteEvento.value}</strong>"</span>`;
    item.onclick = () => agregarParticipante(inputParticipanteEvento.value);
    sugerenciasParticipantes.appendChild(item);
  } else {
    sugerencias.forEach(plantilla => {
      const item = document.createElement('div');
      item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer border-b';
      item.textContent = plantilla.nombre;
      item.onclick = () => agregarParticipante(plantilla.nombre);
      sugerenciasParticipantes.appendChild(item);
    });
  }
  
  sugerenciasParticipantes.classList.remove('hidden');
  */
}

// Mostrar sugerencias de etiquetas (deshabilitado temporalmente)
function mostrarSugerenciasEtiquetas(texto) {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  const { sugerenciasEtiquetas, inputEtiquetaEvento } = getElements();
  if (!sugerenciasEtiquetas || !inputEtiquetaEvento) return;
  
  texto = texto.trim().toLowerCase();
  
  if (!texto) {
    sugerenciasEtiquetas.classList.add('hidden');
    return;
  }
  
  // Filtrar plantillas que coincidan con el texto
  const sugerencias = plantillasEtiquetas.filter(e => 
    e.nombre.toLowerCase().includes(texto) &&
    !etiquetasSeleccionadas.some(sel => sel.nombre.toLowerCase() === e.nombre.toLowerCase())
  );
  
  sugerenciasEtiquetas.innerHTML = '';
  
  if (sugerencias.length === 0 && texto.length > 0) {
    // Mostrar opción para crear nuevo
    const item = document.createElement('div');
    item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer border-b';
    item.innerHTML = `<span class="text-gray-600">Crear nuevo: "<strong>${inputEtiquetaEvento.value}</strong>"</span>`;
    item.onclick = () => agregarEtiqueta(inputEtiquetaEvento.value);
    sugerenciasEtiquetas.appendChild(item);
  } else {
    sugerencias.forEach(plantilla => {
      const item = document.createElement('div');
      item.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer border-b';
      item.textContent = plantilla.nombre;
      item.onclick = () => agregarEtiqueta(plantilla.nombre);
      sugerenciasEtiquetas.appendChild(item);
    });
  }
  
  sugerenciasEtiquetas.classList.remove('hidden');
  */
}

// Agregar participante seleccionado (deshabilitado temporalmente)
async function agregarParticipante(nombre) {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  nombre = nombre.trim();
  if (!nombre) return;
  
  // Verificar que no esté ya seleccionado
  if (participantesSeleccionados.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
    return;
  }
  
  // Guardar en la base de datos única de usuarios
  try {
    const { guardarUsuario } = await import('./firestore.js');
    const resultado = await guardarUsuario(nombre);
    if (resultado.ok && !resultado.data.existe) {
      // Si es un usuario nuevo, agregarlo a la lista local
      plantillasParticipantes.push({ id: resultado.data.id, nombre: nombre });
    }
  } catch (error) {
    console.error('Error al guardar usuario:', error);
    // No bloqueamos el flujo si falla guardar el usuario
  }
  
  participantesSeleccionados.push({ nombre: nombre });
  renderizarParticipantesSeleccionados();
  
  const { inputParticipanteEvento, sugerenciasParticipantes } = getElements();
  if (inputParticipanteEvento) inputParticipanteEvento.value = '';
  if (sugerenciasParticipantes) sugerenciasParticipantes.classList.add('hidden');
  */
}

// Agregar etiqueta seleccionada (deshabilitado temporalmente)
async function agregarEtiqueta(nombre) {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  nombre = nombre.trim();
  if (!nombre) return;
  
  // Verificar que no esté ya seleccionada
  if (etiquetasSeleccionadas.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
    return;
  }
  
  // Verificar si existe en plantillas, si no, crearlo
  let existeEnPlantillas = plantillasEtiquetas.some(e => e.nombre.toLowerCase() === nombre.toLowerCase());
  if (!existeEnPlantillas) {
    const resultado = await crearPlantillaEtiqueta(nombre);
    if (resultado.ok) {
      plantillasEtiquetas.push({ id: resultado.data.id, nombre: nombre });
    }
  }
  
  etiquetasSeleccionadas.push({ nombre: nombre });
  renderizarEtiquetasSeleccionadas();
  
  const { inputEtiquetaEvento, sugerenciasEtiquetas } = getElements();
  if (inputEtiquetaEvento) inputEtiquetaEvento.value = '';
  if (sugerenciasEtiquetas) sugerenciasEtiquetas.classList.add('hidden');
  */
}

// Renderizar participantes seleccionados (deshabilitado temporalmente)
function renderizarParticipantesSeleccionados() {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  const { participantesSeleccionados: contenedor } = getElements();
  if (!contenedor) return;
  
  contenedor.innerHTML = '';
  
  participantesSeleccionados.forEach((participante, index) => {
    const badge = document.createElement('div');
    badge.className = 'inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm';
    
    const nombre = document.createElement('span');
    nombre.textContent = participante.nombre;
    
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'text-purple-700 hover:text-purple-900';
    btnEliminar.innerHTML = '×';
    btnEliminar.onclick = () => {
      participantesSeleccionados.splice(index, 1);
      renderizarParticipantesSeleccionados();
    };
    
    badge.appendChild(nombre);
    badge.appendChild(btnEliminar);
    contenedor.appendChild(badge);
  });
  */
}

// Renderizar etiquetas seleccionadas (deshabilitado temporalmente)
function renderizarEtiquetasSeleccionadas() {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  const { etiquetasSeleccionadas: contenedor } = getElements();
  if (!contenedor) return;
  
  contenedor.innerHTML = '';
  
  etiquetasSeleccionadas.forEach((etiqueta, index) => {
    const badge = document.createElement('div');
    badge.className = 'inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm';
    
    const nombre = document.createElement('span');
    nombre.textContent = etiqueta.nombre;
    
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'text-blue-700 hover:text-blue-900';
    btnEliminar.innerHTML = '×';
    btnEliminar.onclick = () => {
      etiquetasSeleccionadas.splice(index, 1);
      renderizarEtiquetasSeleccionadas();
    };
    
    badge.appendChild(nombre);
    badge.appendChild(btnEliminar);
    contenedor.appendChild(badge);
  });
  */
}

// Inicializar autocompletado (deshabilitado temporalmente)
function inicializarAutocompletado() {
  // Código comentado temporalmente - inputs removidos para probar flujo punta a punta
  /*
  const { inputParticipanteEvento, inputEtiquetaEvento, sugerenciasParticipantes, sugerenciasEtiquetas } = getElements();
  
  // Autocompletado de participantes
  if (inputParticipanteEvento) {
    inputParticipanteEvento.addEventListener('input', (e) => {
      mostrarSugerenciasParticipantes(e.target.value);
    });
    
    inputParticipanteEvento.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = e.target.value.trim();
        if (valor) {
          agregarParticipante(valor);
        }
      } else if (e.key === 'Escape') {
        sugerenciasParticipantes?.classList.add('hidden');
      }
    });
    
    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!inputParticipanteEvento.contains(e.target) && !sugerenciasParticipantes?.contains(e.target)) {
        sugerenciasParticipantes?.classList.add('hidden');
      }
    });
  }
  
  // Autocompletado de etiquetas
  if (inputEtiquetaEvento) {
    inputEtiquetaEvento.addEventListener('input', (e) => {
      mostrarSugerenciasEtiquetas(e.target.value);
    });
    
    inputEtiquetaEvento.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = e.target.value.trim();
        if (valor) {
          agregarEtiqueta(valor);
        }
      } else if (e.key === 'Escape') {
        sugerenciasEtiquetas?.classList.add('hidden');
      }
    });
    
    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!inputEtiquetaEvento.contains(e.target) && !sugerenciasEtiquetas?.contains(e.target)) {
        sugerenciasEtiquetas?.classList.add('hidden');
      }
    });
  }
  */
}

// Preset fecha de hoy
function presetToday() {
  const { inputFecha } = getElements();
  if (inputFecha && !inputFecha.value) {
    const hoyISO = new Date().toISOString().slice(0, 10);
    inputFecha.value = hoyISO;
  }
}

export async function crearEvento() {
  const { inputNombre, inputFecha, msgCrear } = getElements();
  
  if (!msgCrear) {
    console.error("No se encontró el elemento msgCrear");
    return;
  }
  
  msgCrear.textContent = "Creando...";
  msgCrear.classList.remove("text-green-600", "text-red-600");
  msgCrear.classList.add("text-gray-600");

  const nombre = (inputNombre?.value || "").trim() || "Cata sin nombre";
  const fechaInput = inputFecha?.value || new Date().toISOString().slice(0, 10);
  
  // Normalizar a ISO 8601 (YYYY-MM-DD) - ESTÁNDAR WEB
  let fechaISO;
  try {
    fechaISO = normalizarFechaISO(fechaInput);
    if (!fechaISO || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
      throw new Error("Fecha inválida después de normalización");
    }
  } catch (err) {
    console.error("Error al normalizar fecha:", err);
    msgCrear.textContent = "Error: Formato de fecha inválido";
    msgCrear.classList.remove("text-gray-600");
    msgCrear.classList.add("text-red-600");
    return;
  }

  try {
    // Obtener participantes y etiquetas seleccionados
    const participantesSeleccionados = obtenerParticipantesSeleccionados();
    const etiquetasSeleccionadas = obtenerEtiquetasSeleccionadas();
    
    // Obtener información del anfitrión desde localStorage o crear uno nuevo
    const anfitrionInfo = await obtenerOcrearAnfitrion();
    
    console.log("Creando evento (ISO 8601):", { 
      nombre, 
      fecha: fechaISO,
      participantes: participantesSeleccionados.length,
      etiquetas: etiquetasSeleccionadas.length,
      anfitrion: anfitrionInfo.tipo
    });
    const r = await crearEventoFirestore(nombre, fechaISO, participantesSeleccionados, etiquetasSeleccionadas, anfitrionInfo);

    console.log("Respuesta de Firestore:", r);

    if (r.ok) {
      const pin = r.data.pin || 'N/A';
      const eventoId = r.data.id;
      const anfitrionSesionId = r.data.anfitrion?.sesionId;
      
      // Guardar sesión del anfitrión efímero en localStorage
      if (anfitrionSesionId && r.data.anfitrion?.tipo === 'efimero') {
        localStorage.setItem('anfitrion_sesion_id', anfitrionSesionId);
        localStorage.setItem('anfitrion_evento_id', eventoId);
        console.log('Sesión de anfitrión efímero guardada:', anfitrionSesionId);
      }
      
      msgCrear.textContent = `Evento creado - PIN: ${pin}`;
      msgCrear.classList.remove("text-gray-600");
      msgCrear.classList.add("text-green-600");

      if (inputNombre) inputNombre.value = "";
      
      // Limpiar selecciones después de crear evento (deshabilitado temporalmente)
      // limpiarSelecciones();
      
      try {
        resetConfiguracionEtiquetasNaipes();
      } catch (err) {
        console.error("Error al resetear configuración:", err);
      }
      
      try {
        await listarEventos();
      } catch (err) {
        console.error("Error al listar eventos:", err);
        // No bloqueamos el flujo si falla listar eventos
      }
    } else {
      msgCrear.textContent = "Error: " + (r.error || "No se pudo crear el evento");
      msgCrear.classList.remove("text-gray-600");
      msgCrear.classList.add("text-red-600");
    }
  } catch (err) {
    console.error("Error inesperado al crear el evento:", err);
    console.error("Detalles del error:", {
      message: err.message,
      stack: err.stack,
      nombre: err.name
    });
    msgCrear.textContent = `Error inesperado: ${err.message || "Ver consola para más detalles"}`;
    msgCrear.classList.remove("text-gray-600");
    msgCrear.classList.add("text-red-600");
  }
}

export async function listarEventos() {
  // Prevenir llamadas concurrentes
  if (listandoEventos) {
    console.log("listarEventos ya está en ejecución, ignorando llamada duplicada");
    return;
  }
  
  listandoEventos = true;
  
  try {
    const { listaEventos } = getElements();
    
    if (!listaEventos) {
      console.error("No se encontró el elemento listaEventos");
      return;
    }
    
    // Limpiar completamente antes de empezar
    listaEventos.innerHTML = "<li>Cargando...</li>";
    const r = await listarEventosFirestore();

    if (!r.ok) {
      listaEventos.innerHTML = `<li>Error: ${r.error}</li>`;
      setEventoActivo(null);
      return;
    }

    const eventos = r.data || [];
    if (!eventos.length) {
      listaEventos.innerHTML = "<li>No hay eventos todavía</li>";
      setEventoActivo(null);
      resetConfiguracionEtiquetasNaipes();
      return;
    }

    // Elegir evento activo: si hay múltiples, usar el primero; si ninguno marcado, último
    const eventosActivos = eventos.filter(e => e.activo);
    let activo = eventosActivos.length > 0 ? eventosActivos[0] : null;
    if (!activo) {
      activo = eventos[eventos.length - 1];
    }
    
    const eventoAnterior = getEventoActivo();
    const cambioEvento = !eventoAnterior || eventoAnterior.id !== activo?.id;
    
    setEventoActivo(activo);

    // Si cambió el evento activo, cargar sus datos (participantes y etiquetas)
    if (cambioEvento && activo) {
      console.log('🔄 Cambió el evento activo, cargando datos del nuevo evento:', activo.id);
      try {
        await cargarParticipantes();
        await cargarEtiquetasDelEvento();
      } catch (err) {
        console.error('Error al cargar datos del evento:', err);
      }
    } else if (!activo) {
      // Si no hay evento activo, limpiar todo
      resetConfiguracionEtiquetasNaipes();
    }

    // Limpiar timers anteriores antes de recrear la lista
    limpiarTimersDisplay();
    
    // Limpiar completamente antes de agregar nuevos elementos
    listaEventos.innerHTML = "";
    
    // Usar DocumentFragment para mejorar rendimiento y evitar problemas de renderizado
    const fragment = document.createDocumentFragment();
    
    eventos.forEach(evt => {
        const li = document.createElement("li");
        li.className = "border rounded-xl px-3 py-2 flex justify-between items-center gap-2";

        const span = document.createElement("span");
        // Mostrar fecha en formato DD-MM-YYYY para UI, pero mantener ISO internamente
        const fechaMostrar = formatearFechaParaUI(evt.fecha);
        span.textContent = `${fechaMostrar} — ${evt.nombre}`;

        const acciones = document.createElement("div");
        acciones.className = "flex gap-2 items-center";

        const btnEstado = document.createElement("button");
        const eventoActivo = getEventoActivo();
        const esActivo = eventoActivo && evt.id === eventoActivo.id;
        const estaFinalizado = evt.eventoFinalizado === true;

        // Si está finalizado, mostrar "Finalizado" con estilo diferente
        if (estaFinalizado) {
          btnEstado.className = "text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-300";
          btnEstado.textContent = "Finalizado";
          btnEstado.disabled = true;
          btnEstado.style.cursor = "default";
          
          // Botón para ver resultados del evento finalizado
          const btnResultados = document.createElement("button");
          btnResultados.textContent = "📊 Ver Resultados";
          btnResultados.className = "text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200";
          btnResultados.title = "Ver resultados del evento finalizado";
          btnResultados.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.location.href = `/resultados.html?evento=${evt.id}`;
          };
          btnResultados.style.cursor = "pointer";
          acciones.appendChild(btnResultados);
        } else if (esActivo) {
          btnEstado.className = "text-xs px-2 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-300";
          btnEstado.textContent = "Activo";
          btnEstado.disabled = true;
          btnEstado.style.cursor = "default";
        } else {
          btnEstado.className = "text-xs px-2 py-1 rounded-full border bg-white text-gray-600 border-gray-300 hover:bg-gray-50";
          btnEstado.textContent = "Hacer activo";
          btnEstado.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // Prevenir otros listeners
            
            // Deshabilitar botón inmediatamente para prevenir múltiples clicks
            btnEstado.disabled = true;
            btnEstado.textContent = "Procesando...";
            btnEstado.style.cursor = "not-allowed";
            
            console.log("Click en botón 'Hacer activo' para evento:", evt);
            try {
              await marcarEventoActivo(evt);
            } finally {
              // Re-habilitar botón después de procesar (listarEventos actualizará la UI)
              // No lo hacemos aquí porque listarEventos() recreará los botones
            }
          };
          btnEstado.style.cursor = "pointer";
        }

        // Botón QR
        const btnQR = document.createElement("button");
        btnQR.textContent = "📱 QR";
        btnQR.className = "text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200";
        btnQR.title = "Generar código QR para compartir";
        btnQR.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const fechaMostrar = formatearFechaParaUI(evt.fecha);
          await mostrarQRModal(evt.id, evt.nombre, fechaMostrar, evt.pin);
        };
        btnQR.style.cursor = "pointer";

        // Botón eliminar
        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.className = "text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200";
        btnEliminar.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const fechaMostrar = formatearFechaParaUI(evt.fecha);
          const nombreEvento = evt.nombre || 'Evento sin nombre';
          
          if (!confirm(`¿Eliminar el evento "${nombreEvento}" (${fechaMostrar})?\n\nEsto eliminará también todos los participantes y etiquetas asociados.`)) {
            return;
          }
          
          btnEliminar.disabled = true;
          btnEliminar.textContent = "Eliminando...";
          btnEliminar.style.cursor = "not-allowed";
          
          try {
            const r = await eliminarEventoFirestore(evt.id);
            
            if (r.ok) {
              // Si el evento eliminado era el activo, limpiar el estado
              if (esActivo) {
                setEventoActivo(null);
                resetConfiguracionEtiquetasNaipes();
              }
              
              // Recargar la lista de eventos
              await listarEventos();
            } else {
              alert("Error: " + (r.error || "No se pudo eliminar el evento"));
              btnEliminar.disabled = false;
              btnEliminar.textContent = "Eliminar";
              btnEliminar.style.cursor = "pointer";
            }
          } catch (err) {
            console.error("Error al eliminar evento:", err);
            alert("Error inesperado al eliminar el evento: " + err.message);
            btnEliminar.disabled = false;
            btnEliminar.textContent = "Eliminar";
            btnEliminar.style.cursor = "pointer";
          }
        };
        btnEliminar.style.cursor = "pointer";

        // Botón Timer (solo para eventos activos)
        if (esActivo) {
          // Si el timer está pausado, mostrar botón para reanudar
          if (evt.timerPausado && evt.timerTiempoRestante) {
            const btnReanudar = document.createElement("button");
            btnReanudar.className = "text-xs font-mono font-bold text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1 rounded cursor-pointer transition-colors";
            btnReanudar.textContent = "⏸️ Pausado";
            btnReanudar.title = "Haz clic para reanudar el timer";
            btnReanudar.onclick = async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              btnReanudar.disabled = true;
              btnReanudar.textContent = "Reanudando...";
              
              try {
                const r = await reanudarTimerEvento(evt.id);
                if (r.ok) {
                  // Recargar para mostrar estado actualizado
                  await listarEventos();
                } else {
                  alert("⚠️ Error: " + (r.error || "No se pudo reanudar el timer"));
                  btnReanudar.disabled = false;
                  btnReanudar.textContent = "⏸️ Pausado";
                }
              } catch (err) {
                console.error("Error al reanudar timer:", err);
                alert("⚠️ Error inesperado: " + err.message);
                btnReanudar.disabled = false;
                btnReanudar.textContent = "⏸️ Pausado";
              }
            };
            acciones.appendChild(btnReanudar);
          }
          // Si el timer ya está activo, mostrar botón "+ 5'" y contador clickeable para pausar
          else if (evt.timerActivo && evt.timerExpiraEn) {
            // Contenedor para botón y contador
            const timerContainer = document.createElement("div");
            timerContainer.className = "flex items-center gap-2";
            
            // Contador de tiempo restante (clickeable para pausar)
            const timerDisplay = document.createElement("button");
            timerDisplay.className = "text-xs font-mono font-bold text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1 rounded cursor-pointer transition-colors";
            timerDisplay.id = `timer-${evt.id}`;
            timerDisplay.textContent = "--:--";
            timerDisplay.title = "Haz clic para pausar el timer";
            timerDisplay.onclick = async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Pausar sin confirmación
              timerDisplay.disabled = true;
              timerDisplay.textContent = "Pausando...";
              
              try {
                const r = await pausarTimerEvento(evt.id);
                if (r.ok) {
                  // Recargar para mostrar estado actualizado (pausado)
                  await listarEventos();
                } else {
                  alert("⚠️ Error: " + (r.error || "No se pudo pausar el timer"));
                  timerDisplay.disabled = false;
                  timerDisplay.textContent = "--:--";
                }
              } catch (err) {
                console.error("Error al pausar timer:", err);
                alert("⚠️ Error inesperado: " + err.message);
                timerDisplay.disabled = false;
                timerDisplay.textContent = "--:--";
              }
            };
            timerContainer.appendChild(timerDisplay);
            
            // Botón "+ 5'"
            const btnAumentar = document.createElement("button");
            btnAumentar.textContent = "+ 5'";
            btnAumentar.className = "text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200";
            btnAumentar.title = "Agregar 5 minutos al timer";
            btnAumentar.onclick = async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              btnAumentar.disabled = true;
              btnAumentar.textContent = "...";
              
              try {
                const r = await aumentarTiempoTimer(evt.id, 5);
                if (r.ok) {
                  // Recargar para actualizar el timestamp
                  await listarEventos();
                } else {
                  alert("Error: " + (r.error || "No se pudo agregar tiempo"));
                  btnAumentar.disabled = false;
                  btnAumentar.textContent = "+ 5'";
                }
              } catch (err) {
                console.error("Error al aumentar timer:", err);
                alert("Error inesperado: " + err.message);
                btnAumentar.disabled = false;
                btnAumentar.textContent = "+ 5'";
              }
            };
            btnAumentar.style.cursor = "pointer";
            timerContainer.appendChild(btnAumentar);
            
            acciones.appendChild(timerContainer);
            
            // Iniciar actualización del timer para este evento después de un breve delay
            // para asegurar que el elemento esté en el DOM
            setTimeout(() => {
              // Asegurar que timerExpiraEn esté en milisegundos
              const timestampMs = typeof evt.timerExpiraEn === 'number' 
                ? evt.timerExpiraEn 
                : Number(evt.timerExpiraEn);
              if (!isNaN(timestampMs) && timestampMs > 0) {
                iniciarTimerDisplay(evt.id, timestampMs);
              }
            }, 50);
          } else {
            // Botón "Timer" cuando no está activo
            const btnTimer = document.createElement("button");
            btnTimer.textContent = "⏱️ Timer";
            btnTimer.className = "text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200";
            btnTimer.title = "Iniciar temporizador de 30 minutos";
            btnTimer.onclick = async (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Validar prerrequisitos antes de iniciar
              btnTimer.disabled = true;
              btnTimer.textContent = "Validando...";
              
              try {
                const validacion = await validarPrerrequisitosTimer(evt.id);
                
                if (!validacion.valido) {
                  // Mostrar warning con los errores encontrados
                  const mensajeError = "⚠️ " + validacion.errores.join(". ");
                  alert(mensajeError);
                  btnTimer.disabled = false;
                  btnTimer.textContent = "⏱️ Timer";
                  return;
                }
                
                btnTimer.textContent = "Iniciando...";
                
                const r = await activarTimerEvento(evt.id, 30);
                if (r.ok) {
                  await listarEventos(); // Recargar para mostrar estado actualizado con timer
                } else {
                  alert("⚠️ Error: " + (r.error || "No se pudo activar el timer"));
                  btnTimer.disabled = false;
                  btnTimer.textContent = "⏱️ Timer";
                }
              } catch (err) {
                console.error("Error al activar timer:", err);
                alert("⚠️ Error inesperado: " + err.message);
                btnTimer.disabled = false;
                btnTimer.textContent = "⏱️ Timer";
              }
            };
            btnTimer.style.cursor = "pointer";
            acciones.appendChild(btnTimer);
          }
          
          // Botón Solución (para que el anfitrión complete las respuestas correctas)
          const btnSolucion = document.createElement("button");
          btnSolucion.textContent = "✅ Solución";
          btnSolucion.className = "text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200";
          btnSolucion.title = "Completar las respuestas correctas del evento";
          btnSolucion.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Redirigir a la página de solución del anfitrión
            window.location.href = `/anfitrion.html?evento=${evt.id}`;
          };
          btnSolucion.style.cursor = "pointer";
          acciones.appendChild(btnSolucion);
        }

        acciones.appendChild(btnEstado);
        acciones.appendChild(btnQR);
        acciones.appendChild(btnEliminar);

        li.appendChild(span);
        li.appendChild(acciones);
        fragment.appendChild(li);
    });
    
    // Agregar todos los elementos de una vez
    listaEventos.appendChild(fragment);

    // Solo cargar participantes y etiquetas si no cambió el evento (ya se cargaron arriba)
    if (!cambioEvento && activo) {
      await cargarParticipantes();
      await cargarEtiquetasDelEvento();
    }
  } finally {
    // Siempre liberar el flag, incluso si hay un error
    listandoEventos = false;
  }
}

async function marcarEventoActivo(evt) {
  // Prevenir múltiples llamadas concurrentes
  if (marcandoActivo) {
    console.log("⚠️ marcarEventoActivo ya está en ejecución, ignorando llamada duplicada");
    return;
  }
  
  marcandoActivo = true;
  
  try {
    console.log("Marcando evento como activo:", evt);
    
    if (!evt || !evt.id) {
      console.error("Evento inválido:", evt);
      alert("Error: Evento inválido");
      return;
    }
    
    // Validar que el evento tenga los datos básicos
    // Nota: Con Firestore, el nombre y fecha no son estrictamente requeridos para marcar como activo
    // pero los validamos para evitar problemas
    if (!evt || !evt.id) {
      console.error("Evento inválido:", evt);
      alert("Error: Evento inválido. Por favor, recarga la página.");
      return;
    }
    
    // Log para debug
    console.log("📋 Evento a activar:", {
      id: evt.id,
      nombre: evt.nombre || '(sin nombre)',
      fecha: evt.fecha || '(sin fecha)'
    });
    
    try {
    console.log("Marcando evento como activo en Firestore:", evt.id);
    
    const r = await marcarEventoActivoFirestore(evt.id);
    console.log("📥 Respuesta de Firestore:", r);
    
    if (!r.ok) {
      const errorMsg = "No se pudo marcar el evento como activo: " + (r.error || "");
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    // Verificar que el ID devuelto coincida con el original
    if (r.data && r.data.id !== evt.id) {
      console.error("❌ ERROR: El ID devuelto no coincide con el original");
      console.error("   ID original:", evt.id, "ID respuesta:", r.data.id);
      alert("⚠️ ERROR: Se detectó un problema al actualizar el evento.");
      return;
    }

    console.log("✅ Evento marcado como activo exitosamente, recargando lista...");
    // Volvemos a cargar lista y estado global
    await listarEventos();
    } catch (err) {
      console.error("Error inesperado al cambiar el estado del evento:", err);
      alert("Error inesperado al cambiar el estado del evento: " + err.message);
    }
  } finally {
    // Siempre liberar el flag, incluso si hay un error
    marcandoActivo = false;
  }
}

// Inicializar botones cuando el DOM esté listo
function inicializarBotones() {
  const btnCrear = document.getElementById("btnCrear");
  const btnListar = document.getElementById("btnListar");
  
  if (btnCrear) {
    btnCrear.onclick = crearEvento;
  } else {
    console.error("No se encontró el botón btnCrear");
  }
  
  if (btnListar) {
    btnListar.onclick = listarEventos;
  } else {
    console.error("No se encontró el botón btnListar");
  }
  
  // Preset fecha de hoy
  presetToday();
}

// Variables para el timer
let timerInterval = null;
let timerUnsubscribe = null;
let eventoActivoTimer = null;

/**
 * Función para validar prerrequisitos antes de iniciar el timer
 */
async function validarPrerrequisitosTimer(eventoId) {
  const errores = [];
  
  // Validar que haya al menos DOS participantes
  const participantesResult = await listarParticipantesFirestore(eventoId);
  if (!participantesResult.ok) {
    errores.push('No se pudieron cargar los participantes');
  } else if (!participantesResult.data || participantesResult.data.length < 2) {
    const cantidad = participantesResult.data ? participantesResult.data.length : 0;
    errores.push(`Se requieren al menos 2 participantes (actualmente hay ${cantidad})`);
  }
  
  // Validar que haya al menos DOS etiquetas configuradas
  const etiquetasResult = await listarEtiquetasFirestore(eventoId);
  if (!etiquetasResult.ok) {
    errores.push('No se pudieron cargar las etiquetas');
  } else if (!etiquetasResult.data || etiquetasResult.data.length < 2) {
    const cantidad = etiquetasResult.data ? etiquetasResult.data.length : 0;
    errores.push(`Se requieren al menos 2 etiquetas (actualmente hay ${cantidad})`);
  } else {
    // Validar que haya al menos DOS naipes configurados
    // Contar naipes únicos (naipes con naipeId o naipeNombre no vacío)
    const naipesUnicos = new Set();
    etiquetasResult.data.forEach(etq => {
      if (etq.naipeId && etq.naipeId.trim() !== '') {
        naipesUnicos.add(etq.naipeId);
      } else if (etq.naipeNombre && etq.naipeNombre.trim() !== '') {
        // Si no hay naipeId pero sí naipeNombre, usar el nombre como identificador
        naipesUnicos.add(etq.naipeNombre.trim());
      }
    });
    
    if (naipesUnicos.size < 2) {
      errores.push(`Se requieren al menos 2 naipes configurados (actualmente hay ${naipesUnicos.size})`);
    }
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
}

/**
 * Inicializar la lógica del timer
 */
function inicializarTimer() {
  const seccionTimer = document.getElementById('seccionTimer');
  const btnIniciarTimer = document.getElementById('btnIniciarTimer');
  const btnAumentarTimer = document.getElementById('btnAumentarTimer');
  const btnDetenerTimer = document.getElementById('btnDetenerTimer');
  const timerDisplay = document.getElementById('timerDisplay');
  const msgTimer = document.getElementById('msgTimer');
  
  if (!seccionTimer || !btnIniciarTimer || !btnAumentarTimer || !btnDetenerTimer || !timerDisplay) {
    return;
  }
  
  // Botón iniciar timer
  btnIniciarTimer.onclick = async () => {
    const eventoActivo = getEventoActivo();
    if (!eventoActivo) {
      if (msgTimer) {
        msgTimer.textContent = '⚠️ No hay evento activo';
        msgTimer.classList.remove('text-gray-600', 'text-green-600');
        msgTimer.classList.add('text-red-600');
      }
      return;
    }
    
    // Validar prerrequisitos antes de iniciar
    if (msgTimer) {
      msgTimer.textContent = 'Validando prerrequisitos...';
      msgTimer.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
      msgTimer.classList.add('text-gray-600');
    }
    
    const validacion = await validarPrerrequisitosTimer(eventoActivo.id);
    
    if (!validacion.valido) {
      // Mostrar warning con los errores encontrados
      const mensajeError = '⚠️ ' + validacion.errores.join('. ');
      if (msgTimer) {
        msgTimer.textContent = mensajeError;
        msgTimer.classList.remove('text-gray-600', 'text-green-600');
        msgTimer.classList.add('text-red-600');
      }
      return;
    }
    
    btnIniciarTimer.disabled = true;
    if (msgTimer) {
      msgTimer.textContent = 'Iniciando timer...';
      msgTimer.classList.remove('text-red-600', 'text-green-600');
      msgTimer.classList.add('text-gray-600');
    }
    
    try {
      const resultado = await activarTimerEvento(eventoActivo.id, 30);
      
      if (resultado.ok) {
        eventoActivoTimer = eventoActivo.id;
        
        // Calcular el timestamp de expiración (30 minutos desde ahora)
        const ahora = Date.now();
        const expiraEn = ahora + (30 * 60 * 1000);
        
        // Mostrar la sección del timer inmediatamente
        seccionTimer.classList.remove('hidden');
        btnIniciarTimer.disabled = true;
        btnAumentarTimer.disabled = false;
        btnDetenerTimer.disabled = false;
        
        // Actualizar display inmediatamente
        actualizarDisplayTimer(expiraEn);
        
        // Iniciar intervalo para actualizar cada segundo
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        timerInterval = setInterval(() => {
          actualizarDisplayTimer(expiraEn);
        }, 1000);
        
        // Iniciar escucha del timer (esto sincronizará con Firestore y actualizará el timestamp real)
        iniciarEscuchaTimer(eventoActivo.id);
        
        if (msgTimer) {
          msgTimer.textContent = '✅ Timer iniciado con 30 minutos';
          msgTimer.classList.remove('text-gray-600', 'text-red-600');
          msgTimer.classList.add('text-green-600');
          setTimeout(() => {
            if (msgTimer) {
              msgTimer.textContent = '';
              msgTimer.classList.remove('text-green-600');
              msgTimer.classList.add('text-gray-600');
            }
          }, 3000);
        }
      } else {
        if (msgTimer) {
          msgTimer.textContent = `⚠️ Error: ${resultado.error}`;
          msgTimer.classList.remove('text-gray-600', 'text-green-600');
          msgTimer.classList.add('text-red-600');
        }
        btnIniciarTimer.disabled = false;
      }
    } catch (error) {
      console.error('Error al iniciar timer:', error);
      if (msgTimer) {
        msgTimer.textContent = `⚠️ Error: ${error.message}`;
        msgTimer.classList.remove('text-gray-600', 'text-green-600');
        msgTimer.classList.add('text-red-600');
      }
      btnIniciarTimer.disabled = false;
    }
  };
  
  // Botón aumentar tiempo
  btnAumentarTimer.onclick = async () => {
    const eventoActivo = getEventoActivo();
    if (!eventoActivo) {
      if (msgTimer) msgTimer.textContent = 'No hay evento activo';
      return;
    }
    
    const resultado = await aumentarTiempoTimer(eventoActivo.id, 5);
    
    if (resultado.ok) {
      if (msgTimer) msgTimer.textContent = 'Se agregaron 5 minutos al timer';
      setTimeout(() => {
        if (msgTimer) msgTimer.textContent = '';
      }, 2000);
    } else {
      if (msgTimer) msgTimer.textContent = `Error: ${resultado.error}`;
    }
  };
  
  // Botón detener timer
  btnDetenerTimer.onclick = async () => {
    const eventoActivo = getEventoActivo();
    if (!eventoActivo) {
      if (msgTimer) msgTimer.textContent = 'No hay evento activo';
      return;
    }
    
    const resultado = await desactivarTimerEvento(eventoActivo.id);
    
    if (resultado.ok) {
      if (msgTimer) msgTimer.textContent = 'Timer detenido';
      detenerEscuchaTimer();
      eventoActivoTimer = null;
      seccionTimer.classList.add('hidden');
    } else {
      if (msgTimer) msgTimer.textContent = `Error: ${resultado.error}`;
    }
  };
  
  // Verificar si hay timer activo al cargar
  const eventoActivo = getEventoActivo();
  if (eventoActivo) {
    iniciarEscuchaTimer(eventoActivo.id);
  }
}

/**
 * Iniciar escucha en tiempo real del timer
 */
function iniciarEscuchaTimer(eventoId) {
  // Limpiar suscripción anterior si existe
  if (timerUnsubscribe) {
    timerUnsubscribe();
  }
  
  // Limpiar intervalo anterior si existe
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  const seccionTimer = document.getElementById('seccionTimer');
  const btnIniciarTimer = document.getElementById('btnIniciarTimer');
  const btnAumentarTimer = document.getElementById('btnAumentarTimer');
  const btnDetenerTimer = document.getElementById('btnDetenerTimer');
  const timerDisplay = document.getElementById('timerDisplay');
  const msgTimer = document.getElementById('msgTimer');
  
  if (!seccionTimer || !timerDisplay) return;
  
  // Verificar si el evento está finalizado
  import('./firestore.js').then(({ getEvento }) => {
    getEvento(eventoId).then(resultado => {
      if (resultado.ok && resultado.data.eventoFinalizado) {
        // Evento finalizado - mostrar leyenda y congelar timer
        seccionTimer.classList.remove('hidden');
        btnIniciarTimer.disabled = true;
        btnAumentarTimer.disabled = true;
        btnDetenerTimer.disabled = true;
        
        timerDisplay.textContent = '--:--';
        timerDisplay.classList.add('text-red-600');
        
        if (msgTimer) {
          msgTimer.textContent = '⏸️ Evento finalizado por el anfitrión';
          msgTimer.classList.add('text-red-600', 'font-semibold');
        }
        return;
      }
      
      // Suscribirse a cambios en tiempo real
      timerUnsubscribe = escucharTimerEvento(eventoId, (timerData) => {
        // Verificar nuevamente si el evento está finalizado
        getEvento(eventoId).then(resultado => {
          if (resultado.ok && resultado.data.eventoFinalizado) {
            // Evento finalizado - mostrar leyenda y congelar timer
            seccionTimer.classList.remove('hidden');
            btnIniciarTimer.disabled = true;
            btnAumentarTimer.disabled = true;
            btnDetenerTimer.disabled = true;
            
            timerDisplay.textContent = '--:--';
            timerDisplay.classList.add('text-red-600');
            
            if (msgTimer) {
              msgTimer.textContent = '⏸️ Evento finalizado por el anfitrión';
              msgTimer.classList.add('text-red-600', 'font-semibold');
            }
            
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            return;
          }
          
          if (timerData.timerActivo && timerData.timerExpiraEn) {
            seccionTimer.classList.remove('hidden');
            btnIniciarTimer.disabled = true;
            btnAumentarTimer.disabled = false;
            btnDetenerTimer.disabled = false;
            
            if (msgTimer) {
              msgTimer.textContent = '';
              msgTimer.classList.remove('text-red-600', 'font-semibold');
            }
            
            // Guardar el timestamp de expiración para el intervalo
            const expiraTimestamp = timerData.timerExpiraEn;
            
            // Actualizar display inmediatamente
            actualizarDisplayTimer(expiraTimestamp);
            
            // Iniciar intervalo para actualizar cada segundo
            if (timerInterval) {
              clearInterval(timerInterval);
            }
            timerInterval = setInterval(() => {
              actualizarDisplayTimer(expiraTimestamp);
            }, 1000);
          } else {
            seccionTimer.classList.add('hidden');
            btnIniciarTimer.disabled = false;
            btnAumentarTimer.disabled = true;
            btnDetenerTimer.disabled = true;
            
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
          }
        });
      });
    });
  });
}

/**
 * Detener escucha del timer
 */
function detenerEscuchaTimer() {
  if (timerUnsubscribe) {
    timerUnsubscribe();
    timerUnsubscribe = null;
  }
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const timerDisplay = document.getElementById('timerDisplay');
  if (timerDisplay) {
    timerDisplay.textContent = '--:--';
    timerDisplay.classList.remove('text-red-600');
  }
}

/**
 * Actualizar display del timer
 */
function actualizarDisplayTimer(timestampExpira) {
  const timerDisplay = document.getElementById('timerDisplay');
  if (!timerDisplay) return;
  
  const ahora = Date.now();
  const tiempoRestante = timestampExpira - ahora;
  
  if (tiempoRestante <= 0) {
    timerDisplay.textContent = '00:00';
    timerDisplay.classList.add('text-red-600');
    
    // Finalizar votaciones automáticamente
    finalizarVotacionesAutomaticamente();
    
    // Detener el intervalo
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return;
  }
  
  const minutos = Math.floor(tiempoRestante / 60000);
  const segundos = Math.floor((tiempoRestante % 60000) / 1000);
  
  const minutosStr = minutos.toString().padStart(2, '0');
  const segundosStr = segundos.toString().padStart(2, '0');
  
  timerDisplay.textContent = `${minutosStr}:${segundosStr}`;
  
  // Cambiar color a rojo cuando queden menos de 2 minutos
  if (tiempoRestante < 2 * 60 * 1000) {
    timerDisplay.classList.add('text-red-600');
  } else {
    timerDisplay.classList.remove('text-red-600');
  }
}

/**
 * Finalizar votaciones automáticamente cuando el timer llegue a 0
 */
async function finalizarVotacionesAutomaticamente() {
  const eventoActivo = getEventoActivo();
  if (!eventoActivo) return;
  
  console.log('Timer finalizado. Finalizando votaciones automáticamente...');
  
  // Aquí podrías implementar la lógica para finalizar todas las votaciones
  // Por ejemplo, marcar todas las participaciones como finalizadas
  // o mostrar un mensaje a los participantes
  
  const msgTimer = document.getElementById('msgTimer');
  if (msgTimer) {
    msgTimer.textContent = '⏰ Tiempo finalizado. Las votaciones han sido cerradas automáticamente.';
    msgTimer.classList.add('text-red-600', 'font-semibold');
  }
}

/**
 * Iniciar display del timer para un evento específico en la lista
 */
function iniciarTimerDisplay(eventoId, timestampExpira) {
  // Limpiar timer anterior si existe
  if (timersDisplay.has(eventoId)) {
    clearInterval(timersDisplay.get(eventoId));
  }
  
  const timerElement = document.getElementById(`timer-${eventoId}`);
  if (!timerElement) {
    console.log(`No se encontró el elemento timer-${eventoId}, reintentando en 100ms...`);
    // Reintentar después de un breve delay por si el DOM aún no está listo
    setTimeout(() => {
      const retryElement = document.getElementById(`timer-${eventoId}`);
      if (retryElement) {
        iniciarTimerDisplay(eventoId, timestampExpira);
      } else {
        console.error(`No se pudo encontrar el elemento timer-${eventoId} después del reintento`);
      }
    }, 100);
    return;
  }
  
  // Asegurar que timestampExpira sea un número (milisegundos)
  let timestampMs = timestampExpira;
  if (typeof timestampExpira !== 'number') {
    timestampMs = typeof timestampExpira === 'object' && timestampExpira.toMillis 
      ? timestampExpira.toMillis() 
      : Number(timestampExpira);
  }
  
  // Función para actualizar el display
  const actualizar = () => {
    const ahora = Date.now();
    const tiempoRestante = timestampMs - ahora;
    
    if (tiempoRestante <= 0) {
      timerElement.textContent = '00:00';
      timerElement.classList.add('text-red-600');
      timerElement.classList.remove('text-orange-600');
      if (timersDisplay.has(eventoId)) {
        clearInterval(timersDisplay.get(eventoId));
        timersDisplay.delete(eventoId);
      }
      return;
    }
    
    const minutos = Math.floor(tiempoRestante / 60000);
    const segundos = Math.floor((tiempoRestante % 60000) / 1000);
    
    const minutosStr = minutos.toString().padStart(2, '0');
    const segundosStr = segundos.toString().padStart(2, '0');
    
    timerElement.textContent = `${minutosStr}:${segundosStr}`;
    
    // Cambiar color a rojo cuando queden menos de 2 minutos
    if (tiempoRestante < 2 * 60 * 1000) {
      timerElement.classList.add('text-red-600');
      timerElement.classList.remove('text-orange-600');
    } else {
      timerElement.classList.remove('text-red-600');
      timerElement.classList.add('text-orange-600');
    }
  };
  
  // Actualizar inmediatamente
  actualizar();
  
  // Actualizar cada segundo para mostrar segundos
  const intervalId = setInterval(actualizar, 1000);
  timersDisplay.set(eventoId, intervalId);
  
  // Sincronizar con Firestore cada minuto para obtener el timestamp actualizado
  const syncIntervalId = setInterval(async () => {
    try {
      const { getEvento } = await import('./firestore.js');
      const resultado = await getEvento(eventoId);
      if (resultado.ok && resultado.data.timerActivo && resultado.data.timerExpiraEn) {
        // El timestamp viene como número en milisegundos desde getEvento
        const nuevoTimestamp = Number(resultado.data.timerExpiraEn);
        if (!isNaN(nuevoTimestamp)) {
          timestampMs = nuevoTimestamp;
        }
      }
    } catch (error) {
      console.error('Error al sincronizar timer:', error);
    }
  }, 60000); // Cada minuto
  
  // Guardar también el intervalo de sincronización para poder limpiarlo
  timersDisplay.set(`${eventoId}-sync`, syncIntervalId);
}

/**
 * Limpiar todos los timers de display
 */
function limpiarTimersDisplay() {
  timersDisplay.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  timersDisplay.clear();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    inicializarBotones();
    inicializarTimer();
    await cargarPlantillas();
    inicializarAutocompletado();
  });
} else {
  inicializarBotones();
  inicializarTimer();
  cargarPlantillas();
  inicializarAutocompletado();
}

