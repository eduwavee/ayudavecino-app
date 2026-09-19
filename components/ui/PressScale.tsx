import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { DURACION, CURVA, RESORTE } from '../../constants/diseno'
import { haptica } from '../../utils/haptica'

// Envoltorio con feedback táctil: se achica un poco al tocar (rápido, sin rebote) y
// vuelve con un resorte firme al soltar. Corre en el hilo de UI (Reanimated).
// `haptico` agrega una vibración leve al tocar — para CTAs y acciones importantes.
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  haptico = false,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: PressableProps & {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  scaleTo?: number
  haptico?: boolean
}) {
  const scale = useSharedValue(1)
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: DURACION.tap, easing: CURVA.salida })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, RESORTE.natural)
        onPressOut?.(e)
      }}
      onPress={(e) => {
        if (haptico) haptica.toque()
        onPress?.(e)
      }}
      {...props}
    >
      <Animated.View style={[style, animado]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
