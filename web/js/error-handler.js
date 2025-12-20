/**
 * Módulo de manejo de errores para importaciones y peticiones
 * Previene errores de MIME type y maneja respuestas inesperadas
 */

/**
 * Verificar que una respuesta es del tipo esperado antes de procesarla
 */
export async function validateResponse(response, expectedType = 'json') {
  // Verificar estado HTTP
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
  }
  
  // Verificar Content-Type
  const contentType = response.headers.get('content-type');
  
  if (expectedType === 'json') {
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Respuesta inesperada (no es JSON):', text.substring(0, 200));
      throw new Error('El servidor devolvió un formato inesperado. Esperado: JSON');
    }
    return response.json();
  } else if (expectedType === 'javascript') {
    if (!contentType || !contentType.includes('application/javascript') && !contentType.includes('text/javascript')) {
      const text = await response.text();
      console.error('Respuesta inesperada (no es JavaScript):', text.substring(0, 200));
      throw new Error('El servidor devolvió un formato inesperado. Esperado: JavaScript');
    }
    return response.text();
  }
  
  return response.text();
}

/**
 * Manejar errores de importación de módulos
 */
export function handleModuleError(error, modulePath) {
  console.error(`Error al cargar módulo: ${modulePath}`, error);
  
  if (error.message && error.message.includes('Unexpected token')) {
    console.error('El módulo devolvió HTML en lugar de JavaScript. Verifica:');
    console.error('1. Que la ruta del módulo sea correcta');
    console.error('2. Que el archivo exista en el servidor');
    console.error('3. Que el servidor esté configurado para servir .js con Content-Type correcto');
    return 'Error: El servidor devolvió HTML en lugar de JavaScript. Verifica la configuración.';
  }
  
  return `Error al cargar ${modulePath}: ${error.message}`;
}

/**
 * Verificar que un módulo se cargó correctamente
 */
export function validateModule(module, moduleName) {
  if (!module) {
    throw new Error(`El módulo ${moduleName} no se cargó correctamente`);
  }
  
  if (typeof module !== 'object') {
    throw new Error(`El módulo ${moduleName} no es un objeto válido`);
  }
  
  return true;
}


