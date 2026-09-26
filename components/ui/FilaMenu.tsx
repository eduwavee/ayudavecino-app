import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Colors } from '../../constants/colors'
import { FUENTES as F } from '../../constants/diseno'
import { useTema } from '../../store/temaStore'
import { Icono, NombreIcono } from './Icono'

// Fila de menú (Perfil, Ajustes): ícono en un recuadro teñido, texto y chevron.
// `extra` es un detalle a la derecha (un candado de plan, un valor). El fondo se
// oscurece apenas mientras se aprieta: feedback inmediato sin animar nada.
export function FilaMenu({
  icono,
  texto,
  onPress,
  extra,
  tinte = Colors.primary,
  destructiva = false,
}: {
  icono: NombreIcono
  texto: string
  onPress: () => void
  extra?: React.ReactNode
  tinte?: string
  destructiva?: boolean
}) {
  const tema = useTema()
  const color = destructiva ? '#C0392B' : tinte
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={({ pressed }) => [styles.fila, pressed && { backgroundColor: tema.overlay }]}
    >
      <View style={[styles.icoWrap, { backgroundColor: color + '1A' }]}>
        <Icono nombre={icono} tamano={18} color={color} />
      </View>
      <Text style={[styles.texto, { color: destructiva ? color : tema.texto }]}>{texto}</Text>
      {extra}
      <Icono nombre="chevron-forward" tamano={18} color={tema.subTexto} />
    </Pressable>
  )
}

export function DivisorMenu() {
  const tema = useTema()
  return <View style={[styles.divisor, { backgroundColor: tema.border }]} />
}

const styles = StyleSheet.create({
  fila:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12, minHeight: 56 },
  icoWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  texto:   { flex: 1, fontSize: 14, fontFamily: F.medium },
  divisor: { height: 1, marginLeft: 62 },
})
