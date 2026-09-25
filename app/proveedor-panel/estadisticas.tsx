import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { planesService } from '../../services/planes.service'
import { usePlan } from '../../hooks/usePlan'
import { FUENTES as F } from '../../constants/diseno'

type Estadisticas = {
  nivel: 'BASICO' | 'COMPLETO'
  vistasMes: number
  pedidosMes: number
  vistasTotales?: number
  pedidosTotales?: number
  completados?: number
  tasaRespuesta?: number | null
  minutosRespuesta?: number | null
  rating?: number
  meses?: { mes: string; pedidos: number; rating: number | null }[]
}

function nombreMes(anioMes: string) {
  const [anio, mes] = anioMes.split('-').map(Number)
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
}

function formatearDemora(minutos?: number | null) {
  if (minutos == null) return '—'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.round(minutos / 60)
  return horas < 48 ? `${horas} h` : `${Math.round(horas / 24)} días`
}

export default function EstadisticasScreen() {
  const router = useRouter()
  const { nivel } = usePlan()
  const [datos, setDatos] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    if (nivel < 1) { setLoading(false); return }
    planesService.estadisticas()
      .then(setDatos)
      .catch(() => setDatos(null))
      .finally(() => setLoading(false))
  }, [nivel]))

  const maxPedidos = Math.max(1, ...(datos?.meses?.map(m => m.pedidos) ?? [0]))

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { paddingTop: 56 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      {nivel < 1 ? (
        <View style={styles.bloqueado}>
          <Text style={styles.bloqueadoIco}>📊</Text>
          <Text style={styles.bloqueadoTitulo}>Mirá cómo te va</Text>
          <Text style={styles.bloqueadoSub}>
            Con Pro ves cuántos vecinos visitaron tu perfil y cuántos pedidos recibiste este mes. Con Premium, además, tu evolución de los últimos 6 meses.
          </Text>
          <TouchableOpacity style={styles.bloqueadoBtn} onPress={() => router.push('/planes')}>
            <Text style={styles.bloqueadoBtnText}>🚀 Ver planes</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator color={Colors.primaryLight} style={{ marginTop: 40 }} />
      ) : !datos ? (
        <Text style={styles.error}>No se pudieron cargar las estadísticas. Probá de nuevo más tarde.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
          <Text style={styles.seccion}>Este mes</Text>
          <View style={styles.fila}>
            <View style={[styles.cardGrande, { borderColor: 'rgba(116,185,255,.3)' }]}>
              <Text style={styles.cardIco}>👀</Text>
              <Text style={[styles.cardNum, { color: '#74B9FF' }]}>{datos.vistasMes}</Text>
              <Text style={styles.cardLabel}>Visitas a tu perfil</Text>
            </View>
            <View style={[styles.cardGrande, { borderColor: 'rgba(61,214,140,.3)' }]}>
              <Text style={styles.cardIco}>📋</Text>
              <Text style={[styles.cardNum, { color: Colors.primaryLight }]}>{datos.pedidosMes}</Text>
              <Text style={styles.cardLabel}>Pedidos recibidos</Text>
            </View>
          </View>

          {datos.nivel === 'COMPLETO' ? (
            <>
              <Text style={styles.seccion}>Desde que empezaste</Text>
              <View style={styles.fila}>
                <View style={styles.cardChica}>
                  <Text style={styles.chicaNum}>{datos.vistasTotales}</Text>
                  <Text style={styles.cardLabel}>Visitas</Text>
                </View>
                <View style={styles.cardChica}>
                  <Text style={styles.chicaNum}>{datos.completados}</Text>
                  <Text style={styles.cardLabel}>Trabajos hechos</Text>
                </View>
                <View style={styles.cardChica}>
                  <Text style={styles.chicaNum}>{datos.tasaRespuesta != null ? `${datos.tasaRespuesta}%` : '—'}</Text>
                  <Text style={styles.cardLabel}>Respondidos</Text>
                </View>
              </View>
              <View style={[styles.cardChica, { marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
                <Text style={styles.cardIco}>⏱️</Text>
                <Text style={styles.cardLabel}>
                  Respondés los pedidos en <Text style={styles.chicaNum}>{formatearDemora(datos.minutosRespuesta)}</Text> en promedio
                </Text>
              </View>

              <Text style={styles.seccion}>Pedidos por mes</Text>
              <View style={styles.grafico}>
                {datos.meses?.map(m => (
                  <View key={m.mes} style={styles.barraCol}>
                    <Text style={styles.barraValor}>{m.pedidos}</Text>
                    <View style={[styles.barra, { height: 8 + (m.pedidos / maxPedidos) * 90 }]} />
                    <Text style={styles.barraMes}>{nombreMes(m.mes)}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.seccion}>Calificación promedio · ⭐ {datos.rating?.toFixed(1) ?? '0.0'}</Text>
              <View style={styles.ratingFila}>
                {datos.meses?.map(m => (
                  <View key={m.mes} style={styles.ratingCol}>
                    <Text style={[styles.ratingValor, m.rating == null && { opacity: .3 }]}>
                      {m.rating != null ? m.rating.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.barraMes}>{nombreMes(m.mes)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.upsell} onPress={() => router.push('/planes')}>
              <Text style={styles.upsellIco}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.upsellTitulo}>Ver tu evolución de 6 meses</Text>
                <Text style={styles.upsellSub}>Premium suma pedidos por mes, tiempo y tasa de respuesta, y la evolución de tu calificación.</Text>
              </View>
              <Text style={styles.upsellFlecha}>›</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0D0D0D' },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  backText:         { fontFamily: F.regular, fontSize: 16, color: 'white' },
  title:            { fontSize: 22, fontFamily: F.extrabold, color: 'white' },
  contenido:        { paddingHorizontal: 22, paddingBottom: 60 },
  seccion:          { fontSize: 12, fontFamily: F.extrabold, color: 'rgba(255,255,255,.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },
  fila:             { flexDirection: 'row', gap: 10 },
  cardGrande:       { flex: 1, backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 18, padding: 18, borderWidth: 1 },
  cardIco:          { fontFamily: F.regular, fontSize: 22, marginBottom: 8 },
  cardNum:          { fontSize: 34, fontFamily: F.extrabold },
  cardLabel:        { fontSize: 11, color: 'rgba(255,255,255,.45)', fontFamily: F.semibold, marginTop: 2 },
  cardChica:        { flex: 1, backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  chicaNum:         { fontSize: 22, fontFamily: F.extrabold, color: 'white' },
  grafico:          { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 16, paddingTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  barraCol:         { alignItems: 'center', flex: 1, gap: 6 },
  barra:            { width: 22, borderRadius: 7, backgroundColor: Colors.primaryLight },
  barraValor:       { fontSize: 11, color: 'white', fontFamily: F.extrabold },
  barraMes:         { fontSize: 10, color: 'rgba(255,255,255,.4)', fontFamily: F.semibold, textTransform: 'capitalize' },
  ratingFila:       { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  ratingCol:        { alignItems: 'center', flex: 1, gap: 6 },
  ratingValor:      { fontSize: 15, fontFamily: F.extrabold, color: '#FFD23F' },
  upsell:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, backgroundColor: 'rgba(255,210,63,.1)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,210,63,.25)' },
  upsellIco:        { fontFamily: F.regular, fontSize: 26 },
  upsellTitulo:     { fontSize: 14, fontFamily: F.extrabold, color: 'white', marginBottom: 3 },
  upsellSub:        { fontFamily: F.regular, fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 17 },
  upsellFlecha:     { fontFamily: F.regular, fontSize: 24, color: '#FFD23F' },
  error:            { color: 'rgba(255,255,255,.5)', textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  bloqueado:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bloqueadoIco:     { fontFamily: F.regular, fontSize: 52, marginBottom: 14 },
  bloqueadoTitulo:  { fontSize: 20, fontFamily: F.extrabold, color: 'white', marginBottom: 8 },
  bloqueadoSub:     { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  bloqueadoBtn:     { backgroundColor: Colors.primaryLight, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  bloqueadoBtnText: { fontSize: 14, fontFamily: F.extrabold, color: Colors.dark },
})
