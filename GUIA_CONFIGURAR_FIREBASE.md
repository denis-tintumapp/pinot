# 🔥 Guía: Configurar Firebase para hello-app

## ✅ Firebase CLI Instalado

Versión: **15.0.0** ✅

---

## 🔍 Paso 1: Verificar Estado Actual

Ejecuta este script para verificar tu estado:

```bash
cd /Users/denispaiva/proyectos/pinot
./verificar_firebase.sh
```

O manualmente:

```bash
# Verificar autenticación
firebase login:list

# Ver proyectos disponibles
firebase projects:list
```

---

## 🔐 Paso 2: Autenticarse (Si No Estás Autenticado)

Si `firebase login:list` no muestra tu cuenta:

```bash
firebase login
```

Esto abrirá el navegador para autenticarte con tu cuenta de Google (denis@tintum.app).

---

## 📦 Paso 3: Verificar/Crear Proyecto hello-app

### Opción A: Verificar si Existe

```bash
firebase projects:list | grep hello-app
```

### Opción B: Crear desde Firebase Console (Recomendado)

1. **Ve a**: https://console.firebase.google.com
2. **Haz clic en**: "Add project"
3. **Nombre**: `hello-app`
4. **Sigue los pasos** de creación
5. **Habilita Firebase Hosting** cuando se te pregunte

### Opción C: Crear desde CLI

```bash
firebase projects:create hello-app
```

---

## 🚀 Paso 4: Configurar Firebase en el Proyecto

### Opción A: Usar Script Automático

```bash
cd /Users/denispaiva/proyectos/pinot
./configurar_hello_app.sh
```

### Opción B: Manual

```bash
cd /Users/denispaiva/proyectos/pinot

# Seleccionar proyecto
firebase use hello-app

# Inicializar hosting
firebase init hosting
```

**Cuando se te pregunte**:
- **Public directory**: `dist` (si usas Vite) o `public` (si es estático)
- **Single-page app**: `Yes`
- **GitHub Actions**: `No`

---

## 📝 Paso 5: Verificar Configuración

### Verificar .firebaserc

```bash
cat .firebaserc
```

Debería mostrar:
```json
{
  "projects": {
    "default": "hello-app"
  }
}
```

### Verificar firebase.json

```bash
cat firebase.json
```

Debería tener configuración de hosting.

---

## 🌐 Paso 6: Configurar Custom Domain

### 6.1. En Firebase Console

1. **Ve a**: https://console.firebase.google.com/project/hello-app/hosting
2. **Haz clic en**: "Add custom domain"
3. **Ingresa**: `hello.tintum.app`
4. **Copia el registro TXT** que Firebase te da

### 6.2. En Namecheap

1. **Ve a**: Domain List → Manage (junto a `tintum.app`)
2. **Pestaña**: Advanced DNS
3. **Agrega registro TXT**:
   - Type: `TXT Record`
   - Host: `hello`
   - Value: `firebase=hello-app.web.app` (el que copiaste)
   - TTL: `Automatic`
4. **Espera verificación** (5-30 minutos)

### 6.3. Agregar Registro CNAME o A

Una vez verificado, agrega:

**CNAME (Recomendado)**:
```
Type: CNAME
Host: hello
Value: hello-app.web.app
TTL: Automatic
```

---

## 🚀 Paso 7: Desplegar

### Si Usas Vite

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Si Es Estático

```bash
firebase deploy --only hosting
```

---

## ✅ Verificar

1. **Abre**: `https://hello.tintum.app`
2. **Verifica**:
   - ✅ Carga la aplicación
   - ✅ SSL válido (candado verde)
   - ✅ URL es `https://`

---

## 🆘 Comandos Útiles

```bash
# Ver proyectos
firebase projects:list

# Cambiar proyecto
firebase use hello-app

# Ver sitios de hosting
firebase hosting:sites:list

# Ver logs de deploy
firebase deploy --only hosting --debug
```

---

**¿Ejecutaste el script de verificación? ¿Qué proyectos ves?** 🔍

