// Mensaje para mostrarle a la persona a partir de un error de axios.
// Sin respuesta del servidor es un problema de conexión: antes se mostraba el texto
// técnico de axios ("Network Error"), que no dice qué hacer.
export const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con AyudaVecino. Revisá tu conexión a internet y probá de nuevo.'

export function mensajeDeError(err: any, porDefecto: string): string {
  if (err?.isAxiosError && !err.response) return MENSAJE_SIN_CONEXION
  return err?.response?.data?.mensaje || err?.response?.data?.errores?.[0]?.msg || porDefecto
}
