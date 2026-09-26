import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { FUENTES as F } from '../../constants/diseno'
import { Icono, NombreIcono } from './Icono'

// Estado de un pedido, igual en todas las pantallas. Sobre fondo claro los textos son
// más oscuros que el color de marca para llegar a 4.5:1 de contraste; sobre el panel
// oscuro del proveedor se usan los tonos claros.
type Tono = { label: string; icono: NombreIcono; claro: string; oscuro: string; bg: string }

export const ESTADOS_PEDIDO: Record<string, Tono> = {
  PENDIENTE:  { label: 'Pendiente',  icono: 'time-outline',             claro: '#8A6500', oscuro: '#FFD23F',           bg: 'rgba(255,210,63,.16)' },
  ACEPTADO:   { label: 'Aceptado',   icono: 'checkmark-circle-outline', claro: '#137A47', oscuro: Colors.primaryLight, bg: 'rgba(26,158,92,.12)' },
  EN_CURSO:   { label: 'En curso',   icono: 'construct-outline',        claro: '#1F6FD1', oscuro: '#74B9FF',           bg: 'rgba(116,185,255,.16)' },
  COMPLETADO: { label: 'Completado', icono: 'checkmark-done',           claro: '#137A47', oscuro: Colors.primaryLight, bg: 'rgba(26,158,92,.12)' },
  CANCELADO:  { label: 'Cancelado',  icono: 'close-circle-outline',     claro: '#C0392B', oscuro: '#FF7675',           bg: 'rgba(255,118,117,.16)' },
}

export function EstadoBadge({ estado, oscuro }: { estado: string; oscuro?: boolean }) {
  const t = ESTADOS_PEDIDO[estado] ?? ESTADOS_PEDIDO.PENDIENTE
  const color = oscuro ? t.oscuro : t.claro
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} accessible accessibilityLabel={`Estado: ${t.label}`}>
      <Icono nombre={t.icono} tamano={12} color={color} />
      <Text style={[styles.texto, { color }]}>{t.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  texto: { fontSize: 10, fontFamily: F.bold },
})
