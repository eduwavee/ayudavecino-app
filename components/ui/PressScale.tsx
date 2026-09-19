import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { DURACION, CURVA, RESORTE } from '../../constants/diseno'
import { haptica } from '../../utils/haptica'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Tocable con feedback físico: se achica un poco al tocar (rápido, sin rebote) y vuelve
// con un resorte natural al soltar. Corre en el hilo de UI (Reanimated). El estilo va
// sobre el propio tocable, así que flex/márgenes se comportan igual que en un View.
// `haptico` agrega una vibración leve al tocar — para CTAs y acciones importantes.
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  haptico = false,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: Omit<PressableProps, 'style'> & {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  scaleTo?: number
  haptico?: boolean
}) {
  const scale = useSharedValue(1)
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
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
      style={[style, animado]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  )
}
