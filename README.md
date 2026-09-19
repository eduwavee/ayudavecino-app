# AyudaVecino — App mobile

App mobile de AyudaVecino, un marketplace que conecta vecinos con oficios y servicios locales (plomeros, electricistas, gasistas, etc.). Este repo contiene el frontend (React Native + Expo); la API vive en un [repo aparte](https://github.com/eduwavee/ayudavecino-backend) y es necesaria para usar la app.

## Funcionalidades

- Registro con email, usuario y contraseña; login por usuario con dos roles separados: **cliente** (busca servicios) y **proveedor** (los ofrece)
- Recuperación de contraseña con código por email
- Onboarding en el primer arranque y sesión persistente
- 25 categorías de servicio, búsqueda con filtros (precio, calificación, verificados, cercanía) y mapa de proveedores cercanos
- Servicios con fotos de trabajos anteriores
- Pedidos entre clientes y proveedores, con panel propio para el proveedor
- Pagos con escrow: el pago queda retenido hasta que el cliente confirma el trabajo (por ahora en modo de prueba, sin dinero real)
- Chat en tiempo real (Socket.io) con historial, fotos, mensajes leídos y botón para llamar
- Notificaciones en tiempo real guardadas en el servidor (pedidos, pagos, mensajes, reseñas)
- Reseñas, calificaciones e insignias de proveedor (verificado, top rated, responde rápido)
- Proveedores favoritos
- Perfil con foto (avatar), descripción del proveedor, edición de datos y cambio de contraseña
- Modo oscuro persistente

## Stack

- **Expo SDK 57** + React Native 0.86 + React 19.2
- **Expo Router** (navegación por archivos en `app/`)
- **NativeWind** (Tailwind para React Native), **Zustand** (estado global), **Axios** (API REST), **socket.io-client** (chat)
- **TypeScript**

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- El [backend de AyudaVecino](https://github.com/eduwavee/ayudavecino-backend) corriendo (requiere PostgreSQL)
- Para probar en un celular: la app **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), con el celular en la **misma red Wi-Fi** que la PC
- Opcional: emulador de Android (Android Studio) o simulador de iOS (solo macOS)

## Instalación

### 1. Levantar el backend

Seguí las instrucciones del [README del backend](https://github.com/eduwavee/ayudavecino-backend#cómo-correrlo-local). En resumen:

```bash
git clone https://github.com/eduwavee/ayudavecino-backend.git
cd ayudavecino-backend
npm install
cp .env.example .env     # completar DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT=3000
npx prisma migrate dev
npm run dev
```

La API queda en `http://localhost:3000/api`.

### 2. Instalar la app

```bash
git clone https://github.com/eduwavee/ayudavecino-app.git
cd ayudavecino-app
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` es necesario: algunas dependencias opcionales de Expo (herramientas web) piden una versión de React más nueva que la que usa el SDK 57, y sin el flag `npm` corta con un error `ERESOLVE`.

### 3. Configurar la conexión al backend

No hace falta configurar nada: la app usa como backend la misma IP desde la que Expo la sirve (la de tu PC en la red), en el puerto 3000. Si cambiás de red, sigue funcionando.

Si tu PC tiene varias interfaces (ej. Ethernet y Wi-Fi) y Expo elige la equivocada, forzá la IP al levantarlo:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=TU_IP_LOCAL npx expo start
```

Para apuntar a otro servidor (ej. uno desplegado), creá un `.env` (`cp .env.example .env`) con:

```env
EXPO_PUBLIC_API_URL=http://TU_SERVIDOR:3000/api
EXPO_PUBLIC_SOCKET_URL=http://TU_SERVIDOR:3000
```

### 4. (Opcional) Key de Google Maps para Android

Para que el mapa se vea en un build de Android, completá `GOOGLE_MAPS_API_KEY_ANDROID` en el `.env` con una key de Google Cloud Console que tenga habilitado **Maps SDK for Android**. Si falta, la app arranca igual (vas a ver un aviso en la consola) pero el mapa no renderiza.

## Ejecutar la app

Con el backend corriendo:

```bash
npm start
```

Se abre Expo con un código QR:

- **Celular:** escaneá el QR con Expo Go (Android) o con la cámara (iOS).
- **Emulador Android:** presioná `a` (o `npm run android`).
- **Simulador iOS:** presioná `i` (o `npm run ios`).

Si cambiaste el `.env` y no se toman los valores nuevos, reiniciá limpiando la caché: `npx expo start -c`.

## Cómo probarla

Recorrido sugerido para probar el flujo completo. Lo ideal es usar **dos dispositivos** (dos celulares, o celular + emulador) para ver el chat en tiempo real:

1. **Crear un proveedor:** en el dispositivo 1, completá el onboarding, andá a *Registrarse* y elegí **"Ofrezco servicios"**.
2. **Publicar un servicio:** desde el panel de proveedor, creá un servicio nuevo (título, categoría, precio).
3. **Crear un cliente:** en el dispositivo 2, registrate con **"Busco servicios"**.
4. **Buscar y pedir:** en la pestaña *Buscar* (o *Mapa*) encontrá el servicio, abrí el perfil del proveedor y hacé un pedido.
5. **Gestionar el pedido:** en el dispositivo 1, en *Pedidos* del panel de proveedor, aceptá el pedido.
6. **Chatear:** abrí el chat del pedido desde ambos lados, mandá mensajes y fotos, y verificá que lleguen al instante y se marquen como leídos.
7. **Reseñar:** cuando el pedido esté completado, dejá una reseña como cliente y verificá que aparezca en el perfil del proveedor.
8. **Pagar:** con el pedido aceptado, el cliente toca *Pagar* (modo de prueba). Recién ahí el proveedor puede marcarlo *en curso*; al confirmar el trabajo, el pago se libera.
9. **Perfil:** probá cambiar la foto de perfil, editar datos y cambiar la contraseña desde *Perfil* / *Ajustes*.
10. **Recuperar contraseña:** desde el login, *¿Olvidaste tu contraseña?*. Sin SMTP configurado en el backend, el código aparece en la consola del backend.

### Chequeo de tipos

Los tests automatizados están en el backend (reglas de negocio de la API). En la app, el CI (GitHub Actions, en cada push o PR a `main`) corre el chequeo de TypeScript, que podés correr local con:

```bash
npx tsc --noEmit
```

## Problemas comunes

| Problema | Solución |
|---|---|
| `Network Error` o timeout al iniciar sesión | El backend no está corriendo, la IP es incorrecta o el celular no está en la misma red. Probá abrir `http://TU_IP_LOCAL:3000/api` desde el navegador del celular. En Windows, permití Node.js en el firewall para redes privadas. |
| `npm install` falla con `ERESOLVE` | Usá `npm install --legacy-peer-deps`. |
| El mapa se ve en blanco en Android | Falta o es inválida `GOOGLE_MAPS_API_KEY_ANDROID`. |
| Las imágenes (avatar, fotos del chat) no cargan | Las imágenes se sirven desde el backend: si usás `EXPO_PUBLIC_SOCKET_URL`, revisá que apunte a la IP correcta. |

## Estructura del proyecto

```
app/            # pantallas (Expo Router): (auth), (tabs), chat, pedido, proveedor, proveedor-panel, resena...
components/     # componentes reutilizables
constants/      # colores, categorías y configuración (URL de la API)
services/       # llamadas a la API por dominio (auth, pedidos, chat, reseñas...)
store/          # estado global con Zustand
utils/          # helpers (distancias, ubicación, validaciones, FormData para imágenes)
```

## Notas

Proyecto personal desarrollado en solitario, full-stack junto con el backend. En desarrollo activo.
