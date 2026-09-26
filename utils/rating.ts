// El rating es el promedio de las reseñas (1 a 5): 0 o null significa que todavía
// no tiene ninguna. Mostrar "0.0" se leía como una calificación pésima.
export function textoRating(rating: number | null | undefined, sinResenas = 'Nuevo'): string {
  return typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : sinResenas
}
