import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { PLANES, Periodo, precioPlan, formatearPrecio, nivelPlan } from '../../constants/planes'
import { useAuthStore } from '../../store/authStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { planesService } from '../../services/planes.service'
import { usePlan } from '../../hooks/usePlan'
import { FUENTES as F, HIT_SLOP } from '../../constants/diseno'
import { PressScale } from '../../components/ui/PressScale'
import { Aparecer } from '../../components/ui/Aparecer'

export default function PlanesScreen() {
  const router = useRouter()
  const tema = useTema()
  const styles = getStyles(tema)
  const { token, setUsuario } = useAuthStore()
  const { plan: planActual, rol, info: infoActual, venceEn } = usePlan()
  const [periodo, setPeriodo] = useState<Periodo>('MENSUAL')
  const [cancelando, setCancelando] = useState(false)

  const planes = PLANES[rol]
  const esProveedor = rol === 'PROVEEDOR'

  function confirmarCancelacion() {
    Alert.alert(
      '¿Volver al plan Gratis?',
      `Vas a perder los beneficios de ${infoActual.nombre} ahora mismo.`,
      [
        { text: 'Mantener mi plan', style: 'cancel' },
        { text: 'Cancelar plan', style: 'destructive', onPress: cancelar },
      ]
    )
  }

  async function cancelar() {
    setCancelando(true)
    try {
      const usuario = await planesService.cancelar()
      setUsuario(usuario, token!)
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo cancelar el plan')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HERO ── */}
      <View style={[styles.hero, { paddingTop: 56 }]}>
        <View style={styles.heroBg} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.heroKicker}>{esProveedor ? 'Planes para proveedores' : 'Planes para vecinos'}</Text>
        <Text style={styles.heroTitle}>
          {esProveedor ? 'Conseguí más clientes' : 'Resolvé todo más rápido'}
        </Text>
        <Text style={styles.heroSub}>
          {esProveedor
            ? 'Aparecé primero en la búsqueda, publicá más servicios y medí cómo te va.'
            : 'Repetí tus pedidos con un toque, enterate cuando vuelve tu favorito y pedí con prioridad.'}
        </Text>

        {planActual !== 'GRATIS' && (
          <View style={styles.actualCard}>
            <Text style={styles.actualIco}>{infoActual.ico}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actualLabel}>Tu plan actual</Text>
              <Text style={styles.actualNombre}>{infoActual.nombre}</Text>
              {venceEn && (
                <Text style={styles.actualVence}>
                  Vence el {venceEn.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── MENSUAL / ANUAL ── */}
      <View style={styles.toggle}>
        {(['MENSUAL', 'ANUAL'] as Periodo[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.toggleBtn, periodo === p && styles.toggleBtnActivo]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.toggleText, periodo === p && styles.toggleTextActivo]}>
              {p === 'MENSUAL' ? 'Mensual' : 'Anual'}
            </Text>
            {p === 'ANUAL' && (
              <View style={styles.ahorroChip}><Text style={styles.ahorroText}>2 meses gratis</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TARJETAS ── */}
      {planes.map((p, i) => {
        const esActual = p.id === planActual
        const precio   = precioPlan(p, periodo)
        const esMejora = nivelPlan(p.id) > nivelPlan(planActual)
        return (
          <Aparecer key={p.id} indice={i} style={[styles.card, p.destacado && styles.cardDestacada, esActual && styles.cardActual]}>
            {p.destacado && (
              <View style={styles.destacadoChip}><Text style={styles.destacadoText}>⭐ Más elegido</Text></View>
            )}

            <View style={styles.cardTop}>
              <View style={[styles.cardIco, p.destacado && styles.cardIcoDestacado]}>
                <Text style={{ fontFamily: F.regular, fontSize: 24 }}>{p.ico}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNombre}>{p.nombre}</Text>
                <Text style={styles.cardLema}>{p.lema}</Text>
              </View>
            </View>

            <View style={styles.precioRow}>
              <Text style={styles.precio}>{precio === 0 ? 'Gratis' : formatearPrecio(precio)}</Text>
              {precio > 0 && <Text style={styles.precioPeriodo}>/{periodo === 'ANUAL' ? 'año' : 'mes'}</Text>}
            </View>
            {precio > 0 && periodo === 'ANUAL' && (
              <Text style={styles.precioEquivalente}>
                Equivale a {formatearPrecio(Math.round((precio / 12) * 100) / 100)} por mes
              </Text>
            )}

            <View style={styles.beneficios}>
              {p.beneficios.map(b => (
                <View key={b} style={styles.beneficioRow}>
                  <Text style={[styles.beneficioCheck, p.destacado && { color: '#D4A017' }]}>✓</Text>
                  <Text style={styles.beneficioText}>{b}</Text>
                </View>
              ))}
            </View>

            {esActual ? (
              <View style={styles.btnActual}>
                <Text style={styles.btnActualText}>✓ Tu plan actual</Text>
              </View>
            ) : p.id === 'GRATIS' ? (
              <TouchableOpacity style={styles.btnSecundario} onPress={confirmarCancelacion} disabled={cancelando}>
                {cancelando
                  ? <ActivityIndicator color={tema.texto} />
                  : <Text style={styles.btnSecundarioText}>Volver a Gratis</Text>}
              </TouchableOpacity>
            ) : (
              <PressScale
                haptico
                style={[styles.btnElegir, p.destacado && styles.btnElegirDestacado]}
                onPress={() => router.push({ pathname: '/planes/checkout', params: { plan: p.id, periodo } })}
              >
                <Text style={[styles.btnElegirText, p.destacado && { color: Colors.dark }]}>
                  {esMejora ? `Mejorar a ${p.nombre}` : `Cambiar a ${p.nombre}`}
                </Text>
              </PressScale>
            )}
          </Aparecer>
        )
      })}

      <View style={styles.nota}>
        <Text style={styles.notaIco}>🧪</Text>
        <Text style={styles.notaText}>
          Los pagos están en modo de prueba: podés activar cualquier plan sin que se cobre nada.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: tema.bg },
  hero:               { backgroundColor: '#1a1a1a', paddingHorizontal: 22, paddingBottom: 26, overflow: 'hidden' },
  heroBg:             { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#FFD23F', opacity: .08, top: -90, right: -90 },
  backBtn:            { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  backText:           { fontFamily: F.regular, fontSize: 16, color: 'white' },
  heroKicker:         { fontSize: 11, color: '#FFD23F', fontFamily: F.extrabold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroTitle:          { fontSize: 26, fontFamily: F.extrabold, color: 'white', marginBottom: 6 },
  heroSub:            { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 19 },
  actualCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, backgroundColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  actualIco:          { fontFamily: F.regular, fontSize: 28 },
  actualLabel:        { fontSize: 10, color: 'rgba(255,255,255,.45)', fontFamily: F.bold, letterSpacing: 1, textTransform: 'uppercase' },
  actualNombre:       { fontSize: 16, color: 'white', fontFamily: F.extrabold, marginTop: 2 },
  actualVence:        { fontFamily: F.regular, fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 },

  toggle:             { flexDirection: 'row', backgroundColor: tema.card, marginHorizontal: 22, marginTop: -14, borderRadius: 16, padding: 4, gap: 4, shadowColor: tema.sombra, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .08, shadowRadius: 10, elevation: 4, marginBottom: 18 },
  toggleBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  toggleBtnActivo:    { backgroundColor: Colors.dark },
  toggleText:         { fontSize: 13, fontFamily: F.bold, color: tema.subTexto },
  toggleTextActivo:   { color: 'white' },
  ahorroChip:         { backgroundColor: 'rgba(61,214,140,.2)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100 },
  ahorroText:         { fontSize: 9, fontFamily: F.extrabold, color: Colors.primary },

  card:               { backgroundColor: tema.card, marginHorizontal: 22, borderRadius: 22, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: tema.border, shadowColor: tema.sombra, shadowOffset: { width: 0, height: 2 }, shadowOpacity: .05, shadowRadius: 8, elevation: 2 },
  cardDestacada:      { borderColor: '#FFD23F', borderWidth: 2, shadowColor: '#D4A017', shadowOpacity: .18, shadowRadius: 14, elevation: 5 },
  cardActual:         { borderColor: Colors.primary },
  destacadoChip:      { position: 'absolute', top: -11, right: 18, backgroundColor: '#FFD23F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  destacadoText:      { fontSize: 10, fontFamily: F.extrabold, color: Colors.dark },
  cardTop:            { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIco:            { width: 48, height: 48, borderRadius: 14, backgroundColor: tema.inputBg, alignItems: 'center', justifyContent: 'center' },
  cardIcoDestacado:   { backgroundColor: 'rgba(255,210,63,.2)' },
  cardNombre:         { fontSize: 18, fontFamily: F.extrabold, color: tema.texto },
  cardLema:           { fontFamily: F.regular, fontSize: 12, color: tema.subTexto, marginTop: 2 },
  precioRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  precio:             { fontSize: 30, fontFamily: F.extrabold, color: tema.texto },
  precioPeriodo:      { fontSize: 13, color: tema.subTexto, fontFamily: F.semibold, marginBottom: 6 },
  precioEquivalente:  { fontSize: 11, color: Colors.primary, fontFamily: F.bold, marginTop: 2 },
  beneficios:         { gap: 9, marginTop: 16, marginBottom: 18 },
  beneficioRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  beneficioCheck:     { fontSize: 13, fontFamily: F.extrabold, color: Colors.primary, width: 14 },
  beneficioText:      { fontFamily: F.regular, flex: 1, fontSize: 13, color: tema.texto, lineHeight: 18 },
  btnElegir:          { backgroundColor: Colors.dark, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnElegirDestacado: { backgroundColor: '#FFD23F' },
  btnElegirText:      { color: 'white', fontSize: 14, fontFamily: F.extrabold },
  btnActual:          { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(26,158,92,.1)' },
  btnActualText:      { color: Colors.primary, fontSize: 14, fontFamily: F.extrabold },
  btnSecundario:      { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: tema.border },
  btnSecundarioText:  { color: tema.texto, fontSize: 14, fontFamily: F.bold },

  nota:               { flexDirection: 'row', gap: 10, marginHorizontal: 22, marginTop: 4, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,210,63,.12)' },
  notaIco:            { fontFamily: F.regular, fontSize: 16 },
  notaText:           { fontFamily: F.regular, flex: 1, fontSize: 12, color: tema.texto, lineHeight: 18 },
})
