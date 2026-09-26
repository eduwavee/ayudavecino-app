import * as Location from 'expo-location'

// Posición actual con respaldo. Adentro de una casa el GPS puede tardar mucho o fallar
// (y getCurrentPositionAsync a veces no responde nunca): se espera hasta 10 s y, si no
// llega, se usa la última posición conocida del teléfono, que para calcular distancias
// dentro del barrio alcanza. Devuelve null si no hay ninguna.
// Lanza 'UBICACION_APAGADA' si la ubicación del teléfono está desactivada, para poder
// decirle a la persona qué hacer en vez de mostrar un error genérico.
export async function obtenerPosicion(): Promise<{ latitude: number; longitude: number } | null> {
  if (!(await Location.hasServicesEnabledAsync().catch(() => true))) {
    throw new Error('UBICACION_APAGADA')
  }
  const actual = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
    new Promise<null>(resolver => setTimeout(() => resolver(null), 10000)),
  ])
  const pos = actual ?? await Location.getLastKnownPositionAsync().catch(() => null)
  return pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude } : null
}

export const MENSAJE_UBICACION_APAGADA = 'La ubicación del teléfono está apagada. Activala desde la configuración y probá de nuevo.'

// "Ciudad, Provincia" a partir de coordenadas (geocodificacion inversa del sistema).
// Devuelve null si no se pudo resolver (sin conexion, sin servicio de geocoding, etc).
export async function nombreDeLugar(coords: { latitude: number; longitude: number }): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync(coords)
    if (!lugar) return null
    const ciudad = lugar.city ?? lugar.subregion ?? lugar.district
    return [ciudad, lugar.region].filter(Boolean).join(', ') || null
  } catch {
    return null
  }
}
