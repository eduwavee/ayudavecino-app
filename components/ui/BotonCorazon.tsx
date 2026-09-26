import { Pressable, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated'
import { DURACION, CURVA, RESORTE, HIT_SLOP } from '../../constants/diseno'
import { haptica } from '../../utils/haptica'
import { Icono } from './Icono'

// Corazón de favoritos: al marcarlo "late" (crece rápido y vuelve con un resorte lúdico,
// uno de los pocos lugares donde el rebote es intencional). Anuncia su estado al lector
// de pantalla.
export function BotonCorazon({
  activo,
  onToggle,
  style,
  size = 17,
  color = '#FFFFFF',
}: {
  activo: boolean
  onToggle: () => void
  style?: StyleProp<ViewStyle>
  size?: number
  color?: string          // color del corazón vacío (el lleno siempre es rojo)
}) {
  const scale = useSharedValue(1)
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  function tocar() {
    haptica.seleccion()
    scale.value = activo
      ? withSequence(withTiming(0.8, { duration: DURACION.tap }), withSpring(1, RESORTE.firme))
      : withSequence(withTiming(1.35, { duration: DURACION.tap, easing: CURVA.salida }), withSpring(1, RESORTE.jugueton))
    onToggle()
  }

  return (
    <Pressable
      onPress={tocar}
      hitSlop={HIT_SLOP}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      accessibilityState={{ selected: activo }}
    >
      <Animated.View style={animado}>
        <Icono nombre={activo ? 'heart' : 'heart-outline'} tamano={size + 3} color={activo ? '#FF4D5E' : color} />
      </Animated.View>
    </Pressable>
  )
}
