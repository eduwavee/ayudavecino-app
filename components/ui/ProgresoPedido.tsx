import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { FUENTES as F, DURACION, CURVA } from '../../constants/diseno'
import { useTema } from '../../store/temaStore'

const PASOS = ['Enviado', 'Aceptado', 'Pagado', 'En curso', 'Listo']

// En qué paso está un pedido según su estado y su pago
function pasoActual(estado: string, pagado: boolean): number {
  switch (estado) {
    case 'PENDIENTE':  return 0
    case 'ACEPTADO':   return pagado ? 2 : 1
    case 'EN_CURSO':   return 3
    case 'COMPLETADO': return 4
    default:           return 0
  }
}

// Línea de tiempo del pedido: la barra se llena hasta el paso actual (power3.out) y los
// puntos alcanzados se pintan. Un pedido cancelado muestra solo el aviso.
export function ProgresoPedido({ estado, pagado }: { estado: string; pagado: boolean }) {
  const tema = useTema()
  const [ancho, setAncho] = useState(0)
  const paso = pasoActual(estado, pagado)
  const progreso = useSharedValue(0)

  useEffect(() => {
    progreso.value = withDelay(150, withTiming(paso / (PASOS.length - 1), { duration: DURACION.lenta, easing: CURVA.salida }))
  }, [paso])

  // Se anima translateX (no width): la barra llena se desliza dentro de su carril
  const relleno = useAnimatedStyle(() => ({ transform: [{ translateX: (progreso.value - 1) * ancho }] }))

  if (estado === 'CANCELADO') {
    return <Text style={[styles.cancelado, { color: '#C0392B' }]}>✕ Pedido cancelado</Text>
  }

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`Progreso del pedido: ${PASOS[paso]}, paso ${paso + 1} de ${PASOS.length}`}
    >
      <View style={[styles.carril, { backgroundColor: tema.border }]} onLayout={e => setAncho(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.relleno, relleno]} />
      </View>
      <View style={styles.pasos}>
        {PASOS.map((nombre, i) => (
          <View key={nombre} style={styles.paso}>
            <View style={[styles.punto, { backgroundColor: i <= paso ? Colors.primary : tema.border, borderColor: tema.card }]} />
            <Text style={[styles.pasoTexto, { color: i <= paso ? tema.texto : tema.subTexto }, i === paso && styles.pasoActual]}>
              {nombre}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap:       { marginBottom: 12, marginTop: 2 },
  carril:     { height: 4, borderRadius: 2, overflow: 'hidden', marginHorizontal: 10, marginBottom: -7 },
  relleno:    { ...StyleSheet.absoluteFill, backgroundColor: Colors.primary, borderRadius: 2 },
  pasos:      { flexDirection: 'row', justifyContent: 'space-between' },
  paso:       { alignItems: 'center', width: 58 },
  punto:      { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginBottom: 4 },
  pasoTexto:  { fontFamily: F.medium, fontSize: 9.5 },
  pasoActual: { fontFamily: F.bold },
  cancelado:  { fontFamily: F.semibold, fontSize: 11, marginBottom: 10 },
})
