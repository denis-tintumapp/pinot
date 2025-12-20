# 👥 Cómo Agregar Test Users en OAuth Consent Screen

## 📋 Ubicación de Test Users

### Paso 1: Acceder a OAuth Consent Screen

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. Inicia sesión si es necesario con `denis@tintum.app`

### Paso 2: Encontrar la Sección de Test Users

La sección de Test Users puede estar en diferentes lugares según la versión de la consola:

#### Opción A: En la Página Principal

1. En la página de OAuth Consent Screen, desplázate hacia abajo
2. Busca una sección llamada:
   - **"Test users"**
   - **"Users"**
   - **"Usuarios de prueba"**
   - **"Usuarios"**

3. Si ves "Publishing status: **Testing**", la sección de Test users debería estar visible debajo

#### Opción B: En el Editor

1. Si no ves Test users en la página principal, haz clic en:
   - **"EDIT APP"** (Editar aplicación)
   - O el botón de edición (lápiz)

2. Navega por las pestañas:
   - Puede estar en la pestaña **"OAuth consent screen"**
   - O en una pestaña separada **"Test users"**

3. Busca la sección de usuarios

### Paso 3: Agregar Test User

1. Una vez que encuentres la sección "Test users", verás:
   - Una lista de usuarios (puede estar vacía)
   - Un botón **"ADD USERS"** o **"Agregar usuarios"**
   - O un campo de texto con un botón "+"

2. Haz clic en **"ADD USERS"** o el botón correspondiente

3. Se abrirá un campo o diálogo donde puedes ingresar emails

4. Ingresa: `denis@tintum.app`

5. Haz clic en **"ADD"** o **"Agregar"**

6. El usuario debería aparecer en la lista

7. **Guarda los cambios** (botón "SAVE" o "Guardar" en la parte superior o inferior de la página)

### Paso 4: Verificar

Después de guardar, deberías ver:
- `denis@tintum.app` en la lista de Test users
- El estado "Testing" activo

## 🔍 Si No Encuentras Test Users

### Verifica el Publishing Status

1. En la parte superior de la página de OAuth Consent Screen, busca:
   - **"Publishing status"**
   - O **"Estado de publicación"**

2. Si dice **"In production"**:
   - No necesitas test users
   - El error puede ser por otra causa

3. Si dice **"Testing"**:
   - **SÍ necesitas test users**
   - Debe haber una sección visible para agregarlos

### Alternativa: Cambiar a Producción (No Recomendado para Desarrollo)

Si no encuentras la opción de test users y quieres que funcione para todos:

1. En OAuth Consent Screen, busca **"PUBLISH APP"** o **"Publicar aplicación"**
2. Esto cambiará el estado a "In production"
3. **Nota**: Esto puede requerir verificación de Google y puede tardar

## 📸 Ubicaciones Comunes

La sección de Test Users suele estar:
- ✅ Justo después de "Publishing status"
- ✅ En una pestaña separada al editar la app
- ✅ En la parte inferior de la página de configuración
- ✅ En el menú lateral cuando editas la app

## 🎯 Resumen Rápido

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
2. Busca "Test users" o "Users"
3. Haz clic en "ADD USERS"
4. Agrega: `denis@tintum.app`
5. Guarda

---

**Última actualización**: Diciembre 2025

