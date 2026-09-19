import { StyleProp, ViewStyle } from 'react-native'
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeInRight } from 'react-native-reanimated'
import { DURACION, CURVA, ESCALONADO, ESCALONADO_MAX } from '../../constants/diseno'

type Desde = 'abajo' | 'arriba' | 'derecha' | 'lugar'

const ANIMACION = { abajo: FadeInDown, arriba: FadeInUp, derecha: FadeInRight, lugar: FadeIn }

// Entrada de contenido: aparece con un desplazamiento corto y desacelerando (power3.out).
// `indice` escalona los elementos de una lista (55 ms entre cada uno, con tope para
// que las listas largas no hagan esperar). Respeta "reducir movimiento" del sistema.
export function Aparecer({
  children,
  indice = 0,
  desde = 'abajo',
  retraso = 0,
  style,
}: {
  children: React.ReactNode
  indice?: number
  desde?: Desde
  retraso?: number
  style?: StyleProp<ViewStyle>
}) {
  const entrada = ANIMACION[desde]
    .duration(DURACION.entrada)
    .easing(CURVA.salida)
    .delay(retraso + Math.min(indice, ESCALONADO_MAX) * ESCALONADO)

  return (
    <Animated.View entering={entrada} style={style}>
      {children}
    </Animated.View>
  )
}

// Envuelve el renderItem de una FlatList para que cada ítem entre escalonado según su posición
export function conEntrada<T>(render: (info: { item: T; index: number }) => React.ReactElement | null) {
  return (info: { item: T; index: number }) => (
    <Aparecer indice={info.index}>{render(info)}</Aparecer>
  )
}
