# 🔄 Migración a Firebase Functions Params API

## ✅ Migración Completada

Se ha migrado exitosamente de `functions.config()` (deprecado) a la nueva API de `params` de Firebase Functions.

## 📋 Cambios Realizados

### 1. Actualización de Dependencias

- **firebase-functions**: Actualizado de `^4.5.0` a `^7.0.2`
- Compatible con la nueva API de `params` y `secrets`

### 2. Cambios en el Código

#### Antes (functions.config()):
```javascript
const functions = require('firebase-functions');

function getGmailClient() {
  const clientId = functions.config().gmail?.client_id;
  const clientSecret = functions.config().gmail?.client_secret;
  // ...
}
```

#### Después (params API):
```javascript
const functions = require('firebase-functions/v1');
const { defineJsonSecret } = require('firebase-functions/params');

const configSecret = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT');

function getGmailClient() {
  const config = configSecret.value();
  const clientId = config?.gmail?.client_id;
  const clientSecret = config?.gmail?.client_secret;
  // ...
}

exports.enviarEmailConfirmacion = functions
  .runWith({ secrets: [configSecret] })
  .https.onCall({ ... });
```

### 3. Exportación de Configuración

Se ejecutó `firebase functions:config:export` que:
- Exportó toda la configuración existente a un secret de Secret Manager
- Creó el secret: `FUNCTIONS_CONFIG_EXPORT`
- Versión: `projects/770959850208/secrets/FUNCTIONS_CONFIG_EXPORT/versions/1`

### 4. Vinculación de Secrets

La función `enviarEmailConfirmacion` ahora vincula el secret:

```javascript
exports.enviarEmailConfirmacion = functions
  .runWith({ secrets: [configSecret] })
  .https.onCall({ ... });
```

## 🔐 Configuración Actual

### Secrets Exportados

La configuración exportada incluye:

- **Gmail API**:
  - `client_id`: OAuth2 Client ID
  - `client_secret`: OAuth2 Client Secret
  - `refresh_token`: OAuth2 Refresh Token
  - `user`: `hello@tintum.app` (remitente)
  - `oauth_email`: `denis@tintum.app` (cuenta OAuth)

- **reCAPTCHA**:
  - `secret_key`: Secret key para reCAPTCHA v3

### Nota sobre Parámetros

Todos los valores de configuración (Gmail API y reCAPTCHA) están incluidos en el secret exportado `FUNCTIONS_CONFIG_EXPORT`. No se requieren parámetros adicionales.

## 🚀 Despliegue

Para desplegar las funciones actualizadas:

```bash
cd /Users/denispaiva/proyectos/pinot
firebase deploy --only functions
```

## 📝 Notas Importantes

1. **Compatibilidad**: La nueva API es compatible con Firebase Functions v6.6.0+
2. **Secrets**: Los secrets se gestionan automáticamente por Secret Manager
3. **Seguridad**: Los valores sensibles ahora están en Secret Manager, más seguro que Runtime Config
4. **Deprecación**: `functions.config()` será eliminado en marzo 2026

## 🔍 Verificación

Para verificar que la migración funcionó correctamente:

1. **Revisa los logs después del despliegue**:
   ```bash
   firebase functions:log
   ```

2. **Prueba el envío de emails**:
   - Completa el formulario en: `https://pinot.tintum.app/auth/signup-host-e`
   - Verifica que el email se envíe correctamente

3. **Revisa los logs de la función**:
   - Busca mensajes de "📧 Iniciando envío de email"
   - Verifica que no haya errores relacionados con configuración

## 🆘 Troubleshooting

### Error: "Secret not found"

Si aparece un error sobre secret no encontrado:

1. Verifica que el secret existe:
   ```bash
   gcloud secrets list --filter="name:FUNCTIONS_CONFIG_EXPORT"
   ```

2. Si no existe, vuelve a exportar:
   ```bash
   firebase functions:config:export
   ```

### Error: "Permission denied"

Si hay errores de permisos:

1. Verifica que la cuenta de servicio tenga acceso al secret:
   ```bash
   gcloud secrets get-iam-policy FUNCTIONS_CONFIG_EXPORT
   ```

2. Otorga permisos si es necesario:
   ```bash
   gcloud secrets add-iam-policy-binding FUNCTIONS_CONFIG_EXPORT \
     --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

## 📚 Referencias

- [Firebase Functions Params](https://firebase.google.com/docs/functions/config-env)
- [Migración de functions.config()](https://firebase.google.com/docs/functions/config-env#migrate-config)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)

---

**Fecha de migración**: Diciembre 2025
**Versión de firebase-functions**: 7.0.2
