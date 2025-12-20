# 🔐 Gestión de Secretos con Secret Manager

## ✅ Política de Secretos

**Todos los secretos sensibles deben almacenarse en Google Cloud Secret Manager**, no en:
- ❌ `functions.config()` (deprecado)
- ❌ Variables de entorno en código
- ❌ Archivos de configuración en el repositorio
- ❌ Valores hardcodeados

## 🎯 ¿Por qué Secret Manager?

1. **Seguridad**: Encriptación automática en reposo y en tránsito
2. **Auditoría**: Logs de acceso a secretos
3. **Control de acceso**: Permisos granulares por función
4. **Rotación**: Fácil actualización de secretos sin redeploy
5. **Versionado**: Historial de versiones de secretos
6. **Integración nativa**: Compatible con Firebase Functions

## 📋 Secretos Actuales

### Secret Principal: `FUNCTIONS_CONFIG_EXPORT`

Este secret contiene toda la configuración exportada desde `functions.config()`:

```json
{
  "gmail": {
    "client_id": "...",
    "client_secret": "...",
    "refresh_token": "...",
    "user": "hello@tintum.app",
    "oauth_email": "denis@tintum.app"
  },
  "recaptcha": {
    "secret_key": "..."
  }
}
```

**Ubicación**: `projects/770959850208/secrets/FUNCTIONS_CONFIG_EXPORT`

## 🆕 Agregar un Nuevo Secreto

### Opción 1: Secret Individual (Recomendado para secretos únicos)

Para un secreto específico (ej: API key de un servicio externo):

#### 1. Crear el secret en Secret Manager

```bash
# Crear un nuevo secret
firebase functions:secrets:set MI_NUEVO_SECRET

# Se te pedirá ingresar el valor del secret
# O puedes usar un archivo:
echo "mi-valor-secreto" | firebase functions:secrets:set MI_NUEVO_SECRET
```

#### 2. Definir el secret en el código

```javascript
const { defineString } = require('firebase-functions/params');

// Definir el secret
const miNuevoSecret = defineString('MI_NUEVO_SECRET');

// Usar en una función
exports.miFuncion = functions
  .runWith({ secrets: [miNuevoSecret] })
  .https.onRequest((req, res) => {
    const valor = miNuevoSecret.value();
    // Usar el valor...
  });
```

### Opción 2: Agregar al Secret JSON Existente

Para agregar un valor al secret JSON principal:

#### 1. Obtener el valor actual del secret

```bash
# Ver el secret actual (requiere permisos)
gcloud secrets versions access latest --secret="FUNCTIONS_CONFIG_EXPORT" --project="pinot-tintum"
```

#### 2. Actualizar el JSON con el nuevo valor

```json
{
  "gmail": { ... },
  "recaptcha": { ... },
  "nuevo_servicio": {
    "api_key": "nueva-api-key",
    "endpoint": "https://api.ejemplo.com"
  }
}
```

#### 3. Actualizar el secret

```bash
# Opción A: Desde un archivo JSON
echo '{"gmail": {...}, "nuevo_servicio": {...}}' | \
  firebase functions:secrets:set FUNCTIONS_CONFIG_EXPORT

# Opción B: Usar gcloud directamente
echo '{"gmail": {...}, "nuevo_servicio": {...}}' | \
  gcloud secrets versions add FUNCTIONS_CONFIG_EXPORT \
    --data-file=- \
    --project=pinot-tintum
```

#### 4. Usar en el código

```javascript
const config = configSecret.value();
const nuevaApiKey = config?.nuevo_servicio?.api_key;
```

## 🔄 Actualizar un Secreto Existente

### Para un secret individual:

```bash
firebase functions:secrets:set MI_NUEVO_SECRET
# Ingresa el nuevo valor cuando se solicite
```

### Para el secret JSON principal:

```bash
# 1. Obtener valor actual
gcloud secrets versions access latest --secret="FUNCTIONS_CONFIG_EXPORT" --project="pinot-tintum" > config-actual.json

# 2. Editar el archivo JSON
# (modifica los valores necesarios)

# 3. Actualizar el secret
cat config-actual.json | firebase functions:secrets:set FUNCTIONS_CONFIG_EXPORT

# 4. Limpiar archivo temporal
rm config-actual.json
```

## 📖 Listar Secretos

```bash
# Listar todos los secrets del proyecto
gcloud secrets list --project=pinot-tintum

# Ver detalles de un secret específico
gcloud secrets describe FUNCTIONS_CONFIG_EXPORT --project=pinot-tintum

# Ver versiones de un secret
gcloud secrets versions list FUNCTIONS_CONFIG_EXPORT --project=pinot-tintum
```

## 🔍 Ver el Valor de un Secreto

```bash
# Ver el valor actual (requiere permisos)
gcloud secrets versions access latest --secret="FUNCTIONS_CONFIG_EXPORT" --project="pinot-tintum"

# Ver una versión específica
gcloud secrets versions access 1 --secret="FUNCTIONS_CONFIG_EXPORT" --project="pinot-tintum"
```

## 🗑️ Eliminar un Secreto

```bash
# Eliminar un secret (¡CUIDADO! Esto es permanente)
gcloud secrets delete MI_NUEVO_SECRET --project=pinot-tintum

# O deshabilitar (más seguro, permite recuperar)
gcloud secrets disable MI_NUEVO_SECRET --project=pinot-tintum
```

## 🔐 Permisos y Acceso

### Ver permisos actuales:

```bash
gcloud secrets get-iam-policy FUNCTIONS_CONFIG_EXPORT --project=pinot-tintum
```

### Otorgar acceso a una cuenta de servicio:

```bash
gcloud secrets add-iam-policy-binding FUNCTIONS_CONFIG_EXPORT \
  --member="serviceAccount:pinot-tintum@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=pinot-tintum
```

**Nota**: Firebase Functions automáticamente otorga permisos a las funciones que usan un secret mediante `.runWith({ secrets: [...] })`.

## 📝 Ejemplo Completo: Agregar API Key de un Servicio Externo

### 1. Crear el secret

```bash
echo "sk_live_abc123xyz" | firebase functions:secrets:set STRIPE_API_KEY
```

### 2. Usar en el código

```javascript
const functions = require('firebase-functions/v1');
const { defineString } = require('firebase-functions/params');

const stripeApiKey = defineString('STRIPE_API_KEY');

exports.procesarPago = functions
  .runWith({ secrets: [stripeApiKey] })
  .https.onCall(async (data, context) => {
    const apiKey = stripeApiKey.value();
    // Usar apiKey para llamar a Stripe...
  });
```

### 3. Desplegar

```bash
firebase deploy --only functions
```

## ⚠️ Mejores Prácticas

1. **Nunca commitees secretos** al repositorio
2. **Usa nombres descriptivos** para los secrets (ej: `STRIPE_API_KEY`, no `KEY1`)
3. **Documenta los secrets** en este archivo o en un README
4. **Rota secretos regularmente**, especialmente si hay sospecha de compromiso
5. **Usa versiones** para mantener historial y poder revertir
6. **Prueba en desarrollo** antes de actualizar en producción
7. **Mantén un backup** de la configuración (sin valores) en el repositorio

## 🔄 Migración de Secretos Existentes

Si tienes secretos en otros lugares:

### Desde variables de entorno:

```bash
# Si tienes un .env.local con secretos
source .env.local
echo "$MI_SECRETO" | firebase functions:secrets:set MI_SECRETO
```

### Desde functions.config():

```bash
# Ya migrado automáticamente con:
firebase functions:config:export
```

## 📚 Referencias

- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Firebase Functions Params](https://firebase.google.com/docs/functions/config-env)

---

**Última actualización**: Diciembre 2025
**Proyecto**: pinot-tintum
**Política**: Todos los secretos deben estar en Secret Manager
