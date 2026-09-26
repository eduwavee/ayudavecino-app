import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { planesService } from '../../services/planes.service'
import { usePlan } from '../../hooks/usePlan'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FUENTES as F } from '../../constants/diseno'
import { Icono } from '../../components/ui/Icono'
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { textoRating } from '../../utils/rating'

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)

// La barra crece desde la base al entrar: explica que es una cantidad, no decora.
function Barra({ alto, indice }: { alto: number; indice: number }) {
  const reducido = useReducedMotion()
  const escala = useSharedValue(reducido ? 1 : 0.08)
  useEffect(() => {
    if (reducido) return
    escala.set(withDelay(indice * 45, withTiming(1, { duration: 420, easing: EASE_OUT })))
  }, [reducido])
  const estilo = useAnimatedStyle(() => ({ transform: [{ scaleY: escala.get() }] }))
  return <Animated.View style={[styles.barra, { height: alto, transformOrigin: 'bottom' }, estilo]} />
}

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
      <View style={[styles.header, { paddingTop: 56 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Icono nombre="arrow-back" tamano={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      {nivel < 1 ? (
        <View style={styles.bloqueado}>
          <View style={styles.bloqueadoIco}><Icono nombre="stats-chart" tamano={34} color={Colors.primaryLight} /></View>
          <Text style={styles.bloqueadoTitulo}>Mirá cómo te va</Text>
          <Text style={styles.bloqueadoSub}>
            Con Pro ves cuántos vecinos visitaron tu perfil y cuántos pedidos recibiste este mes. Con Premium, además, tu evolución de los últimos 6 meses.
          </Text>
          <TouchableOpacity style={styles.bloqueadoBtn} onPress={() => router.push('/planes')}>
            <Icono nombre="rocket" tamano={16} color={Colors.dark} />
            <Text style={styles.bloqueadoBtnText}>Ver planes</Text>
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
              <Icono nombre="eye-outline" tamano={22} color="#74B9FF" style={styles.cardIco} />
              <Text style={[styles.cardNum, { color: '#74B9FF' }]}>{datos.vistasMes}</Text>
              <Text style={styles.cardLabel}>Visitas a tu perfil</Text>
            </View>
            <View style={[styles.cardGrande, { borderColor: 'rgba(61,214,140,.3)' }]}>
              <Icono nombre="clipboard-outline" tamano={22} color={Colors.primaryLight} style={styles.cardIco} />
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
                <Icono nombre="timer-outline" tamano={20} color="rgba(255,255,255,.6)" />
                <Text style={styles.cardLabel}>
                  Respondés los pedidos en <Text style={styles.chicaNum}>{formatearDemora(datos.minutosRespuesta)}</Text> en promedio
                </Text>
              </View>

              <Text style={styles.seccion}>Pedidos por mes</Text>
              <View style={styles.grafico}>
                {datos.meses?.map((m, i) => (
                  <View key={m.mes} style={styles.barraCol}>
                    <Text style={styles.barraValor}>{m.pedidos}</Text>
                    <Barra alto={8 + (m.pedidos / maxPedidos) * 90} indice={i} />
                    <Text style={styles.barraMes}>{nombreMes(m.mes)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.seccionFila}>
                <Text style={[styles.seccion, styles.seccionEnFila]}>Calificación promedio</Text>
                <Icono nombre="star" tamano={12} color="#FFD23F" />
                <Text style={[styles.seccion, styles.seccionEnFila, { color: '#FFD23F' }]}>{textoRating(datos.rating, '–')}</Text>
              </View>
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
              <View style={styles.upsellIco}><Icono nombre="diamond" tamano={20} color="#FFD23F" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upsellTitulo}>Ver tu evolución de 6 meses</Text>
                <Text style={styles.upsellSub}>Premium suma pedidos por mes, tiempo y tasa de respuesta, y la evolución de tu calificación.</Text>
              </View>
              <Icono nombre="chevron-forward" tamano={20} color="#FFD23F" />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
      <FondoBarraEstado color="#0D0D0D" />
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0D0D0D' },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  title:            { fontSize: 22, fontFamily: F.extrabold, color: 'white' },
  contenido:        { paddingHorizontal: 22, paddingBottom: 60 },
  seccion:          { fontSize: 12, fontFamily: F.extrabold, color: 'rgba(255,255,255,.6)', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },
  seccionFila:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, marginBottom: 12 },
  seccionEnFila:    { marginTop: 0, marginBottom: 0 },
  fila:             { flexDirection: 'row', gap: 10 },
  cardGrande:       { flex: 1, backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 18, padding: 18, borderWidth: 1 },
  cardIco:          { marginBottom: 8 },
  cardNum:          { fontSize: 34, fontFamily: F.extrabold },
  cardLabel:        { fontSize: 11, color: 'rgba(255,255,255,.6)', fontFamily: F.semibold, marginTop: 2 },
  cardChica:        { flex: 1, backgroundColor: 'rgba(255,255,255,.05)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  chicaNum:         { fontSize: 22, fontFamily: F.extrabold, color: 'white' },
  grafico:          { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 16, paddingTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  barraCol:         { alignItems: 'center', flex: 1, gap: 6 },
  barra:            { width: 22, borderRadius: 7, backgroundColor: Colors.primaryLight },
  barraValor:       { fontSize: 11, color: 'white', fontFamily: F.extrabold },
  barraMes:         { fontSize: 10, color: 'rgba(255,255,255,.6)', fontFamily: F.semibold, textTransform: 'capitalize' },
  ratingFila:       { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  ratingCol:        { alignItems: 'center', flex: 1, gap: 6 },
  ratingValor:      { fontSize: 15, fontFamily: F.extrabold, color: '#FFD23F' },
  upsell:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, backgroundColor: 'rgba(255,210,63,.1)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,210,63,.25)' },
  upsellIco:        { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,210,63,.14)', alignItems: 'center', justifyContent: 'center' },
  upsellTitulo:     { fontSize: 14, fontFamily: F.extrabold, color: 'white', marginBottom: 3 },
  upsellSub:        { fontFamily: F.regular, fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 17 },
  error:            { color: 'rgba(255,255,255,.5)', textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  bloqueado:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bloqueadoIco:     { width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(61,214,140,.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  bloqueadoTitulo:  { fontSize: 20, fontFamily: F.extrabold, color: 'white', marginBottom: 8 },
  bloqueadoSub:     { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  bloqueadoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  bloqueadoBtnText: { fontSize: 14, fontFamily: F.extrabold, color: Colors.dark },
})
