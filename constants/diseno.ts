import { Easing, ReduceMotion } from 'react-native-reanimated'

// ── Tipografía ────────────────────────────────────
// Poppins en toda la app. En Android, fontWeight con una fuente custom no elige
// el archivo correcto: cada peso es su propia familia, así que se usa fontFamily.
export const FUENTES = {
  regular:   'Poppins_400Regular',
  medium:    'Poppins_500Medium',
  semibold:  'Poppins_600SemiBold',
  bold:      'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
} as const

export function fuentePorPeso(peso?: string | number): string {
  switch (String(peso ?? '400')) {
    case '500': return FUENTES.medium
    case '600': return FUENTES.semibold
    case '700': case 'bold': return FUENTES.bold
    case '800': case '900': return FUENTES.extrabold
    default: return FUENTES.regular
  }
}

// ── Motion ────────────────────────────────────────
// Doctrina: suave le gana a rebotón. Las entradas desaceleran largo (power3.out) o
// usan un resorte casi críticamente amortiguado; el rebote queda para momentos
// explícitamente lúdicos (favorito, estrellas). Las salidas son más rápidas que
// las entradas. Solo se anima transform y opacidad.
export const DURACION = {
  tap:     120,  // feedback de toque
  rapida:  180,  // salidas, cambios chicos de estado
  base:    280,  // transiciones de componentes
  entrada: 420,  // entradas de contenido
  lenta:   700,  // contadores, reveals de pantalla
} as const

export const CURVA = {
  // power3.out: arranque rápido y asentado largo, el "settle" estándar
  salida:  Easing.bezier(0.215, 0.61, 0.355, 1),
  // power2.inOut: movimientos simétricos (indicadores, crossfades)
  suave:   Easing.bezier(0.455, 0.03, 0.515, 0.955),
  // power2.in: salidas que se van rápido
  entrada: Easing.bezier(0.55, 0.085, 0.68, 0.53),
} as const

// Resortes de Reanimated (withSpring). Sin reduceMotion explícito respetan la
// preferencia del sistema ("reducir movimiento" → se aplica el valor final).
export const RESORTE = {
  // ~críticamente amortiguado: se asienta sin rebote visible (entradas, press)
  firme:    { damping: 22, stiffness: 260, mass: 1, reduceMotion: ReduceMotion.System },
  // registro iOS: overshoot ~1%, se siente pero no se ve
  natural:  { damping: 16, stiffness: 180, mass: 1, reduceMotion: ReduceMotion.System },
  // lúdico: rebote visible (favorito, estrellas) — usar poco
  jugueton: { damping: 9,  stiffness: 220, mass: 0.8, reduceMotion: ReduceMotion.System },
} as const

// Separación entre elementos de una lista que entra escalonada
export const ESCALONADO = 55
// Tope: después del ítem N ya no se agrega retraso (listas largas no esperan)
export const ESCALONADO_MAX = 8

// ── Forma ─────────────────────────────────────────
export const RADIO = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const

export const ESPACIO = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

// Elevaciones suaves y consistentes (iOS usa shadow*, Android elevation)
export const SOMBRA = {
  baja:  { shadowColor:'#000', shadowOffset:{ width:0, height:2 }, shadowOpacity:.05, shadowRadius:6,  elevation:2 },
  media: { shadowColor:'#000', shadowOffset:{ width:0, height:6 }, shadowOpacity:.08, shadowRadius:14, elevation:5 },
  alta:  { shadowColor:'#000', shadowOffset:{ width:0, height:12 }, shadowOpacity:.14, shadowRadius:24, elevation:10 },
} as const

// Área mínima de toque (48dp Android / 44pt iOS): expandir con hitSlop
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const
