import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { MAX_PRESUPUESTOS_EXTRA } from '../../constants/planes'
import { pedidosService } from '../../services/pedidos.service'
import { serviciosService } from '../../services/servicios.service'
import { FUENTES as F } from '../../constants/diseno'
import { alertaError, haptica } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { usePlan } from '../../hooks/usePlan'

const HORARIOS = ['8:00','9:30','11:00','14:00','15:30','17:00']

export default function NuevoPedidoScreen() {
  const router = useRouter()
  const {
    servicioId, servicioNombre, precio, proveedorNombre, proveedorId, categoria,
    descripcion: descripcionPrevia, // viene al repetir un pedido
  } = useLocalSearchParams<any>()
  const { esPremium, pedirMejora } = usePlan()
  const [descripcion, setDescripcion] = useState(descripcionPrevia ?? '')
  const [horario, setHorario]         = useState('')
  const [loading, setLoading]         = useState(false)

  // Vecino Premium: pedido urgente y presupuesto a varios proveedores
  const [urgente, setUrgente]           = useState(false)
  const [alternativas, setAlternativas] = useState<any[]>([])
  const [extras, setExtras]             = useState<string[]>([])

  useEffect(() => {
    if (!esPremium || !categoria) return
    serviciosService.listarTodos({ categoria })
      .then((lista: any[]) => {
        // Un servicio por proveedor (el mejor ubicado), sin el proveedor que ya elegiste
        const vistos = new Set<string>([proveedorId])
        setAlternativas(lista.filter(s => {
          const pid = s.proveedor?.id
          if (!pid || vistos.has(pid)) return false
          vistos.add(pid)
          return true
        }).slice(0, 8))
      })
      .catch(() => setAlternativas([]))
  }, [esPremium, categoria, proveedorId])

  function alternarUrgente(valor: boolean) {
    if (valor && !esPremium) {
      pedirMejora('Los pedidos urgentes ⚡ le llegan resaltados al proveedor y quedan primeros en su lista. Son parte de Vecino Premium.')
      return
    }
    haptica.seleccion()
    setUrgente(valor)
  }

  function alternarExtra(id: string) {
    haptica.seleccion()
    setExtras(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_PRESUPUESTOS_EXTRA) {
        Alert.alert('Máximo alcanzado', `Podés sumar hasta ${MAX_PRESUPUESTOS_EXTRA} proveedores más`)
        return prev
      }
      return [...prev, id]
    })
  }

  async function handleCrearPedido() {
    if (!horario) return alertaError('Elegí un horario')
    setLoading(true)
    try {
      const [h, m] = horario.split(':')
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + 1)
      fecha.setHours(parseInt(h), parseInt(m), 0, 0)

      await pedidosService.crearPedido({
        servicioId,
        fecha: fecha.toISOString(),
        descripcion,
        ...(urgente && { urgente: true }),
        ...(extras.length > 0 && { serviciosAdicionales: extras }),
      })

      // Navegar a pantalla de éxito
      haptica.exito()
      const nombre = proveedorNombre ?? 'Proveedor'
      router.replace({
        pathname: '/pedido/exito',
        params: {
          monto:     Math.round(Number(precio) * 1.1),
          servicio:  servicioNombre,
          proveedor: extras.length > 0 ? `${nombre} y ${extras.length} más` : nombre,
        }
      })
    } catch (err: any) {
      const data = err.response?.data
      if (data?.codigo === 'PLAN_REQUERIDO') pedirMejora(data.mensaje)
      else alertaError(data?.mensaje || 'No se pudo crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </PressScale>
          <Text style={styles.title}>Nuevo Pedido</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.serviceIco}><Text style={{ fontFamily: F.regular, fontSize:24}}>🔧</Text></View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{servicioNombre}</Text>
            <Text style={styles.servicePrice}>${Number(precio).toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ELEGÍ EL HORARIO</Text>
        <View style={styles.horariosGrid}>
          {HORARIOS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.horarioBtn, horario === h && styles.horarioBtnActive]}
              onPress={() => setHorario(h)}
            >
              <Text style={[styles.horarioText, horario === h && styles.horarioTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DESCRIPCIÓN (OPCIONAL)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Describí brevemente qué necesitás..."
          placeholderTextColor="#767676"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── URGENTE (Vecino Premium) ── */}
        <View style={[styles.premiumCard, urgente && styles.premiumCardActiva]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitulo}>⚡ Pedido urgente{!esPremium ? ' 💎' : ''}</Text>
            <Text style={styles.premiumSub}>Le llega resaltado al proveedor y queda primero en su lista</Text>
          </View>
          <Switch
            value={urgente}
            onValueChange={alternarUrgente}
            trackColor={{ false: Colors.border, true: 'rgba(255,210,63,.6)' }}
            thumbColor={urgente ? '#D4A017' : '#ccc'}
            accessibilityLabel="Pedido urgente"
          />
        </View>

        {/* ── PRESUPUESTO A VARIOS (Vecino Premium) ── */}
        {!!categoria && (
          esPremium ? (
            alternativas.length > 0 && (
              <View style={styles.extrasWrap}>
                <Text style={styles.sectionLabel}>PEDÍ PRESUPUESTO A MÁS PROVEEDORES ({extras.length}/{MAX_PRESUPUESTOS_EXTRA})</Text>
                <Text style={styles.extrasAyuda}>Mandamos el mismo pedido a los que elijas; cada uno te responde y te quedás con el mejor.</Text>
                {alternativas.map(s => {
                  const elegido = extras.includes(s.id)
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.extraCard, elegido && styles.extraCardActiva]}
                      onPress={() => alternarExtra(s.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: elegido }}
                    >
                      <View style={[styles.check, elegido && styles.checkActivo]}>
                        {elegido && <Text style={styles.checkText}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.extraNombreRow}>
                          <Text style={styles.extraNombre} numberOfLines={1}>{s.proveedor?.nombre}</Text>
                          <PlanBadge plan={s.proveedor?.plan} rol="PROVEEDOR" />
                        </View>
                        <Text style={styles.extraSub} numberOfLines={1}>{s.nombre} · ⭐ {s.proveedor?.rating?.toFixed(1) ?? '0.0'}</Text>
                      </View>
                      <Text style={styles.extraPrecio}>${s.precio?.toLocaleString()}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
          ) : (
            <PressScale
              style={styles.premiumCard}
              onPress={() => pedirMejora('Con Vecino Premium mandás el mismo pedido a hasta 3 proveedores y elegís el mejor presupuesto.')}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitulo}>📨 Pedir presupuesto a varios 💎</Text>
                <Text style={styles.premiumSub}>Mandalo a hasta 3 proveedores y compará</Text>
              </View>
              <Text style={styles.premiumFlecha}>›</Text>
            </PressScale>
          )
        )}

        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Servicio</Text>
            <Text style={styles.resumenValue}>${Number(precio).toLocaleString()}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Comisión (10%)</Text>
            <Text style={styles.resumenValue}>${Math.round(Number(precio) * 0.1).toLocaleString()}</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenTotal}>Total</Text>
            <Text style={styles.resumenTotalNum}>${Math.round(Number(precio) * 1.1).toLocaleString()}</Text>
          </View>
          {extras.length > 0 && (
            <Text style={styles.resumenNota}>
              + {extras.length} presupuesto{extras.length > 1 ? 's' : ''} más: solo pagás el que aceptes
            </Text>
          )}
        </View>

        <View style={styles.escrowNote}>
          <Text style={styles.escrowIco}>🔒</Text>
          <Text style={styles.escrowText}>Tu pago queda retenido hasta que confirmés que el trabajo fue completado.</Text>
        </View>

        <View style={{ height:120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmarBtn, urgente && styles.confirmarBtnUrgente, loading && { opacity:.7 }]}
          onPress={handleCrearPedido}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={[styles.confirmarText, urgente && { color: Colors.dark }]}>
                {urgente ? '⚡ ' : ''}Confirmar pedido · ${Math.round(Number(precio) * 1.1).toLocaleString()}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.cream },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:          { fontFamily: F.regular, fontSize:16, color:Colors.dark },
  title:             { fontSize:20, fontFamily: F.extrabold, color:Colors.dark },
  serviceCard:       { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'white', marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:3 },
  serviceIco:        { width:52, height:52, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceInfo:       { flex:1 },
  serviceName:       { fontSize:15, fontFamily: F.bold, color:Colors.dark, marginBottom:4 },
  servicePrice:      { fontSize:18, fontFamily: F.extrabold, color:Colors.dark },
  sectionLabel:      { fontSize:11, fontFamily: F.bold, color:'#6B6B6B', letterSpacing:1.5, paddingHorizontal:22, marginBottom:12 },
  horariosGrid:      { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:22, gap:10, marginBottom:24 },
  horarioBtn:        { paddingHorizontal:20, paddingVertical:12, borderRadius:12, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  horarioBtnActive:  { backgroundColor:Colors.dark, borderColor:Colors.dark },
  horarioText:       { fontSize:13, fontFamily: F.semibold, color:'#555' },
  horarioTextActive: { color:'white' },
  textarea:          { fontFamily: F.regular, backgroundColor:'white', borderRadius:16, padding:14, marginHorizontal:22, fontSize:13, color:Colors.dark, marginBottom:24, minHeight:100, borderWidth:1.5, borderColor:Colors.border },
  premiumCard:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'white', marginHorizontal:22, marginBottom:12, borderRadius:16, padding:14, borderWidth:1.5, borderColor:'rgba(255,210,63,.5)' },
  premiumCardActiva: { backgroundColor:'rgba(255,210,63,.12)', borderColor:'#FFD23F' },
  premiumTitulo:     { fontSize:14, fontFamily: F.bold, color:Colors.dark, marginBottom:2 },
  premiumSub:        { fontFamily: F.regular, fontSize:11, color:'#6B6B6B', lineHeight:15 },
  premiumFlecha:     { fontFamily: F.regular, fontSize:22, color:'#D4A017' },
  extrasWrap:        { marginTop:12, marginBottom:12 },
  extrasAyuda:       { fontFamily: F.regular, fontSize:12, color:'#6B6B6B', paddingHorizontal:22, marginTop:-6, marginBottom:10, lineHeight:17 },
  extraCard:         { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'white', marginHorizontal:22, marginBottom:8, borderRadius:14, padding:12, borderWidth:1.5, borderColor:Colors.border },
  extraCardActiva:   { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  check:             { width:22, height:22, borderRadius:7, borderWidth:2, borderColor:Colors.border, alignItems:'center', justifyContent:'center' },
  checkActivo:       { backgroundColor:Colors.primary, borderColor:Colors.primary },
  checkText:         { color:'white', fontSize:12, fontFamily: F.extrabold },
  extraNombreRow:    { flexDirection:'row', alignItems:'center', gap:6 },
  extraNombre:       { fontSize:13, fontFamily: F.bold, color:Colors.dark, flexShrink:1 },
  extraSub:          { fontFamily: F.regular, fontSize:11, color:'#6B6B6B', marginTop:2 },
  extraPrecio:       { fontSize:14, fontFamily: F.extrabold, color:Colors.dark },
  resumenNota:       { fontSize:11, fontFamily: F.semibold, color:Colors.primaryLight, marginTop:6 },
  confirmarBtnUrgente: { backgroundColor:'#FFD23F' },
  resumenCard:       { backgroundColor:'#1a1a1a', marginHorizontal:22, borderRadius:20, padding:20, marginBottom:14, marginTop:12 },
  resumenRow:        { flexDirection:'row', justifyContent:'space-between', paddingVertical:6 },
  resumenLabel:      { fontFamily: F.regular, fontSize:13, color:'#6B6B6B' },
  resumenValue:      { fontSize:13, color:'white', fontFamily: F.semibold },
  resumenDivider:    { height:1, backgroundColor:'rgba(255,255,255,.08)', marginVertical:8 },
  resumenTotal:      { fontFamily: F.regular, fontSize:14, color:'#6B6B6B' },
  resumenTotalNum:   { fontSize:26, fontFamily: F.extrabold, color:'white' },
  escrowNote:        { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#F0FDF4', marginHorizontal:22, borderRadius:14, padding:14, borderWidth:1.5, borderColor:Colors.greenLight },
  escrowIco:         { fontFamily: F.regular, fontSize:18 },
  escrowText:        { flex:1, fontSize:12, color:Colors.primary, lineHeight:18, fontFamily: F.medium },
  bottomBar:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.cream, padding:16, paddingBottom:32 },
  confirmarBtn:      { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center' },
  confirmarText:     { color:'white', fontSize:15, fontFamily: F.bold },
})
