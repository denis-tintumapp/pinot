# 🔍 Cómo Encontrar Cloud Functions en Google Cloud Console

## Problema

Solo ves "Cloud Run Functions" pero necesitas acceder a "Cloud Functions" (Gen 1) para configurar permisos.

## Solución

### Método 1: Buscador de Google Cloud Console

1. Ve a: **https://console.cloud.google.com**
2. Selecciona el proyecto: **pinot-tintum**
3. En la **barra de búsqueda superior** (donde dice "Search products and resources"), escribe:
   ```
   Cloud Functions
   ```
4. En los resultados, selecciona **"Cloud Functions"** (NO "Cloud Run")
5. Deberías ver la lista de funciones, incluyendo `enviarEmailConfirmacionHTTP`

### Método 2: Navegación Manual

1. Ve a: **https://console.cloud.google.com**
2. Selecciona el proyecto: **pinot-tintum**
3. Haz clic en el **menú de hamburguesa (☰)** en la esquina superior izquierda
4. Desplázate hacia abajo en el menú
5. Busca en la sección **"Serverless"**:
   - **"Cloud Functions"** ← Esto es lo que necesitas
   - (NO "Cloud Run")

### Método 3: URL Directa

Intenta esta URL después de autenticarte:
```
https://console.cloud.google.com/functions/list?project=pinot-tintum&supportedpurview=project
```

### Método 4: Desde Firebase Console

1. Ve a: **https://console.firebase.google.com/project/pinot-tintum/functions**
2. Haz clic en **`enviarEmailConfirmacionHTTP`**
3. Haz clic en los tres puntos (⋮) → **"View in Cloud Console"**
4. Esto debería llevarte directamente a la función en Google Cloud Console

## Diferencias

- **Cloud Functions (Gen 1)**: Funciones tradicionales, es lo que necesitas
- **Cloud Run Functions (Gen 2)**: Funciones de nueva generación, diferente interfaz

## Si Aún No Puedes Encontrarlo

Si después de estos pasos no puedes encontrar Cloud Functions, puede ser que:

1. **Necesites permisos adicionales**: Contacta al administrador del proyecto
2. **Las funciones estén en otra región**: Verifica que estés buscando en `us-central1`
3. **La interfaz haya cambiado**: Google actualiza la consola frecuentemente

### Alternativa: Usar gcloud CLI

Si tienes acceso, puedes verificar las funciones desde la terminal:
```bash
gcloud functions list --project=pinot-tintum --regions=us-central1
```

---

**Última actualización**: Diciembre 2025
