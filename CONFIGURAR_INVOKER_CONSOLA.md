# 🔧 Configurar Invoker desde Google Cloud Console

## Problema

La política de organización bloquea `allUsers` desde la línea de comandos. Necesitas configurar el invoker desde la consola web.

## Pasos para Configurar

### 1. Acceder a Cloud Functions

**Opción A - Desde Firebase Console (Recomendado):**
1. Ve a: **https://console.firebase.google.com/project/pinot-tintum/functions**
2. Busca la función `enviarEmailConfirmacionHTTP`
3. Haz clic en los tres puntos (⋮) → **"View in Cloud Console"**

**Opción B - Desde Google Cloud Console:**
1. Ve a: **https://console.cloud.google.com/functions/list?project=pinot-tintum**
2. Si te pide autenticarte, inicia sesión con tu cuenta de Google
3. Asegúrate de que el proyecto seleccionado sea **pinot-tintum**

**Opción C - Navegación manual:**
1. Ve a: https://console.cloud.google.com
2. Si no estás autenticado, inicia sesión
3. En el selector de proyectos (arriba), selecciona **pinot-tintum**
4. En el menú lateral (☰), busca **"Cloud Functions"** o **"Functions"**

### 2. Encontrar la Función

Busca la función: **`enviarEmailConfirmacionHTTP`**

### 3. Configurar Permisos

1. **Haz clic en el nombre de la función** para abrir los detalles
2. Ve a la pestaña **"PERMISSIONS"** (Permisos) en la parte superior
3. Haz clic en **"ADD PRINCIPAL"** (Agregar principal)
4. En el campo **"New principals"**, ingresa: `allUsers`
5. En **"Select a role"**, busca y selecciona: **"Cloud Functions Invoker"**
6. Haz clic en **"SAVE"** (Guardar)

### 4. Verificar

Después de guardar, deberías ver `allUsers` en la lista de permisos con el rol `Cloud Functions Invoker`.

## Alternativa: Usar Función Callable

Si no puedes configurar el invoker público, el código ahora intenta usar la función callable primero (que no requiere invoker público), y solo usa HTTP como fallback.

## Verificación

Después de configurar:

1. **Prueba el formulario**: `https://pinot.tintum.app/auth/signup-host-e`
2. **Revisa la consola del navegador** para ver qué método se usó
3. **Verifica que el email se envíe correctamente**

---

**Última actualización**: Diciembre 2025
