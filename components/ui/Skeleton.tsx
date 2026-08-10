import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native'

// Bloque base con animación de "pulso" — usalo para armar placeholders
// que imiten la forma real del contenido mientras carga.
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
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#E5E1DB' },
})
