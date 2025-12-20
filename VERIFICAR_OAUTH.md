# 🔍 Verificar Estado de OAuth Consent Screen

## 📋 Cómo Verificar si está Configurado

### Opción 1: Desde la Consola Web

1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

2. **Si ves información de la app** (App name, Support email, etc.):
   - ✅ **Está configurado**
   - Verifica que tenga el scope `gmail.send`
   - Si no lo tiene, edítalo y agrégalo

3. **Si ves un botón "CONFIGURE CONSENT SCREEN" o "EDIT APP"**:
   - ⚠️ **Necesita configuración**
   - Haz clic y completa los campos

4. **Si ves un mensaje de error o página en blanco**:
   - Puede que necesites permisos
   - O el proyecto no tiene OAuth habilitado

### Opción 2: Intentar Crear Credenciales Directamente

Si no estás seguro del estado del OAuth Consent Screen, intenta crear las credenciales directamente:

1. Ve a: https://console.cloud.google.com/apis/credentials?project=pinot-tintum

2. Haz clic en **"Create Credentials"** → **"OAuth client ID"**

3. **Si te permite crear las credenciales**:
   - ✅ El OAuth Consent Screen está configurado (o se configurará automáticamente)
   - Continúa con la creación

4. **Si te pide configurar el OAuth Consent Screen primero**:
   - Sigue las instrucciones que aparecen
   - Completa los campos requeridos
   - Luego vuelve a crear las credenciales

## 🎯 Recomendación

**Intenta crear las credenciales directamente**. Si Google te pide configurar el OAuth Consent Screen primero, te guiará paso a paso.

---

**Última actualización**: Diciembre 2025

