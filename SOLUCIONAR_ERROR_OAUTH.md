# 🔧 Solucionar Error "Access blocked: request is invalid"

## ❌ Error

```
Access blocked: Pinot PWA's request is invalid
```

## 🔍 Causas Comunes

1. **OAuth Consent Screen en modo "Testing"** sin test users
2. **Redirect URI no configurado** correctamente
3. **Scopes no autorizados** en el OAuth Consent Screen

## ✅ Soluciones

### Solución 1: Agregar Test Users (Más Común)

Si el OAuth Consent Screen está en modo "Testing":

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. Busca la sección **"Test users"** o **"Users"**

3. Haz clic en **"ADD USERS"** o **"Agregar usuarios"**

4. Agrega: `denis@tintum.app`

5. Guarda los cambios

6. Intenta autorizar nuevamente

### Solución 2: Verificar Redirect URI

1. Ve a: https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. Haz clic en tu credencial OAuth2 (Pinot Gmail API)

3. Verifica **"Authorized redirect URIs"**

4. Debe incluir: `urn:ietf:wg:oauth:2.0:oob`

5. Si no está, agrégalo y guarda

### Solución 3: Verificar Scopes

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. Verifica que el scope `gmail.send` esté agregado:
   - `https://www.googleapis.com/auth/gmail.send`

3. Si no está, agrégalo y guarda

### Solución 4: Cambiar a Producción (Opcional)

Si quieres que funcione para todos los usuarios:

1. Ve a OAuth Consent Screen

2. Cambia el **"Publishing status"** de "Testing" a "In production"

3. Esto requiere verificación de Google (puede tardar)

4. Para desarrollo, es mejor usar "Testing" con test users

## 🎯 Recomendación

**La solución más rápida es agregar test users:**

1. OAuth Consent Screen → Test users → ADD USERS
2. Agrega: `denis@tintum.app`
3. Guarda
4. Intenta autorizar nuevamente

---

**Última actualización**: Diciembre 2025

