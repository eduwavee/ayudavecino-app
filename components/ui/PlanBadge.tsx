import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import type { Plan, Rol } from '../../store/authStore'
import { FUENTES as F } from '../../constants/diseno'

// Insignia del plan pago de un usuario. Gratis no muestra nada.
// (No confundir con "Verificado", que lo asigna un administrador y no depende del plan.)
const ESTILOS: Record<string, { label: string; bg: string; borde: string; texto: string; textoOscuro: string }> = {
  PROVEEDOR_PRO:     { label: '🚀 Pro',        bg: 'rgba(116,185,255,.16)', borde: 'rgba(116,185,255,.4)', texto: '#2F80ED', textoOscuro: '#8EC5FF' },
  PROVEEDOR_PREMIUM: { label: '👑 Premium',    bg: 'rgba(255,210,63,.2)',   borde: 'rgba(212,160,23,.45)', texto: '#A87C00', textoOscuro: '#FFD23F' },
  CLIENTE_PLUS:      { label: '✨ Plus',        bg: 'rgba(116,185,255,.16)', borde: 'rgba(116,185,255,.4)', texto: '#2F80ED', textoOscuro: '#8EC5FF' },
  CLIENTE_PREMIUM:   { label: '💎 Premium',     bg: 'rgba(255,210,63,.2)',   borde: 'rgba(212,160,23,.45)', texto: '#A87C00', textoOscuro: '#FFD23F' },
}

type Props = {
  plan?: Plan | null
  rol: Rol
  oscuro?: boolean        // sobre fondos oscuros (hero, panel del proveedor)
  grande?: boolean
  style?: StyleProp<ViewStyle>
}

export function PlanBadge({ plan, rol, oscuro, grande, style }: Props) {
  const e = plan && plan !== 'GRATIS' ? ESTILOS[`${rol}_${plan}`] : null
  if (!e) return null
  return (
    <View style={[styles.badge, grande && styles.badgeGrande, { backgroundColor: e.bg, borderColor: e.borde }, style]}>
      <Text style={[styles.texto, grande && styles.textoGrande, { color: oscuro ? e.textoOscuro : e.texto }]}>
        {e.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1 },
  badgeGrande: { paddingHorizontal: 12, paddingVertical: 5 },
  texto:       { fontSize: 9, fontFamily: F.extrabold },
  textoGrande: { fontSize: 11 },
})
