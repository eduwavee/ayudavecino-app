import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import type { Plan, Rol } from '../../store/authStore'
import { FUENTES as F } from '../../constants/diseno'
import { Icono, NombreIcono } from './Icono'

// Insignia del plan pago de un usuario. Gratis no muestra nada.
// (No confundir con "Verificado", que lo asigna un administrador y no depende del plan.)
type Estilo = { label: string; icono: NombreIcono; bg: string; borde: string; texto: string; textoOscuro: string }

const AZUL   = { bg: 'rgba(116,185,255,.16)', borde: 'rgba(116,185,255,.4)', texto: '#2F80ED', textoOscuro: '#8EC5FF' }
const DORADO = { bg: 'rgba(255,210,63,.2)',   borde: 'rgba(212,160,23,.45)', texto: '#8A6500', textoOscuro: '#FFD23F' }

const ESTILOS: Record<string, Estilo> = {
  PROVEEDOR_PRO:     { label: 'Pro',     icono: 'rocket',   ...AZUL },
  PROVEEDOR_PREMIUM: { label: 'Premium', icono: 'diamond',  ...DORADO },
  CLIENTE_PLUS:      { label: 'Plus',    icono: 'sparkles', ...AZUL },
  CLIENTE_PREMIUM:   { label: 'Premium', icono: 'diamond',  ...DORADO },
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
  const color = oscuro ? e.textoOscuro : e.texto
  return (
    <View
      style={[styles.badge, grande && styles.badgeGrande, { backgroundColor: e.bg, borderColor: e.borde }, style]}
      accessible
      accessibilityLabel={`Plan ${e.label}`}
    >
      <Icono nombre={e.icono} tamano={grande ? 12 : 10} color={color} />
      <Text style={[styles.texto, grande && styles.textoGrande, { color }]}>{e.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1 },
  badgeGrande: { gap: 5, paddingHorizontal: 12, paddingVertical: 5 },
  texto:       { fontSize: 9, fontFamily: F.extrabold },
  textoGrande: { fontSize: 11 },
})
