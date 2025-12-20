/**
 * M?dulo para mostrar resultados globales del evento
 */

import { 
  getDoc, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { firebaseConfig } from './core/firebase-config.js';
import { NAIPES_TRUCO } from './constantes.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  
  const paloInfo = palosInfo[palo] || { color: '#000000', simbolo: '?', nombre: 'Desconocido', svgPath: '' };
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="120" viewBox="0 0 80 120">
      <rect width="80" height="120" fill="white" stroke="${paloInfo.color}" stroke-width="2" rx="4"/>
      <text x="40" y="30" font-family="Arial" font-size="24" font-weight="bold" fill="${paloInfo.color}" text-anchor="middle">${numeroTexto}</text>
      <text x="40" y="70" font-family="Arial" font-size="32" font-weight="bold" fill="${paloInfo.color}" text-anchor="middle">${paloInfo.simbolo}</text>
      <text x="40" y="100" font-family="Arial" font-size="12" fill="${paloInfo.color}" text-anchor="middle">${paloInfo.nombre}</text>
    </svg>
  `)}`;
}

// Obtener eventoId de la URL
const urlParams = new URLSearchParams(window.location.search);
const eventoId = urlParams.get('evento');

if (!eventoId) {
  document.body.innerHTML = '<div class="max-w-2xl mx-auto p-6"><p class="text-red-600">Error: No se especific? un evento.</p><a href="/" class="text-purple-600 underline">Volver al inicio</a></div>';
  throw new Error('Evento ID no especificado');
}

// Formatear fecha
function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    const [yyyy, mm, dd] = fechaISO.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  return fechaISO;
}

// Cargar datos del evento y resultados
async function cargarResultados() {
  try {
    console.log('cargarResultados() iniciada');
    
    // Verificar que el contenedor existe
    const contenedorRespuestas = document.getElementById('contenedorRespuestasCorrectas');
    const contenedorResultados = document.getElementById('contenedorResultados');
    
    if (!contenedorRespuestas || !contenedorResultados) {
      console.error('Contenedores no encontrados en el DOM', {
        contenedorRespuestas: !!contenedorRespuestas,
        contenedorResultados: !!contenedorResultados
      });
      const errorMsg = 'Error: Elementos del DOM no encontrados. Por favor, recarga la p?gina.';
      if (contenedorRespuestas) contenedorRespuestas.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
      if (contenedorResultados) contenedorResultados.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
      return;
    }
    
    // Mostrar estado de carga
    contenedorRespuestas.innerHTML = '<p class="text-gray-600">Cargando respuestas correctas...</p>';
    contenedorResultados.innerHTML = '<p class="text-gray-600">Cargando resultados...</p>';
    
    // Actualizar el nombre del evento en el header
    const nombreEventoEl = document.getElementById('nombreEvento');
    if (nombreEventoEl) {
      nombreEventoEl.textContent = 'Cargando...';
    }
    
    console.log('Cargando informaci?n del evento:', eventoId);
    // Cargar informaci?n del evento
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (!eventoSnap.exists()) {
      console.error('Evento no encontrado:', eventoId);
      const errorMsg = 'Evento no encontrado. Verifica que el evento existe.';
      contenedorRespuestas.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
      contenedorResultados.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
      if (nombreEventoEl) nombreEventoEl.textContent = 'Evento no encontrado';
      return;
    }
    
    const eventoData = eventoSnap.data();
    console.log('Evento cargado:', eventoData.nombre);
    
    // Mostrar informaci?n del evento
    const tituloEventoEl = document.getElementById('tituloEvento');
    const fechaEventoEl = document.getElementById('fechaEvento');
    
    if (nombreEventoEl) nombreEventoEl.textContent = eventoData.nombre || 'Evento sin nombre';
    if (tituloEventoEl) tituloEventoEl.textContent = eventoData.nombre || 'Evento sin nombre';
    
    const fecha = eventoData.fecha || '';
    if (fechaEventoEl && fecha) {
      fechaEventoEl.textContent = `Fecha: ${formatearFecha(fecha)}`;
    }
    
    console.log('Cargando respuestas correctas...');
    // Cargar respuestas correctas (del anfitri?n)
    await cargarRespuestasCorrectas();
    
    console.log('Cargando resultados de participantes...');
    // Cargar resultados de participantes
    await cargarResultadosParticipantes();
    
    console.log('Cargando podio de etiquetas...');
    // Cargar podio de etiquetas
    await cargarResultadosEtiquetasPodio();
    
    console.log('Carga de resultados completada');
    
  } catch (error) {
    console.error('Error al cargar resultados:', error);
    const errorMsg = 'Error al cargar los resultados: ' + (error.message || 'Error desconocido');
    const contenedorRespuestas = document.getElementById('contenedorRespuestasCorrectas');
    const contenedorResultados = document.getElementById('contenedorResultados');
    const nombreEventoEl = document.getElementById('nombreEvento');
    
    if (contenedorRespuestas) contenedorRespuestas.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
    if (contenedorResultados) contenedorResultados.innerHTML = `<p class="text-red-600">${errorMsg}</p>`;
    if (nombreEventoEl) nombreEventoEl.textContent = 'Error al cargar';
  }
}

// Cargar respuestas correctas del anfitri?n
async function cargarRespuestasCorrectas() {
  try {
    const contenedor = document.getElementById('contenedorRespuestasCorrectas');
    if (!contenedor) {
      console.error('Contenedor de respuestas correctas no encontrado');
      return;
    }
    
    // Buscar la selecci?n del anfitri?n (sesionId = 'ANFITRION')
    const seleccionesRef = collection(db, 'selecciones');
    const q = query(
      seleccionesRef, 
      where('eventoId', '==', eventoId),
      where('sesionId', '==', 'ANFITRION'),
      where('finalizado', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    contenedor.innerHTML = '';
    
    if (querySnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No se encontraron respuestas correctas. El anfitri?n a?n no ha finalizado su soluci?n.</p>';
      return;
    }
    
    const anfitrionDoc = querySnapshot.docs[0];
    const anfitrionData = anfitrionDoc.data();
    const seleccionesNaipes = anfitrionData.seleccionesNaipes || {};
    const seleccionesEtiquetas = anfitrionData.seleccionesEtiquetas || {};
    const ordenEtiquetas = anfitrionData.ordenEtiquetas || [];
    
    // Cargar etiquetas y naipes del evento
    const etiquetasRef = collection(db, 'etiquetas');
    const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    
    const etiquetas = [];
    const naipes = [];
    
    etiquetasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.etiquetaId && data.etiquetaNombre) {
        etiquetas.push({
          id: data.etiquetaId,
          nombre: data.etiquetaNombre
        });
      }
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
    const contenedor = document.getElementById('contenedorRespuestasCorrectas');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar respuestas correctas: ' + (error.message || 'Error desconocido') + '</p>';
    }
  }
}

// Cargar resultados de participantes
async function cargarResultadosParticipantes() {
  try {
    const contenedor = document.getElementById('contenedorResultados');
    if (!contenedor) {
      console.error('Contenedor de resultados no encontrado');
      return;
    }
    
    // Cargar informaci?n del evento para obtener timerIniciadoEn y timerExpiraEn
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    let timerIniciadoEn = null;
    let duracionTimerMinutos = 30; // Duraci?n por defecto
    if (eventoSnap.exists()) {
      const eventoData = eventoSnap.data();
      timerIniciadoEn = eventoData.timerIniciadoEn ? (eventoData.timerIniciadoEn instanceof Timestamp ? eventoData.timerIniciadoEn.toMillis() : eventoData.timerIniciadoEn) : null;
      // Calcular duraci?n total del timer (puede tener minutos a?adidos)
      if (timerIniciadoEn && eventoData.timerExpiraEn) {
        const timerExpiraEn = eventoData.timerExpiraEn instanceof Timestamp ? eventoData.timerExpiraEn.toMillis() : eventoData.timerExpiraEn;
        duracionTimerMinutos = (timerExpiraEn - timerIniciadoEn) / (1000 * 60);
      }
    }
    
    // Cargar respuestas correctas del anfitri?n para comparar
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
    
    // Cargar todas las selecciones finalizadas de participantes (excluyendo anfitri?n)
    const qParticipantes = query(
      seleccionesRef,
      where('eventoId', '==', eventoId),
      where('finalizado', '==', true)
    );
    const participantesSnapshot = await getDocs(qParticipantes);
    
    contenedor.innerHTML = '';
    
    if (participantesSnapshot.empty) {
      contenedor.innerHTML = '<p class="text-gray-600">No hay participantes que hayan finalizado.</p>';
      return;
    }
    
    // Cargar etiquetas y naipes del evento
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
      
      // Saltar si es el anfitri?n
      if (data.sesionId === 'ANFITRION') {
        return;
      }
      
      const nombreParticipante = data.nombreParticipante || 'Participante sin nombre';
      const seleccionesNaipes = data.seleccionesNaipes || {};
      const seleccionesEtiquetas = data.seleccionesEtiquetas || {};
      const seleccionesNaipesTimestamps = data.seleccionesNaipesTimestamps || {};
      const ordenEtiquetasParticipante = data.ordenEtiquetas || [];
      
      // Calcular puntaje: 100 puntos por cada acierto + bonus por tiempo
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
            
            // Bonus seg?n tiempo:
            // Primeros 15 minutos: +25 puntos
            // Entre 15 y 25 minutos: +10 puntos
            // ?ltimos 5 minutos (o minutos a?adidos): 0 puntos bonus
            if (tiempoTranscurrido <= 15) {
              puntosBonus = 25;
            } else if (tiempoTranscurrido <= 25) {
              puntosBonus = 10;
            } else if (tiempoRestante <= 5) {
              // ?ltimos 5 minutos: no hay bonus
              puntosBonus = 0;
            } else {
              // Despu?s de 25 minutos pero no en los ?ltimos 5: tampoco hay bonus
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
        selecciones: seleccionesArray,
        ordenEtiquetas: ordenEtiquetasParticipante,
        seleccionesNaipes: seleccionesNaipes,
        seleccionesEtiquetas: seleccionesEtiquetas
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
        grupoActual.push({ ...participante, indiceOriginal: index });
      } else {
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
        grupo.participantes.forEach(p => {
          podio.push({ ...p, posicion: posicionActual, posicionFinal });
        });
      } else {
        grupo.participantes.forEach(p => {
          // Asegurar que todas las propiedades se copien, incluyendo selecciones
          resto.push({ 
            nombre: p.nombre,
            puntos: p.puntos,
            selecciones: p.selecciones || [],
            posicion: posicionActual 
          });
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
        // Si NO hay empate: podio horizontal centrado en orden descendente
        podioGrid.style.flexDirection = 'row';
        podioGrid.style.alignItems = 'center'; // Todos alineados al mismo nivel
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
            const item = crearPodiumItem(p, posicionReal, tipoMedalla, participantes.length > 1);
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
        const crearContenedorSimple = (participante, posicionReal, tipoMedalla) => {
          const container = document.createElement('div');
          container.className = 'flex flex-col items-center';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.margin = '0 0.5rem';
          container.style.minWidth = '120px';
          
          const item = crearPodiumItem(participante, posicionReal, tipoMedalla, false);
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
    
    // Mostrar el resto en lista
    if (resto.length > 0) {
      const listaTitle = document.createElement('h2');
      listaTitle.className = 'text-xl font-bold text-gray-700 mb-4';
      listaTitle.textContent = 'Resto de participantes';
      contenedor.appendChild(listaTitle);
    }
    
    resto.forEach((participante) => {
      const div = crearParticipanteListItem(participante, participante.posicion, respuestasCorrectas, naipes);
      contenedor.appendChild(div);
    });
    
    // Cargar selecciones de todos los participantes
    await cargarSeleccionesTodosParticipantes();
    
  } catch (error) {
    console.error('Error al cargar resultados de participantes:', error);
    const contenedor = document.getElementById('contenedorResultados');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar resultados de participantes: ' + (error.message || 'Error desconocido') + '</p>';
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
    }
    
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
        
        // Si encontramos el naipe en la solución del anfitrión, asignar puntos
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
          
          etiquetasMap[etiquetaIdAnfitrionEncontrada].puntos += puntosEtiqueta;
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
    const etiquetasConPuntaje = Object.values(etiquetasMap).filter(e => e.puntos > 0);
    
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
    
    // Obtener contenedor
    const contenedor = document.getElementById('contenedorResultados');
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
        // Si NO hay empate: podio horizontal centrado en orden tradicional (#2, #1, #3)
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
        
        // Orden descendente simple: #1, #2, #3 (de izquierda a derecha, centrado) - igual que podio de participantes
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

// Cargar selecciones de todos los participantes con colores
async function cargarSeleccionesTodosParticipantes() {
  try {
    const contenedor = document.getElementById('contenedorSeleccionesParticipantes');
    if (!contenedor) {
      console.error('Contenedor de selecciones no encontrado');
      return;
    }
    
    contenedor.innerHTML = '';
    
    // Cargar respuestas correctas del anfitri?n
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
    
    // Cargar todas las selecciones finalizadas
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
    
    // Ordenar participantes por nombre para mejor visualizaci?n
    const participantesArray = [];
    participantesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.sesionId !== 'ANFITRION') {
        participantesArray.push(doc);
      }
    });
    
    // Ordenar por nombre
    participantesArray.sort((a, b) => {
      const nombreA = a.data().nombreParticipante || '';
      const nombreB = b.data().nombreParticipante || '';
      return nombreA.localeCompare(nombreB);
    });
    
    // Mostrar selecciones de cada participante
    participantesArray.forEach((doc) => {
      const data = doc.data();
      
      // Saltar anfitri?n
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
      usuarioDiv.style.backgroundColor = '#f9fafb';
      usuarioDiv.style.border = '1px solid #d1d5db';
      usuarioDiv.style.borderRadius = '0.75rem';
      usuarioDiv.style.padding = '1rem';
      usuarioDiv.style.marginBottom = '1rem';
      usuarioDiv.style.width = '100%';
      usuarioDiv.style.boxSizing = 'border-box';
      
      const nombreHeader = document.createElement('h3');
      nombreHeader.className = 'text-lg font-semibold text-gray-900 mb-3';
      nombreHeader.style.fontSize = '1rem';
      nombreHeader.style.fontWeight = '600';
      nombreHeader.style.color = '#111827';
      nombreHeader.style.marginBottom = '0.75rem';
      nombreHeader.style.wordBreak = 'break-word';
      nombreHeader.style.overflowWrap = 'break-word';
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
        
        // Obtener calificación para esta etiqueta
        const calificacion = calificacionesEtiquetasParticipante[etiquetaId] || 0;
        
        const naipeCorrecto = respuestasCorrectas[etiquetaId];
        const esCorrecta = naipeId && naipeCorrecto && String(naipeId).trim() === String(naipeCorrecto).trim();
        
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
    console.error('Error al cargar selecciones de participantes:', error);
    const contenedor = document.getElementById('contenedorSeleccionesParticipantes');
    if (contenedor) {
      contenedor.innerHTML = '<p class="text-red-600">Error al cargar selecciones: ' + (error.message || 'Error desconocido') + '</p>';
    }
  }
}

// Crear item del podio
function crearPodiumItem(participante, posicion, tipoMedalla, esEmpate = false) {
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

// Crear item de lista para participantes del 4to en adelante
function crearParticipanteListItem(participante, posicion, respuestasCorrectas = {}, naipes = []) {
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
  
  // Selecciones - mostrar solo la respuesta con imagen (verde/rojo) respetando el orden del array del participante
  const seleccionesDiv = document.createElement('div');
  seleccionesDiv.className = 'flex flex-wrap gap-2 mt-3';
  
  // Validar que existan selecciones y ordenEtiquetas
  if (participante.ordenEtiquetas && Array.isArray(participante.ordenEtiquetas) && participante.ordenEtiquetas.length > 0) {
    // Iterar sobre el orden del participante
    participante.ordenEtiquetas.forEach((etiquetaId) => {
      const naipeIdSeleccionado = participante.seleccionesNaipes && participante.seleccionesNaipes[etiquetaId];
      if (!naipeIdSeleccionado) return;
      
      // Determinar si es correcta comparando con respuestasCorrectas
      const naipeCorrecto = respuestasCorrectas[etiquetaId];
      const esCorrecta = naipeIdSeleccionado && naipeCorrecto && String(naipeIdSeleccionado).trim() === String(naipeCorrecto).trim();
      
      if (esCorrecta) {
        // ACIERTO: Solo mostrar el naipe seleccionado en highlight
        const naipeContainer = document.createElement('div');
        naipeContainer.className = 'border-2 rounded-lg p-2 flex items-center justify-center bg-green-50 border-green-400';
        
        const naipeImg = document.createElement('img');
        const rutaImagen = obtenerImagenNaipe(naipeIdSeleccionado);
        naipeImg.src = rutaImagen;
        naipeImg.alt = naipeIdSeleccionado;
        naipeImg.className = 'w-12 h-16 object-contain drop-shadow-md';
        naipeImg.title = 'Acierto';
        naipeImg.style.filter = 'none';
        
        // Fallback a SVG si la imagen no carga
        naipeImg.onerror = function() {
          this.src = generarSVGNaipe(naipeIdSeleccionado);
          this.onerror = null;
        };
        
        naipeContainer.appendChild(naipeImg);
        seleccionesDiv.appendChild(naipeContainer);
      } else {
        // FALLO: Mostrar naipe seleccionado apagado + naipe correcto en highlight
        // 1. Naipe seleccionado (apagado)
        const naipeContainerSeleccionado = document.createElement('div');
        naipeContainerSeleccionado.className = 'border-2 rounded-lg p-2 flex items-center justify-center bg-gray-50 border-gray-300';
        
        const naipeImgSeleccionado = document.createElement('img');
        const rutaImagenSeleccionado = obtenerImagenNaipe(naipeIdSeleccionado);
        naipeImgSeleccionado.src = rutaImagenSeleccionado;
        naipeImgSeleccionado.alt = naipeIdSeleccionado;
        naipeImgSeleccionado.className = 'w-12 h-16 object-contain drop-shadow-md';
        naipeImgSeleccionado.title = 'Fallo';
        naipeImgSeleccionado.style.filter = 'grayscale(100%) opacity(0.5)';
        naipeImgSeleccionado.style.opacity = '0.5';
        
        // Fallback a SVG si la imagen no carga
        naipeImgSeleccionado.onerror = function() {
          this.src = generarSVGNaipe(naipeIdSeleccionado);
          this.onerror = null;
        };
        
        naipeContainerSeleccionado.appendChild(naipeImgSeleccionado);
        seleccionesDiv.appendChild(naipeContainerSeleccionado);
        
        // 2. Naipe correcto (highlight)
        if (naipeCorrecto) {
          const naipeContainerCorrecto = document.createElement('div');
          naipeContainerCorrecto.className = 'border-2 rounded-lg p-2 flex items-center justify-center bg-green-50 border-green-400';
          
          const naipeImgCorrecto = document.createElement('img');
          const rutaImagenCorrecto = obtenerImagenNaipe(naipeCorrecto);
          naipeImgCorrecto.src = rutaImagenCorrecto;
          naipeImgCorrecto.alt = naipeCorrecto;
          naipeImgCorrecto.className = 'w-12 h-16 object-contain drop-shadow-md';
          naipeImgCorrecto.title = 'Solución correcta';
          naipeImgCorrecto.style.filter = 'none';
          
          // Fallback a SVG si la imagen no carga
          naipeImgCorrecto.onerror = function() {
            this.src = generarSVGNaipe(naipeCorrecto);
            this.onerror = null;
          };
          
          naipeContainerCorrecto.appendChild(naipeImgCorrecto);
          seleccionesDiv.appendChild(naipeContainerCorrecto);
        }
      }
    });
  } else {
    // Si no hay ordenEtiquetas, mostrar mensaje
    const sinSelecciones = document.createElement('p');
    sinSelecciones.className = 'text-sm text-gray-500 italic';
    sinSelecciones.textContent = 'No hay selecciones registradas';
    seleccionesDiv.appendChild(sinSelecciones);
  }
  
  div.appendChild(header);
  div.appendChild(seleccionesDiv);
  
  return div;
}

function mostrarError(mensaje) {
  document.body.innerHTML = `
    <div class="max-w-2xl mx-auto p-6">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6">
        <p class="text-red-600">${mensaje}</p>
        <a href="/" class="text-purple-600 underline mt-4 inline-block">Volver al inicio</a>
      </div>
    </div>
  `;
}

// Inicializar cuando el DOM est? listo
// Para m?dulos ES6, usar una funci?n async inmediata
(async function() {
  try {
    // Esperar a que el DOM est? completamente cargado
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Peque?o delay para asegurar que todos los elementos est?n disponibles
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar que tenemos el eventoId
    if (!eventoId) {
      console.error('No se encontr? eventoId en la URL');
      mostrarError('Error: No se especific? un evento en la URL.');
      return;
    }
    
    console.log('Iniciando carga de resultados para evento:', eventoId);
    await cargarResultados();
  } catch (error) {
    console.error('Error al inicializar resultados:', error);
    mostrarError('Error al inicializar la página: ' + (error.message || 'Error desconocido'));
  }
})();

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

// Crear item de lista para etiquetas del 4to en adelante
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


