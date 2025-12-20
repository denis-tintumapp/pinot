import { guardarEtiquetas as guardarEtiquetasFirestore, listarEtiquetas as listarEtiquetasFirestore } from './firestore.js';
import { getEventoActivo } from './estado.js';
import { NAIPES_TRUCO } from './constantes.js';

// Obtener referencias a elementos del DOM de forma segura
function getEtiquetasElements() {
  return {
    inputEtqNombre: document.getElementById("etqNombre"),
    btnAgregarEtiqueta: document.getElementById("btnAgregarEtiqueta"),
    listaEtiquetas: document.getElementById("listaEtiquetas"),
    msgEtiquetas: document.getElementById("msgEtiquetas"),
    naipeSelect: document.getElementById("naipeSelect"),
    btnAgregarNaipe: document.getElementById("btnAgregarNaipe"),
    btnSugerirNaipes: document.getElementById("btnSugerirNaipes"),
    listaNaipes: document.getElementById("listaNaipes"),
    msgNaipes: document.getElementById("msgNaipes"),
    btnGuardarConfig: document.getElementById("btnGuardarConfig"),
    msgGuardarConfig: document.getElementById("msgGuardarConfig")
  };
}

let etiquetas = [];              // [{id, nombre}]
let naipesSeleccionados = [];    // [{id, nombre}]
let etiquetaEditando = null;     // {id, nombre} o null

export function resetConfiguracionEtiquetasNaipes() {
  etiquetas = [];
  naipesSeleccionados = [];
  etiquetaEditando = null;

  const { inputEtqNombre, btnAgregarEtiqueta } = getEtiquetasElements();
  
  if (inputEtqNombre) {
    inputEtqNombre.value = "";
  }
  if (btnAgregarEtiqueta) {
    btnAgregarEtiqueta.textContent = "Nueva etiqueta";
  }

  // Estas funciones ya manejan el caso de listas vacías
  try {
    renderEtiquetas();
    renderNaipesSeleccionados();
  } catch (err) {
    console.error("Error al renderizar después de reset:", err);
  }
}

function renderEtiquetas() {
  const { listaEtiquetas, msgEtiquetas } = getEtiquetasElements();
  
  if (!listaEtiquetas || !msgEtiquetas) {
    console.error("Elementos del DOM no encontrados para renderEtiquetas");
    return;
  }
  
  listaEtiquetas.innerHTML = "";

  if (!etiquetas.length) {
    listaEtiquetas.innerHTML =
      "<li class='text-xs text-gray-500'>No hay etiquetas cargadas.</li>";
    msgEtiquetas.textContent = "Agregá etiquetas con el botón 'Nueva etiqueta'.";
    msgEtiquetas.classList.remove("text-red-600");
    msgEtiquetas.classList.add("text-gray-600");
    return;
  }

  etiquetas.forEach((etq, idx) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center gap-2";

    const naipe = naipesSeleccionados[idx];
    const span = document.createElement("span");
    span.textContent = naipe
      ? `Etiqueta #${idx + 1} — ${etq.nombre} → ${naipe.nombre}`
      : `Etiqueta #${idx + 1} — ${etq.nombre}`;

    const acciones = document.createElement("div");
    acciones.className = "flex gap-2";

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Editar";
    btnEdit.className = "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800";
    btnEdit.onclick = () => comenzarEdicionEtiqueta(etq);

    acciones.appendChild(btnEdit);

    li.appendChild(span);
    li.appendChild(acciones);
    listaEtiquetas.appendChild(li);
  });

  msgEtiquetas.textContent =
    `Total de etiquetas: ${etiquetas.length}. Máximo de naipes: ${etiquetas.length}.`;
  msgEtiquetas.classList.remove("text-red-600");
  msgEtiquetas.classList.add("text-gray-600");
}

function comenzarEdicionEtiqueta(etq) {
  const { inputEtqNombre, btnAgregarEtiqueta, msgEtiquetas } = getEtiquetasElements();
  
  etiquetaEditando = etq;
  if (inputEtqNombre) inputEtqNombre.value = etq.nombre;
  if (btnAgregarEtiqueta) btnAgregarEtiqueta.textContent = "Guardar etiqueta";
  if (msgEtiquetas) {
    msgEtiquetas.textContent = `Editando: ${etq.nombre}`;
    msgEtiquetas.classList.remove("text-red-600");
    msgEtiquetas.classList.add("text-gray-600");
  }
}

function resetEdicionEtiqueta() {
  const { inputEtqNombre, btnAgregarEtiqueta } = getEtiquetasElements();
  
  etiquetaEditando = null;
  if (inputEtqNombre) inputEtqNombre.value = "";
  if (btnAgregarEtiqueta) btnAgregarEtiqueta.textContent = "Nueva etiqueta";
}

export function initNaipeSelect() {
  const { naipeSelect } = getEtiquetasElements();
  
  if (!naipeSelect) {
    console.error("No se encontró el elemento naipeSelect");
    return;
  }
  
  naipeSelect.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Seleccioná un naipe…";
  naipeSelect.appendChild(defaultOpt);

  NAIPES_TRUCO
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .forEach(n => {
      const opt = document.createElement("option");
      opt.value = n.id;
      opt.textContent = n.nombre;
      naipeSelect.appendChild(opt);
    });
}

function renderNaipesSeleccionados() {
  const { listaNaipes, msgNaipes } = getEtiquetasElements();
  
  if (!listaNaipes || !msgNaipes) {
    console.error("Elementos del DOM no encontrados para renderNaipesSeleccionados");
    return;
  }
  
  listaNaipes.innerHTML = "";
  const max = etiquetas.length;

  if (!naipesSeleccionados.length) {
    listaNaipes.innerHTML = "<li class='text-xs text-gray-500'>No hay naipes asignados.</li>";
  } else {
    naipesSeleccionados.forEach((n, idx) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center gap-2";

      const span = document.createElement("span");
      span.textContent = `#${idx + 1} — ${n.nombre}`;

      const btnRemove = document.createElement("button");
      btnRemove.textContent = "Quitar";
      btnRemove.className = "text-xs px-2 py-1 rounded bg-red-100 text-red-700";
      btnRemove.onclick = () => {
        naipesSeleccionados = naipesSeleccionados.filter(x => x.id !== n.id);
        renderNaipesSeleccionados();
        renderEtiquetas();
      };

      li.appendChild(span);
      li.appendChild(btnRemove);
      listaNaipes.appendChild(li);
    });
  }

  if (!max) {
    msgNaipes.textContent = "Cargá etiquetas primero para definir el máximo de naipes.";
    msgNaipes.classList.remove("text-red-600");
    msgNaipes.classList.add("text-gray-600");
  } else {
    msgNaipes.textContent =
      `Naipes seleccionados: ${naipesSeleccionados.length} / ${max} etiquetas.`;
    msgNaipes.classList.remove("text-red-600");
    msgNaipes.classList.add("text-gray-600");
  }
}

function agregarEtiqueta() {
  const { inputEtqNombre, msgEtiquetas } = getEtiquetasElements();
  
  if (!msgEtiquetas) {
    console.error("No se encontró el elemento msgEtiquetas");
    return;
  }
  
  msgEtiquetas.classList.remove("text-red-600");
  msgEtiquetas.classList.add("text-gray-600");

  const nombre = (inputEtqNombre?.value || "").trim();
  if (!nombre) {
    msgEtiquetas.textContent = "Ingresá un nombre para la etiqueta (vino).";
    msgEtiquetas.classList.remove("text-gray-600");
    msgEtiquetas.classList.add("text-red-600");
    return;
  }

  if (etiquetaEditando) {
    etiquetas = etiquetas.map(e =>
      e.id === etiquetaEditando.id ? { ...e, nombre } : e
    );
    msgEtiquetas.textContent = "Etiqueta actualizada.";
    msgEtiquetas.classList.remove("text-red-600");
    msgEtiquetas.classList.add("text-green-600");

    resetEdicionEtiqueta();
    renderEtiquetas();
    renderNaipesSeleccionados();
  } else {
    const id = "ETQ-" + (etiquetas.length + 1);
    etiquetas.push({ id, nombre });
    if (inputEtqNombre) inputEtqNombre.value = "";
    msgEtiquetas.textContent = "Etiqueta agregada.";
    msgEtiquetas.classList.remove("text-red-600");
    msgEtiquetas.classList.add("text-green-600");

    renderEtiquetas();
    renderNaipesSeleccionados();
  }
}

function agregarNaipe() {
  const { naipeSelect, msgNaipes } = getEtiquetasElements();
  
  if (!msgNaipes) {
    console.error("No se encontró el elemento msgNaipes");
    return;
  }
  
  msgNaipes.classList.remove("text-red-600");
  msgNaipes.classList.add("text-gray-600");

  const eventoActivo = getEventoActivo();
  if (!eventoActivo) {
    msgNaipes.textContent = "Primero creá/seleccioná un evento.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  if (!etiquetas.length) {
    msgNaipes.textContent = "Antes de asignar naipes, cargá al menos una etiqueta.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  const max = etiquetas.length;
  if (naipesSeleccionados.length >= max) {
    msgNaipes.textContent = `Ya seleccionaste el máximo de naipes (${max}) para las etiquetas cargadas.`;
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  if (!naipeSelect) {
    msgNaipes.textContent = "Error: No se encontró el selector de naipes.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  const naipeId = naipeSelect.value;
  if (!naipeId) {
    msgNaipes.textContent = "Seleccioná un naipe de la lista.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  if (naipesSeleccionados.some(n => n.id === naipeId)) {
    msgNaipes.textContent = "Ese naipe ya fue seleccionado. Elegí otro.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  const meta = NAIPES_TRUCO.find(n => n.id === naipeId);
  if (!meta) {
    msgNaipes.textContent = "Naipe inválido.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  naipesSeleccionados.push({ id: meta.id, nombre: meta.nombre });
  renderNaipesSeleccionados();
  renderEtiquetas();
}

function sugerirNaipes() {
  const { msgNaipes } = getEtiquetasElements();
  
  if (!msgNaipes) {
    console.error("No se encontró el elemento msgNaipes");
    return;
  }
  
  msgNaipes.classList.remove("text-red-600");
  msgNaipes.classList.add("text-gray-600");

  const eventoActivo = getEventoActivo();
  if (!eventoActivo) {
    msgNaipes.textContent = "Primero creá/seleccioná un evento.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  if (!etiquetas.length) {
    msgNaipes.textContent = "Cargá las etiquetas antes de sugerir naipes.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  const max = etiquetas.length;
  const ya = naipesSeleccionados.length;
  const faltan = max - ya;

  if (faltan <= 0) {
    msgNaipes.textContent = "Ya tenés asignados naipes para todas las etiquetas.";
    msgNaipes.classList.remove("text-gray-600");
    msgNaipes.classList.add("text-red-600");
    return;
  }

  const disponibles = NAIPES_TRUCO.filter(
    n => !naipesSeleccionados.some(sel => sel.id === n.id)
  ).slice(0, faltan);

  disponibles.forEach(n => naipesSeleccionados.push({ id: n.id, nombre: n.nombre }));

  renderNaipesSeleccionados();
  renderEtiquetas();

  msgNaipes.textContent =
    `Se sugirieron automáticamente ${disponibles.length} naipes según el ranking de Truco.`;
  msgNaipes.classList.remove("text-red-600");
  msgNaipes.classList.add("text-green-600");
}

async function guardarConfiguracion() {
  const { msgGuardarConfig } = getEtiquetasElements();
  
  if (!msgGuardarConfig) {
    console.error("No se encontró el elemento msgGuardarConfig");
    return;
  }
  
  msgGuardarConfig.textContent = "";
  msgGuardarConfig.classList.remove("text-red-600", "text-green-600");
  msgGuardarConfig.classList.add("text-gray-600");

  const eventoActivo = getEventoActivo();
  if (!eventoActivo) {
    msgGuardarConfig.textContent = "Creá un evento antes de guardar.";
    msgGuardarConfig.classList.remove("text-gray-600");
    msgGuardarConfig.classList.add("text-red-600");
    return;
  }

  if (!etiquetas.length) {
    msgGuardarConfig.textContent = "Cargá al menos una etiqueta.";
    msgGuardarConfig.classList.remove("text-gray-600");
    msgGuardarConfig.classList.add("text-red-600");
    return;
  }

  if (!naipesSeleccionados.length) {
    msgGuardarConfig.textContent = "Seleccioná o sugerí naipes para las etiquetas.";
    msgGuardarConfig.classList.remove("text-gray-600");
    msgGuardarConfig.classList.add("text-red-600");
    return;
  }

  if (etiquetas.length !== naipesSeleccionados.length) {
    msgGuardarConfig.textContent =
      "La cantidad de etiquetas no coincide con la cantidad de naipes asignados.";
    msgGuardarConfig.classList.remove("text-gray-600");
    msgGuardarConfig.classList.add("text-red-600");
    return;
  }

  try {
    // Preparar datos para Firestore
    const etiquetasParaGuardar = etiquetas.map((etq, idx) => ({
      etiquetaId: etq.id || '',
      etiquetaNombre: etq.nombre || '',
      naipeId: naipesSeleccionados[idx]?.id || '',
      naipeNombre: naipesSeleccionados[idx]?.nombre || ''
    }));

    const r = await guardarEtiquetasFirestore(eventoActivo.id, etiquetasParaGuardar);

    if (r.ok) {
      msgGuardarConfig.textContent = "Configuración guardada.";
      msgGuardarConfig.classList.remove("text-gray-600");
      msgGuardarConfig.classList.add("text-green-600");
    } else {
      msgGuardarConfig.textContent = "Error: " + (r.error || "No se pudo guardar la configuración");
      msgGuardarConfig.classList.remove("text-gray-600");
      msgGuardarConfig.classList.add("text-red-600");
    }
  } catch (err) {
    console.error(err);
    msgGuardarConfig.textContent = "Error inesperado al guardar.";
    msgGuardarConfig.classList.remove("text-gray-600");
    msgGuardarConfig.classList.add("text-red-600");
  }
}

// Inicializar botones cuando el DOM esté listo
function inicializarBotonesEtiquetas() {
  const { btnAgregarEtiqueta, btnAgregarNaipe, btnSugerirNaipes, btnGuardarConfig } = getEtiquetasElements();
  
  if (btnAgregarEtiqueta) {
    btnAgregarEtiqueta.onclick = agregarEtiqueta;
  } else {
    console.error("No se encontró el botón btnAgregarEtiqueta");
  }
  
  if (btnAgregarNaipe) {
    btnAgregarNaipe.onclick = agregarNaipe;
  } else {
    console.error("No se encontró el botón btnAgregarNaipe");
  }
  
  if (btnSugerirNaipes) {
    btnSugerirNaipes.onclick = sugerirNaipes;
  } else {
    console.error("No se encontró el botón btnSugerirNaipes");
  }
  
  if (btnGuardarConfig) {
    btnGuardarConfig.onclick = guardarConfiguracion;
  } else {
    console.error("No se encontró el botón btnGuardarConfig");
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarBotonesEtiquetas);
} else {
  inicializarBotonesEtiquetas();
}

/**
 * Cargar etiquetas y naipes desde Firestore para el evento activo
 */
export async function cargarEtiquetasDelEvento() {
  const eventoActivo = getEventoActivo();
  
  // Limpiar estado anterior
  etiquetas = [];
  naipesSeleccionados = [];
  etiquetaEditando = null;
  
  if (!eventoActivo) {
    // Si no hay evento activo, limpiar UI
    resetConfiguracionEtiquetasNaipes();
    return;
  }
  
  try {
    const r = await listarEtiquetasFirestore(eventoActivo.id);
    
    if (r.ok && r.data && r.data.length > 0) {
      // Cargar etiquetas y naipes desde Firestore
      r.data.forEach((etq) => {
        // Agregar etiqueta
        etiquetas.push({
          id: etq.etiquetaId || '',
          nombre: etq.etiquetaNombre || ''
        });
        
        // Agregar naipe correspondiente
        naipesSeleccionados.push({
          id: etq.naipeId || '',
          nombre: etq.naipeNombre || ''
        });
      });
      
      console.log('✅ Etiquetas cargadas para evento:', eventoActivo.id, etiquetas.length);
    } else {
      console.log('📋 No hay etiquetas guardadas para este evento');
    }
    
    // Renderizar las etiquetas cargadas (o vacías si no hay)
    renderEtiquetas();
    renderNaipesSeleccionados();
    
  } catch (err) {
    console.error('Error al cargar etiquetas del evento:', err);
    // En caso de error, limpiar UI
    resetConfiguracionEtiquetasNaipes();
  }
}

// Exportar funciones de renderizado para uso externo
// Nota: cargarEtiquetasDelEvento ya está exportada arriba con export async function
export { renderEtiquetas, renderNaipesSeleccionados };

