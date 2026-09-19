import { Pressable, Text, StyleProp, ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated'
import { FUENTES as F, DURACION, CURVA, RESORTE, HIT_SLOP } from '../../constants/diseno'
import { haptica } from '../../utils/haptica'

// Corazón de favoritos: al marcarlo "late" (crece rápido y vuelve con un resorte lúdico,
// uno de los pocos lugares donde el rebote es intencional). Anuncia su estado al lector
// de pantalla.
export function BotonCorazon({
  activo,
  onToggle,
  style,
  size = 17,
}: {
  activo: boolean
  onToggle: () => void
  style?: StyleProp<ViewStyle>
  size?: number
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
        <Text style={{ fontFamily: F.regular, fontSize: size }}>{activo ? '❤️' : '🤍'}</Text>
      </Animated.View>
    </Pressable>
  )
}
