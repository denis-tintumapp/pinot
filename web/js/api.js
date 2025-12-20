// 👉 ACTUALIZÁ ESTA LÍNEA CON TU URL DE APPS SCRIPT /exec
const API_BASE = "https://script.google.com/macros/s/AKfycbyVDLIXhiIl9qT7Ai4jYj-YCpPr0ZRcrOY3e5o4QABfxqnwGNahcrL5L9ooK63-AodD/exec";

// Helpers HTTP
async function postForm(path, payload) {
  try {
    const body = new URLSearchParams({ json: JSON.stringify(payload) });
    console.log("Enviando POST a:", `${API_BASE}?path=${path}`, payload);
    
    const res = await fetch(`${API_BASE}?path=${path}`, { 
      method: "POST", 
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Respuesta recibida:", data);
    return data;
  } catch (err) {
    console.error("Error en postForm:", err);
    throw err;
  }
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}?path=${path}`);
  return res.json();
}

// Normalizar fecha a ISO 8601 (YYYY-MM-DD) - ESTÁNDAR WEB
function normalizarFechaISO(fecha) {
  if (!fecha) return "";
  
  // Si ya está en formato ISO YYYY-MM-DD, devolverlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }
  
  // Si es formato ISO completo con tiempo (YYYY-MM-DDTHH:mm:ss.sssZ)
  if (fecha.includes("T")) {
    return fecha.split("T")[0]; // Tomar solo la parte de fecha YYYY-MM-DD
  }
  
  // Si es formato DD-MM-YYYY (formato antiguo)
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
    const [dd, mm, yyyy] = fecha.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // Si no reconocemos el formato, intentar parsear como Date
  try {
    const date = new Date(fecha);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch (err) {
    console.error("Error al parsear fecha:", err);
  }
  
  console.warn("Formato de fecha no reconocido:", fecha);
  return fecha; // Devolver original si no se puede normalizar
}

// Formatear fecha ISO para mostrar en UI (DD-MM-YYYY)
function formatearFechaParaUI(fechaISO) {
  if (!fechaISO) return "";
  
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
  
  return fechaISO; // Devolver original si no se puede formatear
}

// Mantener función antigua para compatibilidad (deprecated)
function formatoDDMMYYYY(fechaISO) {
  console.warn("formatoDDMMYYYY está deprecado. Usa formatearFechaParaUI() para UI o normalizarFechaISO() para backend.");
  return formatearFechaParaUI(fechaISO);
}

export { postForm, getJson, normalizarFechaISO, formatearFechaParaUI, formatoDDMMYYYY };

