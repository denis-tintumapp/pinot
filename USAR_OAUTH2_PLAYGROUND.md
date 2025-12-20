# 🎯 Alternativa: Usar Google OAuth2 Playground

Si tienes problemas accediendo a la consola de Google Cloud, puedes usar **Google OAuth2 Playground** para obtener el Refresh Token directamente.

## ✅ Ventajas

- ✅ No requiere configurar test users
- ✅ Más fácil y rápido
- ✅ Interfaz visual clara
- ✅ Funciona inmediatamente

## 📝 Pasos

### Paso 1: Abrir OAuth2 Playground

Ve a: https://developers.google.com/oauthplayground/

### Paso 2: Configurar Credenciales Propias

1. Haz clic en el ícono de **configuración (⚙️)** en la esquina superior derecha

2. Marca la casilla: **"Use your own OAuth credentials"**

3. Ingresa tus credenciales:
   - **OAuth Client ID**: `TU_CLIENT_ID_AQUI`
   - **OAuth Client secret**: `TU_CLIENT_SECRET_AQUI`

4. Haz clic en **"Close"**

### Paso 3: Seleccionar Scope

1. En el panel izquierdo, busca en la lista de APIs:
   - **Gmail API v1**
   - O busca directamente: `gmail.send`

2. Expande **"Gmail API v1"**

3. Marca la casilla: **`https://www.googleapis.com/auth/gmail.send`**

### Paso 4: Autorizar

1. Haz clic en **"Authorize APIs"** (botón azul en la parte inferior)

2. Se abrirá una ventana de autorización de Google

3. Inicia sesión con `denis@tintum.app` si es necesario

4. Autoriza la aplicación cuando se te solicite

5. Puede aparecer una advertencia de "Google hasn't verified this app" - haz clic en **"Advanced"** → **"Go to Pinot PWA (unsafe)"**

6. Haz clic en **"Allow"** o **"Permitir"**

### Paso 5: Obtener Tokens

1. Después de autorizar, volverás al OAuth2 Playground

2. Haz clic en **"Exchange authorization code for tokens"** (botón azul)

3. Verás los tokens en el panel derecho:
   - **Access token**
   - **Refresh token** ← **Este es el que necesitas**

4. **Copia el Refresh token** (es un string largo)

### Paso 6: Configurar Firebase Functions

Una vez que tengas el Refresh Token, ejecuta:

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="TU_CLIENT_ID_AQUI"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET_AQUI"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN_AQUI"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

Reemplaza `TU_REFRESH_TOKEN_AQUI` con el Refresh Token que copiaste.

## ✅ Verificar

```bash
firebase functions:config:get
```

Deberías ver todas las configuraciones de gmail.

## 🚀 Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

**Última actualización**: Diciembre 2025

