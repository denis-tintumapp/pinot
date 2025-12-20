# 🔧 Configurar Invoker desde Cloud Functions for Firebase

## ✅ Encontraste el Lugar Correcto

"Cloud Functions for Firebase" es exactamente donde necesitas estar.

## Pasos para Configurar Permisos

### Paso 1: Acceder a Cloud Functions for Firebase

1. Ve a: **https://console.firebase.google.com/project/pinot-tintum/functions**
2. O desde Google Cloud Console, busca **"Cloud Functions for Firebase"**

### Paso 2: Encontrar la Función

1. En la lista de funciones, busca: **`enviarEmailConfirmacionHTTP`**
2. Deberías ver:
   - **Name**: `enviarEmailConfirmacionHTTP`
   - **Trigger**: `https`
   - **Location**: `us-central1`

### Paso 3: Abrir Detalles de la Función

**Opción A - Desde Firebase Console:**
1. Haz clic en el nombre de la función: **`enviarEmailConfirmacionHTTP`**
2. Esto abrirá los detalles

**Opción B - Ver en Cloud Console:**
1. Haz clic en los **tres puntos (⋮)** junto a la función
2. Selecciona **"View in Cloud Console"**
3. Esto te llevará a Google Cloud Console con la función abierta

### Paso 4: Configurar Permisos

**Si estás en Firebase Console:**
- Puede que no veas la opción de permisos directamente
- Haz clic en **"View in Cloud Console"** para ir a Google Cloud Console

**Si estás en Google Cloud Console:**
1. En la parte superior de la página, busca las pestañas:
   - **DETAILS** (Detalles)
   - **TRIGGERS** (Disparadores)
   - **PERMISSIONS** (Permisos) ← **Haz clic aquí**

2. En la pestaña **PERMISSIONS**:
   - Verás una lista de "Principals" (principales)
   - Haz clic en **"ADD PRINCIPAL"** (Agregar principal)

3. Completa el formulario:
   - **New principals**: `allUsers`
   - **Select a role**: Busca y selecciona **"Cloud Functions Invoker"**
   - Haz clic en **"SAVE"** (Guardar)

### Paso 5: Verificar

Después de guardar, deberías ver en la lista:
- **Principal**: `allUsers`
- **Role**: `Cloud Functions Invoker`

## Si No Ves la Opción de Permisos

Si en Firebase Console no ves la opción de permisos:

1. **Haz clic en los tres puntos (⋮)** junto a `enviarEmailConfirmacionHTTP`
2. Selecciona **"View in Cloud Console"**
3. Esto te llevará directamente a Google Cloud Console donde SÍ puedes configurar permisos

## Alternativa: El Código Ya Tiene Fallback

Si no puedes configurar el invoker, el código intentará:
1. Primero: Función callable (no requiere invoker público)
2. Si falla: Endpoint HTTP (requiere invoker público)

Prueba el formulario primero - puede que funcione sin necesidad de configurar el invoker.

---

**Última actualización**: Diciembre 2025
