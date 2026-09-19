import { useEffect } from 'react'
import { StyleSheet, ViewStyle, DimensionValue } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, useReducedMotion,
} from 'react-native-reanimated'
import { CURVA } from '../../constants/diseno'
import { useTemaStore } from '../../store/temaStore'

// Bloque base con animación de "pulso" — usalo para armar placeholders
// que imiten la forma real del contenido mientras carga. El pulso corre en el hilo
// de UI y se apaga con "reducir movimiento"; el color sigue al tema claro/oscuro.
export function SkeletonBlock({
  width = '100%',
  height = 14,
  borderRadius = 8,
  style,
}: {
  width?: DimensionValue
  height?: number
  borderRadius?: number
  style?: ViewStyle
}) {
  const oscuro = useTemaStore(s => s.oscuro)
  const reducirMovimiento = useReducedMotion()
  const opacity = useSharedValue(0.55)

  useEffect(() => {
    if (reducirMovimiento) return
    opacity.value = withRepeat(withTiming(1, { duration: 750, easing: CURVA.suave }), -1, true)
  }, [reducirMovimiento])

  const animado = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, backgroundColor: oscuro ? '#2A2A2A' : '#E8E3DC' },
        animado,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
})
