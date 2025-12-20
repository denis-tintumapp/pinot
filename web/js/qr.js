/**
 * Módulo para generar y compartir códigos QR de eventos
 */

/**
 * Generar código QR para un evento
 * @param {string} eventoId - ID del evento
 * @param {string} eventoNombre - Nombre del evento
 * @param {string} eventoFecha - Fecha del evento
 */
export async function generarQR(eventoId, eventoNombre, eventoFecha, eventoPIN) {
  // Crear URL única para el evento (página de participación)
  const urlBase = window.location.origin;
  // Usar URL raíz con query params
  const urlEvento = `${urlBase}/?evento=${eventoId}`;
  
  // Crear modal para mostrar el QR
  mostrarModalQR(urlEvento, eventoNombre, eventoFecha, eventoPIN);
}

/**
 * Mostrar modal QR (función exportada para uso directo)
 */
export async function mostrarQRModal(eventoId, eventoNombre, eventoFecha, eventoPIN) {
  // Validar que el eventoId no esté vacío
  if (!eventoId || eventoId.trim() === '') {
    console.error('Error: eventoId está vacío');
    alert('Error: No se pudo generar el QR porque falta el ID del evento');
    return;
  }
  
  const urlBase = window.location.origin;
  
  // Usar PIN en la URL si está disponible (más amigable)
  // Si no hay PIN, usar eventoId como fallback (compatibilidad)
  if (eventoPIN) {
    const urlEvento = `${urlBase}/?pin=${eventoPIN}`;
    console.log('Generando QR modal con PIN:', { eventoId, eventoPIN, urlEvento });
    mostrarModalQR(urlEvento, eventoNombre, eventoFecha, eventoPIN);
  } else {
    // Fallback: usar eventoId si no hay PIN (eventos antiguos)
    const urlEvento = `${urlBase}/?evento=${eventoId}`;
    console.log('Generando QR modal con eventoId (sin PIN):', { eventoId, urlEvento });
    mostrarModalQR(urlEvento, eventoNombre, eventoFecha, null);
  }
}

/**
 * Mostrar modal con el código QR
 */
function mostrarModalQR(urlEvento, eventoNombre, eventoFecha, eventoPIN) {
  // Crear overlay del modal
  const overlay = document.createElement('div');
  overlay.id = 'qrModalOverlay';
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  overlay.onclick = (e) => {
    if (e.target === overlay) cerrarModalQR();
  };
  
  // Crear contenido del modal
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-xl shadow-xl p-6 max-w-md w-full space-y-4';
  modal.onclick = (e) => e.stopPropagation();
  
  // Header del modal
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between';
  
  const titulo = document.createElement('h3');
  titulo.className = 'text-xl font-semibold text-gray-900';
  titulo.textContent = 'Código QR del Evento';
  
  const btnCerrar = document.createElement('button');
  btnCerrar.className = 'text-gray-500 hover:text-gray-700 text-2xl';
  btnCerrar.innerHTML = '&times;';
  btnCerrar.onclick = cerrarModalQR;
  
  header.appendChild(titulo);
  header.appendChild(btnCerrar);
  
  // Información del evento
  const infoEvento = document.createElement('div');
  infoEvento.className = 'text-sm text-gray-600 space-y-1';
  
  const nombreEvento = document.createElement('p');
  nombreEvento.className = 'font-medium text-gray-900';
  nombreEvento.textContent = eventoNombre || 'Evento sin nombre';
  
  const fechaEvento = document.createElement('p');
  fechaEvento.textContent = `Fecha: ${eventoFecha || 'No especificada'}`;
  
  infoEvento.appendChild(nombreEvento);
  infoEvento.appendChild(fechaEvento);
  
  // Contenedor del QR y PIN
  const qrContainer = document.createElement('div');
  qrContainer.id = 'qrCodeContainer';
  qrContainer.className = 'flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg space-y-3';
  
  // Mostrar PIN si está disponible
  if (eventoPIN) {
    const pinContainer = document.createElement('div');
    pinContainer.className = 'flex flex-col items-center space-y-1';
    
    const pinLabel = document.createElement('p');
    pinLabel.className = 'text-xs text-gray-600';
    pinLabel.textContent = 'PIN del Evento';
    
    const pinValue = document.createElement('p');
    pinValue.className = 'text-3xl font-bold text-purple-700 tracking-wider';
    pinValue.textContent = eventoPIN;
    
    pinContainer.appendChild(pinLabel);
    pinContainer.appendChild(pinValue);
    qrContainer.appendChild(pinContainer);
  }
  
  // Mostrar URL para debugging
  const urlTexto = document.createElement('p');
  urlTexto.className = 'text-xs text-gray-500 break-all text-center max-w-full';
  urlTexto.textContent = urlEvento;
  qrContainer.appendChild(urlTexto);
  
  // Botones de acción
  const acciones = document.createElement('div');
  acciones.className = 'flex flex-col gap-2';
  
  const btnCompartirWhatsApp = document.createElement('button');
  btnCompartirWhatsApp.className = 'px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2';
  btnCompartirWhatsApp.innerHTML = '<span>📱</span> Compartir por WhatsApp';
  btnCompartirWhatsApp.onclick = () => compartirPorWhatsApp(urlEvento, eventoNombre);
  
  const btnCopiarEnlace = document.createElement('button');
  btnCopiarEnlace.className = 'px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2';
  btnCopiarEnlace.innerHTML = '<span>🔗</span> Copiar enlace';
  btnCopiarEnlace.onclick = () => copiarEnlace(urlEvento);
  
  acciones.appendChild(btnCompartirWhatsApp);
  acciones.appendChild(btnCopiarEnlace);
  
  // Ensamblar modal
  modal.appendChild(header);
  modal.appendChild(infoEvento);
  modal.appendChild(qrContainer);
  modal.appendChild(acciones);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Generar el QR después de agregar al DOM
  generarQRCode(urlEvento, qrContainer);
}

/**
 * Generar QR usando API externa (método más confiable)
 */
function generarQRConAPI(texto, canvas) {
  return new Promise((resolve, reject) => {
    // Usar API de QR Server (gratuita y confiable)
    const urlAPI = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&data=${encodeURIComponent(texto)}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        ctx.drawImage(img, 0, 0);
        console.log('✅ QR generado exitosamente usando API externa');
        resolve();
      } catch (error) {
        console.error('Error al dibujar imagen en canvas:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error al cargar imagen QR desde API:', error);
      reject(new Error('No se pudo generar el QR desde la API externa'));
    };
    
    img.src = urlAPI;
  });
}

/**
 * Generar el código QR usando QRCode.js
 */
async function generarQRCode(texto, contenedor) {
  // Validar que el texto no esté vacío
  if (!texto || texto.trim() === '') {
    console.error('Error: El texto para el QR está vacío');
    const errorMsg = document.createElement('p');
    errorMsg.className = 'text-red-600 text-sm';
    errorMsg.textContent = 'Error: URL vacía para generar QR';
    contenedor.appendChild(errorMsg);
    return;
  }
  
  console.log('Generando QR para URL:', texto);
  
  // Limpiar contenedor de elementos anteriores (excepto el texto de la URL)
  const urlTexto = contenedor.querySelector('p.text-xs');
  const existingCanvas = contenedor.querySelector('canvas');
  const existingContainer = contenedor.querySelector('div.flex.justify-center');
  const existingLoading = contenedor.querySelector('p.text-gray-600');
  
  if (existingCanvas) existingCanvas.remove();
  if (existingContainer) existingContainer.remove();
  if (existingLoading) existingLoading.remove();
  
  // Crear contenedor para el canvas
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'flex justify-center';
  
  // Crear canvas para el QR
  const canvas = document.createElement('canvas');
  canvasContainer.appendChild(canvas);
  
  contenedor.appendChild(canvasContainer);
  
  // Mostrar mensaje de carga
  const loadingMsg = document.createElement('p');
  loadingMsg.className = 'text-gray-600 text-sm';
  loadingMsg.textContent = 'Generando código QR...';
  canvasContainer.appendChild(loadingMsg);
  
  try {
    console.log('Generando QR para:', texto);
    console.log('Canvas creado:', canvas);
    
    // Usar API externa (método más confiable)
    await generarQRConAPI(texto, canvas);
    
    // Remover mensaje de carga
    if (loadingMsg && loadingMsg.parentNode) {
      loadingMsg.remove();
    }
    
    console.log('✅ QR generado y mostrado correctamente');
  } catch (error) {
    console.error('❌ Error al generar QR:', error);
    if (loadingMsg && loadingMsg.parentNode) {
      loadingMsg.remove();
    }
    const errorMsg = document.createElement('p');
    errorMsg.className = 'text-red-600 text-sm';
    errorMsg.textContent = 'Error: No se pudo generar el código QR. ' + error.message;
    canvasContainer.appendChild(errorMsg);
  }
}

/**
 * Compartir por WhatsApp
 */
function compartirPorWhatsApp(urlEvento, eventoNombre) {
  const mensaje = `Te invito a participar en el evento: ${eventoNombre}\n\nAccede aquí: ${urlEvento}`;
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
}

/**
 * Copiar enlace al portapapeles
 */
async function copiarEnlace(urlEvento) {
  try {
    await navigator.clipboard.writeText(urlEvento);
    
    // Mostrar mensaje de confirmación
    const mensaje = document.createElement('div');
    mensaje.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg z-50';
    mensaje.textContent = '✓ Enlace copiado al portapapeles';
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
      mensaje.remove();
    }, 2000);
  } catch (err) {
    console.error('Error al copiar enlace:', err);
    alert('No se pudo copiar el enlace. Por favor, cópialo manualmente:\n' + urlEvento);
  }
}

/**
 * Cerrar modal del QR
 */
function cerrarModalQR() {
  const overlay = document.getElementById('qrModalOverlay');
  if (overlay) {
    overlay.remove();
  }
}

