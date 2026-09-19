import { useSharedValue, useAnimatedStyle, withSequence, withTiming, ReduceMotion } from 'react-native-reanimated'

// Sacudida horizontal corta para marcar un error (ej. login fallido): el movimiento
// comunica "algo está mal" sin tener que leer. Con "reducir movimiento" no se mueve
// (la alerta y la vibración de error ya avisan).
export function useSacudida() {
  const x = useSharedValue(0)
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  function sacudir() {
    const t = (valor: number) => withTiming(valor, { duration: 55, reduceMotion: ReduceMotion.System })
    x.value = withSequence(t(-10), t(10), t(-7), t(7), t(-3), t(0))
  }

  return { estilo, sacudir }
}
