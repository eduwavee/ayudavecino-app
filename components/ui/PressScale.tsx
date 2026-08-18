import { useRef } from 'react'
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native'

// Envoltorio con feedback táctil: se achica un poco al tocar y vuelve a su tamaño
// con un resorte al soltar. Usalo en tarjetas/botones donde TouchableOpacity
// se siente plano (el cambio de opacidad no siempre se nota bien).
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  ...props
}: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current

  function onPressIn() {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} {...props}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
