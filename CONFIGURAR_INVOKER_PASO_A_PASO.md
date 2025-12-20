# 🔧 Configurar Invoker - Guía Paso a Paso

## Problema

Necesitas configurar permisos de invoker público para `enviarEmailConfirmacionHTTP` desde Google Cloud Console.

## Pasos Detallados

### Paso 1: Acceder a Google Cloud Console

1. **Abre tu navegador** y ve a:
   ```
   https://console.cloud.google.com
   ```

2. **Inicia sesión** con tu cuenta de Google (debe ser `denis@tintum.app` o una cuenta con permisos)

3. **Selecciona el proyecto**:
   - En la parte superior, haz clic en el selector de proyectos
   - Busca y selecciona: **pinot-tintum**

### Paso 2: Navegar a Cloud Functions

**Opción A - Desde el menú:**
1. Haz clic en el menú de hamburguesa (☰) en la esquina superior izquierda
2. Busca **"Cloud Functions"** en el menú
3. Haz clic en **"Cloud Functions"**

**Opción B - URL directa:**
```
https://console.cloud.google.com/functions/list?project=pinot-tintum
```

### Paso 3: Encontrar la Función

1. En la lista de funciones, busca: **`enviarEmailConfirmacionHTTP`**
2. Deberías ver:
   - **Name**: `enviarEmailConfirmacionHTTP`
   - **Trigger**: `https`
   - **Location**: `us-central1`

### Paso 4: Abrir la Función

1. **Haz clic en el nombre de la función** (`enviarEmailConfirmacionHTTP`)
2. Esto abrirá la página de detalles de la función

### Paso 5: Configurar Permisos

1. En la parte superior de la página, verás varias pestañas:
   - **DETAILS** (Detalles)
   - **TRIGGERS** (Disparadores)
   - **PERMISSIONS** (Permisos) ← **Haz clic aquí**

2. En la pestaña **PERMISSIONS**, verás una lista de "Principals" (principales)

3. Haz clic en el botón **"ADD PRINCIPAL"** (Agregar principal) en la parte superior

4. Se abrirá un formulario:
   - **New principals**: Ingresa `allUsers`
   - **Select a role**: Haz clic y busca **"Cloud Functions Invoker"**
   - Selecciona el rol

5. Haz clic en **"SAVE"** (Guardar)

### Paso 6: Verificar

Después de guardar, deberías ver en la lista de permisos:
- **Principal**: `allUsers`
- **Role**: `Cloud Functions Invoker`

## Si No Puedes Ver la Opción de Permisos

Si no ves la pestaña "PERMISSIONS" o no puedes agregar `allUsers`, puede ser por:

1. **Permisos insuficientes**: Necesitas rol de "Owner" o "Editor" del proyecto
2. **Política de organización**: Tu organización puede bloquear `allUsers`

### Alternativa: Contactar Administrador

Si no tienes permisos suficientes, contacta al administrador del proyecto para que configure el invoker.

## Verificación Final

Después de configurar:

1. Prueba el formulario: `https://pinot.tintum.app/auth/signup-host-e`
2. Completa el formulario de signup
3. Verifica que no haya errores de CORS en la consola del navegador
4. Verifica que el email se envíe correctamente

---

**Última actualización**: Diciembre 2025
