import * as Location from 'expo-location'

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
