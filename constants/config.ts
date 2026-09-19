import Constants from 'expo-constants'

// IP de la PC donde corre el backend. En desarrollo es la misma desde la que Expo sirve
// la app (ej. "192.168.1.35:8081"), asi que se toma de ahi: no hay que tocar nada al
// cambiar de red. Si no se puede detectar (build de produccion), cae en localhost.
function hostDelDevServer(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
  return hostUri?.split(':')[0] || 'localhost'
}

const HOST = hostDelDevServer()

// Se puede overridear seteando EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL en .env
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${HOST}:3000/api`
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? `http://${HOST}:3000`

// El backend guarda avatares e imágenes de chat como ruta relativa (ej: /uploads/avatars/xxx.jpg).
// Esto arma la URL completa para poder mostrarlos con <Image>.
export function archivoUrl(ruta?: string | null): string | null {
  if (!ruta) return null
  return ruta.startsWith('http') ? ruta : `${SOCKET_URL}${ruta}`
}
export const avatarUrl = archivoUrl

// Clave de AsyncStorage para saber si el usuario ya vio el onboarding.
export const ONBOARDING_KEY = 'onboarding_visto'
