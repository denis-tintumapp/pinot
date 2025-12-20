# 🔧 Solucionar Error 400: invalid_request

## ❌ Error

```
Error 400: invalid_request
```

## 🔍 Causa

Este error generalmente ocurre porque el **redirect URI** no está configurado en las credenciales OAuth2.

## ✅ Solución

### Paso 1: Configurar Redirect URI

1. Ve a: https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. Haz clic en tu credencial OAuth2: **"Pinot Gmail API"**

3. Busca la sección **"Authorized redirect URIs"**

4. Haz clic en **"ADD URI"** o **"Agregar URI"**

5. Agrega este URI:
   ```
   urn:ietf:wg:oauth:2.0:oob
   ```

6. Haz clic en **"SAVE"** o **"Guardar"**

### Paso 2: Verificar Configuración

Asegúrate de que:
- ✅ El redirect URI `urn:ietf:wg:oauth:2.0:oob` esté en la lista
- ✅ Los cambios estén guardados
- ✅ El test user `denis@tintum.app` esté agregado (en OAuth Consent Screen)

### Paso 3: Intentar Nuevamente

1. Ejecuta el script nuevamente:
   ```bash
   cd /Users/denispaiva/proyectos/pinot/functions
   node get-token-now.js
   ```

2. Abre la URL de autorización

3. Debería funcionar correctamente

## 🔄 Alternativa: Usar localhost (Si el problema persiste)

Si `urn:ietf:wg:oauth:2.0:oob` no funciona, puedes usar `http://localhost`:

1. En las credenciales OAuth2, agrega:
   ```
   http://localhost
   ```

2. Actualiza el script para usar `http://localhost` como redirect URI

3. El código de autorización aparecerá en la URL después de redirigir

## 📝 Nota

El redirect URI `urn:ietf:wg:oauth:2.0:oob` es el estándar para aplicaciones de escritorio y debería funcionar. Si no funciona, verifica que:

- El URI esté escrito exactamente como se muestra (sin espacios)
- Los cambios estén guardados
- Esperes unos segundos después de guardar para que los cambios se propaguen

---

**Última actualización**: Diciembre 2025

