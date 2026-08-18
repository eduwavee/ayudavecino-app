// IP local de tu PC en la red Wi-Fi/LAN, para probar en un celular real con Expo Go.
// Cambiala cada vez que tu PC cambie de red (podés ver la tuya con `ipconfig`).
const LAN_IP = '192.168.1.2'

// Se puede overridear sin tocar este archivo seteando EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL en .env
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${LAN_IP}:3000/api`
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? `http://${LAN_IP}:3000`

// El backend guarda avatares e imágenes de chat como ruta relativa (ej: /uploads/avatars/xxx.jpg).
// Esto arma la URL completa para poder mostrarlos con <Image>.
export function archivoUrl(ruta?: string | null): string | null {
  if (!ruta) return null
  return ruta.startsWith('http') ? ruta : `${SOCKET_URL}${ruta}`
}
export const avatarUrl = archivoUrl

// Clave de AsyncStorage para saber si el usuario ya vio el onboarding.
export const ONBOARDING_KEY = 'onboarding_visto'
