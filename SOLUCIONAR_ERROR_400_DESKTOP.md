# 🔧 Solucionar Error 400: invalid_request (Desktop App)

## ❌ Error

```
Error 400: invalid_request
```

## 🔍 Causa para Desktop App

Para aplicaciones de tipo **"Desktop app"**, el redirect URI es automático (`urn:ietf:wg:oauth:2.0:oob`) y **NO se configura manualmente**.

El error 400 generalmente se debe a:

1. **OAuth Consent Screen no completamente configurado**
2. **Test users no agregados** (si está en modo Testing)
3. **Scopes no autorizados** en el OAuth Consent Screen

## ✅ Solución Paso a Paso

### Paso 1: Verificar OAuth Consent Screen

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. Verifica **"Publishing status"**:
   - Si dice **"Testing"**: Necesitas agregar test users
   - Si dice **"In production"**: Debería funcionar

### Paso 2: Agregar Test Users (Si está en Testing)

1. En OAuth Consent Screen, busca **"Test users"** o **"Users"**

2. Haz clic en **"ADD USERS"** o **"Agregar usuarios"**

3. Agrega: `denis@tintum.app`

4. Guarda los cambios

### Paso 3: Verificar Scopes

1. En OAuth Consent Screen, busca la sección **"Scopes"**

2. Verifica que esté agregado:
   - `https://www.googleapis.com/auth/gmail.send`
   - O `gmail.send`

3. Si no está, agrégalo:
   - Haz clic en **"ADD OR REMOVE SCOPES"**
   - Busca `gmail.send`
   - Selecciónalo
   - Guarda

### Paso 4: Verificar App Information

Asegúrate de que esté configurado:
- **App name**: Pinot Email Service
- **User support email**: denis@tintum.app
- **Developer contact**: denis@tintum.app

### Paso 5: Intentar Nuevamente

1. Espera unos segundos después de guardar los cambios

2. Ejecuta el script:
   ```bash
   cd /Users/denispaiva/proyectos/pinot/functions
   node get-token-now.js
   ```

3. Abre la URL de autorización

4. Debería funcionar correctamente

## 🔄 Si el Error Persiste

### Alternativa: Usar OAuth2 Playground

Si el script no funciona, puedes usar Google OAuth2 Playground:

1. Ve a: https://developers.google.com/oauthplayground/

2. Haz clic en el ícono de configuración (⚙️)

3. Marca **"Use your own OAuth credentials"**

4. Ingresa:
   - **OAuth Client ID**: `TU_CLIENT_ID_AQUI`
   - **OAuth Client secret**: `TU_CLIENT_SECRET_AQUI`

5. En la lista de APIs, busca y selecciona:
   - `https://www.googleapis.com/auth/gmail.send`

6. Haz clic en **"Authorize APIs"**

7. Autoriza con `denis@tintum.app`

8. Haz clic en **"Exchange authorization code for tokens"**

9. Copia el **Refresh token**

## 📝 Nota Importante

Para **Desktop app**, NO necesitas configurar redirect URIs. El error 400 generalmente se debe a:
- Test users faltantes
- Scopes no autorizados
- OAuth Consent Screen incompleto

---

**Última actualización**: Diciembre 2025

