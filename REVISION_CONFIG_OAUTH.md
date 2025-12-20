# 🔍 Revisión de Configuración OAuth2 - Google Cloud Shell

**Fecha**: Diciembre 2025  
**Proyecto**: `pinot-tintum`  
**Cuenta**: `denis@tintum.app`

## ✅ Estado de la Configuración

### Autenticación
- ✅ **Cuenta activa**: `denis@tintum.app`
- ✅ **Proyecto configurado**: `pinot-tintum`
- ✅ **Project Number**: `770959850208`
- ✅ **Rol**: `roles/owner` (acceso completo)

### APIs Habilitadas
- ✅ **Gmail API**: `gmail.googleapis.com` ✅ Habilitada
- ✅ **Identity Toolkit**: `identitytoolkit.googleapis.com` ✅ Habilitada
- ✅ **Cloud Functions**: `cloudfunctions.googleapis.com` ✅ Habilitada

### Configuración OAuth2

#### Web Client (Auto creado por Google Service)
- **Client ID**: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
- **Client Secret**: ⏳ **Pendiente de revisar** (oculto en consola)
- **Tipo**: Web Application
- **Estado**: Habilitado

#### OAuth Consent Screen
- **URL**: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
- **Estado**: ⏳ **Pendiente de revisar** (requiere acceso a consola web)

## 🔗 URLs Importantes

### Configuración OAuth2
1. **OAuth Consent Screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
   ```

2. **OAuth2 Credentials**:
   ```
   https://console.cloud.google.com/apis/credentials?project=pinot-tintum
   ```

3. **Gmail API Dashboard**:
   ```
   https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=pinot-tintum
   ```

4. **Web Client específico**:
   ```
   https://console.cloud.google.com/apis/credentials/consent/edit?project=pinot-tintum
   ```

## ⚠️ Limitaciones de Google Cloud Shell

Los OAuth2 clients y su configuración detallada **no se pueden revisar completamente desde la CLI** porque:

1. **Client Secret**: Está oculto por seguridad y solo se puede revelar/regenerar desde la consola web
2. **Redirect URIs**: Se configuran desde la interfaz web
3. **OAuth Consent Screen**: Requiere configuración visual desde la consola

## 📋 Checklist de Configuración

### ✅ Completado (desde CLI)
- [x] Proyecto configurado: `pinot-tintum`
- [x] Gmail API habilitada
- [x] Autenticación activa: `denis@tintum.app`
- [x] Permisos: Owner

### ⏳ Pendiente (requiere consola web)
- [ ] **Revelar/Regenerar Client Secret** del Web client
- [ ] **Agregar Redirect URI**: `urn:ietf:wg:oauth:2.0:oob`
- [ ] **Configurar OAuth Consent Screen**:
  - [ ] App name: `Pinot Email Service`
  - [ ] User support email: `denis@tintum.app`
  - [ ] Scope: `https://www.googleapis.com/auth/gmail.send`
  - [ ] Test users: Agregar `denis@tintum.app` (si está en Testing)
- [ ] **Obtener Refresh Token** (usando script Node.js)
- [ ] **Configurar Firebase Functions** (tokens OAuth2)

## 🔧 Comandos Útiles

### Verificar autenticación
```bash
gcloud auth list
```

### Verificar proyecto
```bash
gcloud config get-value project
```

### Verificar Gmail API
```bash
gcloud services list --enabled --filter="name:gmail.googleapis.com"
```

### Ver permisos
```bash
gcloud projects get-iam-policy pinot-tintum \
  --flatten="bindings[].members" \
  --filter="bindings.members:denis@tintum.app"
```

## 📝 Próximos Pasos

1. **Abrir consola web**:
   - https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. **Revisar Web client**:
   - Buscar: "Web client (auto created by Google Service)"
   - Client ID: `770959850208-esokfa5vilssj6agu9080onm0gmdefpe.apps.googleusercontent.com`
   - Revelar/Regenerar Client Secret
   - Agregar Redirect URI: `urn:ietf:wg:oauth:2.0:oob`

3. **Configurar OAuth Consent Screen**:
   - https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
   - Verificar scopes y test users

4. **Obtener Refresh Token**:
   ```bash
   cd /Users/denispaiva/proyectos/pinot/functions
   node get-token-web-client.js
   ```

5. **Configurar Firebase Functions**:
   ```bash
   firebase functions:config:set gmail.client_id="..."
   firebase functions:config:set gmail.client_secret="..."
   firebase functions:config:set gmail.refresh_token="..."
   firebase functions:config:set gmail.user="hello@tintum.app"
   firebase functions:config:set gmail.oauth_email="denis@tintum.app"
   ```

---

**Última actualización**: Diciembre 2025
