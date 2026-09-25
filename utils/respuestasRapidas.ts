import AsyncStorage from '@react-native-async-storage/async-storage'

// Respuestas rápidas personalizadas del chat (plan Premium del proveedor).
// Se guardan en el celular, por usuario: son atajos personales, no hace falta el backend.

export const MAX_RESPUESTAS = 10
export const MAX_LARGO_RESPUESTA = 120

const clave = (usuarioId: string) => `respuestas_rapidas_${usuarioId}`

export async function leerRespuestas(usuarioId: string): Promise<string[]> {
  try {
    const guardado = await AsyncStorage.getItem(clave(usuarioId))
    const lista = guardado ? JSON.parse(guardado) : []
    return Array.isArray(lista) ? lista.filter(r => typeof r === 'string') : []
  } catch {
    return []
  }
}

export async function guardarRespuestas(usuarioId: string, respuestas: string[]) {
  await AsyncStorage.setItem(clave(usuarioId), JSON.stringify(respuestas.slice(0, MAX_RESPUESTAS)))
}
