import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { MAX_PRESUPUESTOS_EXTRA } from '../../constants/planes'
import { pedidosService } from '../../services/pedidos.service'
import { serviciosService } from '../../services/servicios.service'
import { FUENTES as F } from '../../constants/diseno'
import { alertaError, haptica } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { Icono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoriaInfo } from '../../constants/categorias'
import { usePlan } from '../../hooks/usePlan'
import { textoRating } from '../../utils/rating'
import { useTema, TemaTokens } from '../../store/temaStore'

const HORARIOS = ['8:00','9:30','11:00','14:00','15:30','17:00']
// Solo para pedidos urgentes: el proveedor lo recibe para hoy, lo antes posible
const LO_ANTES_POSIBLE = 'ya'

// "viernes 26 de septiembre" (se calcula al mostrar, no al cargar el archivo)
function diaDeManana() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function NuevoPedidoScreen() {
  const router = useRouter()
  const tema   = useTema()
  const styles = getStyles(tema)
  // El botón fijo de abajo respeta la barra de navegación del sistema (gestos o 3 botones)
  const insets = useSafeAreaInsets()
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
      pedirMejora('Los pedidos urgentes le llegan resaltados al proveedor y quedan primeros en su lista. Son parte de Vecino Premium.')
      return
    }
    haptica.seleccion()
    setUrgente(valor)
    // Urgente y para mañana no tenía sentido: se ofrece "hoy, lo antes posible"
    if (valor && !horario) setHorario(LO_ANTES_POSIBLE)
    if (!valor && horario === LO_ANTES_POSIBLE) setHorario('')
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
      const fecha = new Date()
      if (horario !== LO_ANTES_POSIBLE) {
        const [h, m] = horario.split(':')
        fecha.setDate(fecha.getDate() + 1)
        fecha.setHours(parseInt(h), parseInt(m), 0, 0)
      }

      const creado = await pedidosService.crearPedido({
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
          // Número real del pedido (antes se inventaba uno al azar en la pantalla de éxito)
          // Mismo formato que el chip del chat (#últimos 6), para que coincidan
          numero:    String(creado?.id ?? '').slice(-6).toUpperCase(),
          monto:     Number(precio),
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
          </PressScale>
          <Text style={styles.title}>Nuevo Pedido</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.serviceIco}><Icono nombre={categoriaInfo(categoria).icono} tamano={24} color={Colors.primary} /></View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{servicioNombre}</Text>
            <Text style={styles.servicePrice}>${Number(precio).toLocaleString('es-AR')}</Text>
          </View>
        </View>

        {/* ── URGENTE (Vecino Premium) ──
            Toda la tarjeta es tocable (antes solo el switch, que es chico). Va antes del
            horario porque cambia las opciones: suma "hoy, lo antes posible". */}
        <PressScale
          scaleTo={0.98}
          style={[styles.premiumCard, styles.urgenteCard, urgente && styles.premiumCardActiva]}
          onPress={() => alternarUrgente(!urgente)}
          accessibilityRole="switch"
          accessibilityState={{ checked: urgente }}
          accessibilityLabel="Pedido urgente"
          accessibilityHint={esPremium ? 'Le llega resaltado al proveedor' : 'Es parte de Vecino Premium'}
        >
          <View style={[styles.urgenteIco, urgente && styles.urgenteIcoActivo]}>
            <Icono nombre="flash" tamano={18} color={urgente ? Colors.dark : tema.dorado} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.premiumTituloFila}>
              <Text style={styles.premiumTitulo}>Pedido urgente</Text>
              {!esPremium && (
                <View style={styles.premiumChip}>
                  <Icono nombre="diamond" tamano={10} color={tema.dorado} />
                  <Text style={styles.premiumChipText}>Premium</Text>
                </View>
              )}
            </View>
            <Text style={styles.premiumSub}>
              {urgente
                ? 'Activado: le llega resaltado y queda primero en su lista. Podés pedirlo para hoy.'
                : 'Le llega resaltado al proveedor y queda primero en su lista'}
            </Text>
          </View>
          <Switch
            value={urgente}
            onValueChange={alternarUrgente}
            trackColor={{ false: tema.border, true: 'rgba(255,210,63,.6)' }}
            thumbColor={urgente ? '#D4A017' : tema.esOscuro ? '#9A9A9A' : '#cccccc'}
            importantForAccessibility="no"
          />
        </PressScale>

        <Text style={styles.sectionLabel}>ELEGÍ EL HORARIO</Text>
        {urgente && (
          <TouchableOpacity
            style={[styles.yaBtn, horario === LO_ANTES_POSIBLE && styles.yaBtnActivo]}
            onPress={() => { haptica.seleccion(); setHorario(LO_ANTES_POSIBLE) }}
            accessibilityRole="radio"
            accessibilityState={{ selected: horario === LO_ANTES_POSIBLE }}
          >
            <Icono nombre="flash" tamano={16} color={horario === LO_ANTES_POSIBLE ? Colors.dark : tema.dorado} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.yaTitulo, horario === LO_ANTES_POSIBLE && { color: Colors.dark }]}>Hoy, lo antes posible</Text>
              <Text style={[styles.yaSub, horario === LO_ANTES_POSIBLE && { color: 'rgba(26,26,26,.7)' }]}>El proveedor coordina la hora con vos por el chat</Text>
            </View>
          </TouchableOpacity>
        )}
        {/* Los horarios fijos son para mañana: antes no se decía qué día */}
        <Text style={styles.diaPedido}>{urgente ? 'O para mañana' : 'Para mañana'}, {diaDeManana()}</Text>
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
          placeholderTextColor={tema.subTexto}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

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
                        {elegido && <Icono nombre="checkmark" tamano={14} color="white" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.extraNombreRow}>
                          <Text style={styles.extraNombre} numberOfLines={1}>{s.proveedor?.nombre}</Text>
                          <PlanBadge plan={s.proveedor?.plan} rol="PROVEEDOR" oscuro={tema.esOscuro} />
                        </View>
                        <View style={styles.extraSubFila}>
                          <Text style={styles.extraSub} numberOfLines={1}>{s.nombre} ·</Text>
                          <Icono nombre="star" tamano={11} color="#F5B301" />
                          <Text style={styles.extraSub}>{textoRating(s.proveedor?.rating)}</Text>
                        </View>
                      </View>
                      <Text style={styles.extraPrecio}>${s.precio?.toLocaleString('es-AR')}</Text>
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
                <View style={styles.premiumTituloFila}>
                  <Icono nombre="people-outline" tamano={15} color={tema.dorado} />
                  <Text style={styles.premiumTitulo}>Pedir presupuesto a varios</Text>
                  <Icono nombre="diamond-outline" tamano={13} color={tema.dorado} />
                </View>
                <Text style={styles.premiumSub}>Mandalo a hasta 3 proveedores y compará</Text>
              </View>
              <Icono nombre="chevron-forward" tamano={20} color={tema.dorado} />
            </PressScale>
          )
        )}

        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Servicio</Text>
            <Text style={styles.resumenValue}>${Number(precio).toLocaleString('es-AR')}</Text>
          </View>
          {/* El backend cobra el precio del servicio y la comisión (10%) se le descuenta al
              proveedor: antes acá se sumaba al total y el cliente veía un monto que no se cobraba */}
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Comisión</Text>
            <Text style={styles.resumenValue}>Sin costo para vos</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenTotal}>Total</Text>
            <Text style={styles.resumenTotalNum}>${Number(precio).toLocaleString('es-AR')}</Text>
          </View>
          {extras.length > 0 && (
            <Text style={styles.resumenNota}>
              + {extras.length} presupuesto{extras.length > 1 ? 's' : ''} más: solo pagás el que aceptes
            </Text>
          )}
        </View>

        <View style={styles.escrowNote}>
          <Icono nombre="shield-checkmark" tamano={18} color={Colors.primary} />
          <Text style={styles.escrowText}>Tu pago queda retenido hasta que confirmés que el trabajo fue completado.</Text>
        </View>

        <View style={{ height:120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 16 + Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.confirmarBtn, urgente && styles.confirmarBtnUrgente, loading && { opacity:.7 }]}
          onPress={handleCrearPedido}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={[styles.confirmarText, urgente && { color: Colors.dark }]}>
                Confirmar{urgente ? ' urgente' : ' pedido'} · ${Number(precio).toLocaleString('es-AR')}
              </Text>
          }
        </TouchableOpacity>
      </View>
      <FondoBarraEstado color={tema.bg} />
    </KeyboardAvoidingView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:         { flex:1, backgroundColor:tema.bg },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:tema.overlay, alignItems:'center', justifyContent:'center' },
  title:             { fontSize:20, fontFamily: F.extrabold, color:tema.texto },
  serviceCard:       { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:tema.card, marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:3 },
  serviceIco:        { width:52, height:52, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceInfo:       { flex:1 },
  serviceName:       { fontSize:15, fontFamily: F.bold, color:tema.texto, marginBottom:4 },
  servicePrice:      { fontSize:18, fontFamily: F.extrabold, color:tema.texto },
  sectionLabel:      { fontSize:11, fontFamily: F.bold, color:tema.subTexto, letterSpacing:1.5, paddingHorizontal:22, marginBottom:12 },
  diaPedido:         { fontSize:13, fontFamily: F.semibold, color:tema.texto, paddingHorizontal:22, marginTop:-6, marginBottom:12 },
  horariosGrid:      { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:22, gap:10, marginBottom:24 },
  horarioBtn:        { paddingHorizontal:20, paddingVertical:12, borderRadius:12, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  horarioBtnActive:  { backgroundColor:tema.seleccion, borderColor:tema.seleccion },
  horarioText:       { fontSize:13, fontFamily: F.semibold, color:tema.subTexto },
  horarioTextActive: { color:'white' },
  textarea:          { fontFamily: F.regular, backgroundColor:tema.card, borderRadius:16, padding:14, marginHorizontal:22, fontSize:13, color:tema.texto, marginBottom:24, minHeight:100, borderWidth:1.5, borderColor:tema.border },
  premiumCard:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:tema.card, marginHorizontal:22, marginBottom:12, borderRadius:16, padding:14, borderWidth:1.5, borderColor:'rgba(255,210,63,.5)' },
  premiumCardActiva: { backgroundColor:tema.esOscuro ? 'rgba(255,210,63,.1)' : 'rgba(255,210,63,.12)', borderColor:'#FFD23F' },
  urgenteCard:       { marginBottom:24, paddingVertical:16 },
  urgenteIco:        { width:40, height:40, borderRadius:12, backgroundColor:'rgba(255,210,63,.18)', alignItems:'center', justifyContent:'center' },
  urgenteIcoActivo:  { backgroundColor:'#FFD23F' },
  premiumChip:       { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(255,210,63,.18)', paddingHorizontal:7, paddingVertical:2, borderRadius:100 },
  premiumChipText:   { fontSize:10, fontFamily: F.bold, color:tema.dorado },
  yaBtn:             { flexDirection:'row', alignItems:'center', gap:10, marginHorizontal:22, marginBottom:16, padding:14, borderRadius:14, borderWidth:1.5, borderColor:'rgba(255,210,63,.5)', backgroundColor:tema.card },
  yaBtnActivo:       { backgroundColor:'#FFD23F', borderColor:'#FFD23F' },
  yaTitulo:          { fontSize:14, fontFamily: F.bold, color:tema.texto },
  yaSub:             { fontSize:11, fontFamily: F.regular, color:tema.subTexto, marginTop:1 },
  premiumTituloFila: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:2 },
  premiumTitulo:     { fontSize:14, fontFamily: F.bold, color:tema.texto },
  extraSubFila:      { flexDirection:'row', alignItems:'center', gap:3, marginTop:2 },
  premiumSub:        { fontFamily: F.regular, fontSize:11, color:tema.subTexto, lineHeight:15 },
  extrasWrap:        { marginTop:12, marginBottom:12 },
  extrasAyuda:       { fontFamily: F.regular, fontSize:12, color:tema.subTexto, paddingHorizontal:22, marginTop:-6, marginBottom:10, lineHeight:17 },
  extraCard:         { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:tema.card, marginHorizontal:22, marginBottom:8, borderRadius:14, padding:12, borderWidth:1.5, borderColor:tema.border },
  extraCardActiva:   { borderColor:Colors.primary, backgroundColor:tema.esOscuro ? 'rgba(26,158,92,.12)' : '#F0FDF4' },
  check:             { width:22, height:22, borderRadius:7, borderWidth:2, borderColor:tema.border, alignItems:'center', justifyContent:'center' },
  checkActivo:       { backgroundColor:Colors.primary, borderColor:Colors.primary },
  extraNombreRow:    { flexDirection:'row', alignItems:'center', gap:6 },
  extraNombre:       { fontSize:13, fontFamily: F.bold, color:tema.texto, flexShrink:1 },
  extraSub:          { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  extraPrecio:       { fontSize:14, fontFamily: F.extrabold, color:tema.texto },
  resumenNota:       { fontSize:11, fontFamily: F.semibold, color:Colors.primaryLight, marginTop:6 },
  confirmarBtnUrgente: { backgroundColor:'#FFD23F' },
  // En oscuro el borde la separa del fondo (#1a1a1a sobre #0d0d0d casi no se distingue)
  resumenCard:       { backgroundColor:'#1a1a1a', borderWidth:1, borderColor:tema.esOscuro ? tema.border : 'transparent', marginHorizontal:22, borderRadius:20, padding:20, marginBottom:14, marginTop:12 },
  resumenRow:        { flexDirection:'row', justifyContent:'space-between', paddingVertical:6 },
  resumenLabel:      { fontFamily: F.regular, fontSize:13, color:'rgba(255,255,255,.65)' },
  resumenValue:      { fontSize:13, color:'white', fontFamily: F.semibold },
  resumenDivider:    { height:1, backgroundColor:'rgba(255,255,255,.08)', marginVertical:8 },
  resumenTotal:      { fontFamily: F.regular, fontSize:14, color:'rgba(255,255,255,.65)' },
  resumenTotalNum:   { fontSize:26, fontFamily: F.extrabold, color:'white' },
  escrowNote:        { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:tema.esOscuro ? 'rgba(26,158,92,.1)' : '#F0FDF4', marginHorizontal:22, borderRadius:14, padding:14, borderWidth:1.5, borderColor:tema.esOscuro ? 'rgba(26,158,92,.3)' : Colors.greenLight },
  escrowText:        { flex:1, fontSize:12, color:tema.esOscuro ? Colors.primaryLight : Colors.primary, lineHeight:18, fontFamily: F.medium },
  bottomBar:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:tema.bg, padding:16, paddingBottom:32 },
  confirmarBtn:      { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center' },
  confirmarText:     { color:'white', fontSize:15, fontFamily: F.bold },
})
