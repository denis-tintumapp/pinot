# 🔐 Crear Nuevo OAuth 2.0 Client ID (Manual)

## 🎯 Objetivo

Crear un nuevo OAuth 2.0 Client ID manualmente desde la consola web para tener acceso completo al Client Secret.

## 📋 Pasos

### Paso 1: Acceder a la Consola de Credenciales

1. **Abre la consola web**:
   ```
   https://console.cloud.google.com/apis/credentials?project=pinot-tintum
   ```

2. **Asegúrate de estar autenticado** con `denis@tintum.app`

### Paso 2: Crear Nuevo OAuth Client ID

1. **Haz clic en**: `+ CREATE CREDENTIALS` (arriba)
2. **Selecciona**: `OAuth client ID`

### Paso 3: Configurar OAuth Consent Screen (Si es la primera vez)

Si es la primera vez que creas un OAuth client, Google te pedirá configurar el OAuth Consent Screen:

1. **User Type**: 
   - Si tienes Google Workspace: `Internal` (solo usuarios de tu organización)
   - Si no: `External` (cualquier usuario de Google)

2. **App information**:
   - **App name**: `Pinot Email Service`
   - **User support email**: `denis@tintum.app`
   - **Developer contact information**: `denis@tintum.app`

3. **Scopes**:
   - Haz clic en `ADD OR REMOVE SCOPES`
   - Busca y selecciona: `https://www.googleapis.com/auth/gmail.send`
   - **Update**

4. **Test users** (si está en modo Testing):
   - Haz clic en `ADD USERS`
   - Agrega: `denis@tintum.app`
   - **Add**

5. **Save and Continue** → **Back to Dashboard**

### Paso 4: Crear el OAuth Client ID

1. **Application type**: Selecciona `Web application`

2. **Name**: `Pinot Gmail API Client`

3. **Authorized redirect URIs**:
   - Haz clic en `+ ADD URI`
   - Ingresa: `http://localhost:8080/oauth2callback`
   - **Add**
   
   **Nota**: Para Web Application clients, el redirect URI debe ser una URL HTTP/HTTPS válida. Usamos `localhost` para desarrollo.

4. **Create**

### Paso 5: Copiar Credenciales

Después de crear, Google te mostrará un diálogo con:

- ✅ **Your Client ID**: `XXXXX.apps.googleusercontent.com`
- ✅ **Your Client Secret**: `GOCSPX-XXXXX`

**⚠️ IMPORTANTE**: 
- **Copia ambos valores inmediatamente**
- El Client Secret **solo se muestra una vez**
- Si lo pierdes, tendrás que regenerarlo

### Paso 6: Guardar Credenciales

Guarda las credenciales en un lugar seguro:

```
Client ID: [TU_CLIENT_ID]
Client Secret: [TU_CLIENT_SECRET]
```

## 🔧 Actualizar Scripts

### Actualizar `get-token-web-client.js`

Edita el archivo:
```bash
cd /Users/denispaiva/proyectos/pinot/functions
```

Reemplaza en `get-token-web-client.js`:
```javascript
const CLIENT_ID = 'TU_NUEVO_CLIENT_ID';
const CLIENT_SECRET = 'TU_NUEVO_CLIENT_SECRET';
```

### Ejecutar Script para Obtener Refresh Token

```bash
cd /Users/denispaiva/proyectos/pinot/functions
npm install googleapis
node get-token-web-client.js
```

## ✅ Verificación

Después de crear el cliente, verifica:

1. **En la consola**:
   - https://console.cloud.google.com/apis/credentials?project=pinot-tintum
   - Deberías ver tu nuevo cliente: `Pinot Gmail API Client`

2. **Client ID visible**: ✅
3. **Client Secret**: Puedes verlo/regenerarlo desde la consola ✅

## 📝 Próximos Pasos

1. ✅ Crear OAuth Client ID (este documento)
2. ⏳ Obtener Refresh Token (usando script)
3. ⏳ Configurar Firebase Functions
4. ⏳ Desplegar

---

**Última actualización**: Diciembre 2025
