import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Switch, ActivityIndicator,
  Dimensions, Alert, RefreshControl
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { pedidosService } from '../../services/pedidos.service'
import { usuariosService } from '../../services/usuarios.service'
import { PressScale } from '../../components/ui/PressScale'
import { FUENTES as F } from '../../constants/diseno'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { usePlan } from '../../hooks/usePlan'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { ContadorAnimado } from '../../components/ui/ContadorAnimado'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import { categoriaInfo } from '../../constants/categorias'
import { textoRating } from '../../utils/rating'

const { width } = Dimensions.get('window')

export default function ProveedorDashboard() {
  const router   = useRouter()
  const { usuario, token, setUsuario } = useAuthStore()
  const [pedidos, setPedidos]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [disponible, setDisponible] = useState(usuario?.activo ?? true)
  const [guardandoDisp, setGuardandoDisp] = useState(false)
  const [refrescando, setRefrescando] = useState(false)
  const plan = usePlan()

  // Animaciones
  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(30)).current
  const scaleAnim   = useRef(new Animated.Value(0.95)).current
  const cardAnims   = [0,1,2,3].map(() => useRef(new Animated.Value(0)).current)

  // Al volver de "Ver pedidos" (aceptar, completar...) el resumen quedaba desactualizado
  useFocusEffect(useCallback(() => { cargarPedidos() }, []))

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:700, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:700, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, tension:50, friction:8, useNativeDriver:true }),
    ]).start()

    // Cards en cascada
    cardAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(300 + i * 100),
        Animated.spring(anim, { toValue:1, tension:60, friction:8, useNativeDriver:true }),
      ]).start()
    })
  }, [])

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos()
      setPedidos(data)
    } catch { setPedidos([]) }
    finally { setLoading(false) }
  }

  async function alRefrescar() {
    setRefrescando(true)
    await cargarPedidos()
    setRefrescando(false)
  }

  async function cambiarDisponibilidad(valor: boolean) {
    if (!usuario) return
    setDisponible(valor) // optimista
    setGuardandoDisp(true)
    try {
      const usuarioActualizado = await usuariosService.editarPerfil(usuario.id, { activo: valor })
      setUsuario(usuarioActualizado, token!)
    } catch (err: any) {
      setDisponible(!valor) // revertimos si falló
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo actualizar tu disponibilidad')
    } finally {
      setGuardandoDisp(false)
    }
  }

  const pendientes  = pedidos.filter(p => p.estado === 'PENDIENTE')
  const enCurso     = pedidos.filter(p => p.estado === 'EN_CURSO' || p.estado === 'ACEPTADO')
  const completados = pedidos.filter(p => p.estado === 'COMPLETADO')

  // Ganado este mes vs. mes anterior, en base a la fecha en que se creó cada pedido completado
  // (proxy razonable: no tenemos un timestamp de "completadoEn" en el pedido)
  const ahora = new Date()
  const inicioEsteMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const gananciasPorMes = (desde: Date, hasta: Date) =>
    completados
      .filter(p => { const f = new Date(p.creadoEn); return f >= desde && f < hasta })
      .reduce((acc, p) => acc + (p.montoTotal * 0.9), 0)
  const gananciasEsteMes = gananciasPorMes(inicioEsteMes, ahora)
  const gananciasMesAnterior = gananciasPorMes(inicioMesAnterior, inicioEsteMes)
  const variacionMensual = gananciasMesAnterior > 0
    ? Math.round(((gananciasEsteMes - gananciasMesAnterior) / gananciasMesAnterior) * 100)
    : null


  // Accesos rápidos del panel: cada uno con su ícono y color
  const ACCIONES: { icono: NombreIcono; label: string; ruta: any; estilo: any; color: string; badge?: number; candado?: boolean }[] = [
    { icono: 'receipt-outline',   label: 'Ver pedidos',    ruta: '/proveedor-panel/pedidos',        estilo: styles.accionCardGreen,  color: Colors.primaryLight, badge: pendientes.length },
    { icono: 'briefcase-outline', label: 'Mis servicios',  ruta: '/proveedor-panel/servicios',      estilo: styles.accionCardBlue,   color: '#74B9FF' },
    { icono: 'add-circle-outline', label: 'Nuevo servicio', ruta: '/proveedor-panel/nuevo-servicio', estilo: styles.accionCardYellow, color: '#FFD23F' },
    { icono: 'person-outline',    label: 'Mi perfil',      ruta: '/(tabs)/perfil',                  estilo: styles.accionCardPurple, color: '#A29BFE' },
    { icono: 'stats-chart-outline', label: 'Estadísticas', ruta: '/proveedor-panel/estadisticas',   estilo: styles.accionCardBlue,   color: '#74B9FF', candado: plan.nivel < 1 },
    { icono: 'diamond-outline',   label: 'Planes',         ruta: '/planes',                         estilo: styles.accionCardGold,   color: '#FFD23F' },
  ]

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={Colors.primaryLight} colors={[Colors.primaryLight]} />
        }
      >

        {/* ── HERO HEADER ── */}
        <Animated.View style={[styles.hero, { opacity:fadeAnim }]}>

          {/* Decoración de fondo */}
          <View style={styles.heroBg} />
          {/* Halo fijo y sutil: antes latía entre 30% y 80% y tapaba el encabezado */}
          <View style={styles.heroGlow} />
          <View style={styles.heroGrid} />

          {/* Top bar */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Panel de trabajo</Text>
              <Text style={styles.heroNombre}>Hola, {usuario?.nombre?.split(' ')[0]}</Text>
              <PlanBadge plan={plan.plan} rol="PROVEEDOR" oscuro style={{ marginTop: 6 }} />
            </View>
            <TouchableOpacity
              style={styles.heroAvatar}
              onPress={() => router.push('/(tabs)/perfil')}
            >
              <FotoPerfil ruta={usuario?.avatar} nombre={usuario?.nombre} radio={15} estiloTexto={styles.heroAvatarText} />
              <View style={styles.heroAvatarBadge} />
            </TouchableOpacity>
          </View>

          {/* Ganancias destacadas */}
          <Animated.View style={[styles.gananciaCard, { transform:[{scale:scaleAnim}] }]}>
            <View style={styles.gananciaLeft}>
              <Text style={styles.gananciaLabel}>Ganado este mes</Text>
              {/* Momento principal del panel: la cifra cuenta hasta el total del mes */}
              <ContadorAnimado style={styles.gananciaNum} valor={loading ? null : Math.round(gananciasEsteMes)} prefijo="$" />
              {variacionMensual !== null && (
                <View style={[styles.gananciaBadge, variacionMensual < 0 && styles.gananciaBadgeBaja]}>
                  <Icono
                    nombre={variacionMensual >= 0 ? 'trending-up' : 'trending-down'}
                    tamano={13}
                    color={variacionMensual >= 0 ? Colors.primaryLight : '#FF7675'}
                  />
                  <Text style={[styles.gananciaBadgeText, variacionMensual < 0 && { color: '#FF7675' }]}>
                    {variacionMensual >= 0 ? '+' : ''}{variacionMensual}% vs mes anterior
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.gananciaRight}>
              <Icono nombre="wallet-outline" tamano={30} color={Colors.primaryLight} />
            </View>
          </Animated.View>

          {/* Toggle disponibilidad */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleDot, { backgroundColor: disponible ? Colors.primaryLight : '#FF7675' }]} />
              <View>
                <Text style={styles.toggleTitle}>
                  {disponible ? 'Estoy disponible' : 'No disponible'}
                </Text>
                <Text style={styles.toggleSub}>
                  {disponible ? 'Recibís pedidos nuevos' : 'No recibirás pedidos'}
                </Text>
              </View>
            </View>
            <Switch
              value={disponible}
              onValueChange={cambiarDisponibilidad}
              disabled={guardandoDisp}
              trackColor={{ false:'rgba(255,255,255,.1)', true:'rgba(61,214,140,.4)' }}
              thumbColor={disponible ? Colors.primaryLight : '#666'}
            />
          </View>

          {/* Plan */}
          <PressScale
            style={styles.planStrip}
            onPress={() => router.push('/planes')}
            accessibilityLabel={plan.plan === 'GRATIS' ? 'Ver planes' : 'Ver mi plan'}
          >
            <Icono nombre={plan.plan === 'GRATIS' ? 'rocket-outline' : plan.info.icono} tamano={18} color="#FFD23F" />
            <Text style={styles.planStripText} numberOfLines={2}>
              {plan.plan === 'GRATIS'
                ? 'Plan Gratis · Pasate a Pro y aparecé primero'
                : `Plan ${plan.info.nombre}${plan.venceEn ? ` · hasta el ${plan.venceEn.toLocaleDateString('es-AR')}` : ''}`}
            </Text>
            <Text style={styles.planStripCta}>{plan.plan === 'GRATIS' ? 'Mejorar' : 'Ver'}</Text>
            <Icono nombre="chevron-forward" tamano={14} color="#FFD23F" />
          </PressScale>
        </Animated.View>

        {/* ── MÉTRICAS ── */}
        <View style={styles.metricasSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.metricasGrid}>
            {([
              { ico:'layers-outline', num:pedidos.length, label:'Total', color:Colors.primaryLight },
              { ico:'time-outline', num:pendientes.length, label:'Pendientes', color:'#FFD23F' },
              { ico:'construct-outline', num:enCurso.length, label:'En curso', color:'#74B9FF' },
              { ico:'star', num:textoRating(usuario?.rating, '–'), label:'Rating', color:'#FFD23F' },
            ] as { ico: NombreIcono; num: any; label: string; color: string }[]).map((m, i) => (
              <Animated.View
                key={i}
                style={[styles.metricaCard, {
                  opacity: cardAnims[i],
                  transform:[{ translateY: cardAnims[i].interpolate({ inputRange:[0,1], outputRange:[20,0] }) }]
                }]}
              >
                <Icono nombre={m.ico} tamano={20} color={m.color} />
                <Text style={[styles.metricaNum, { color: m.color }]}>{m.num}</Text>
                <Text style={styles.metricaLabel}>{m.label}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── ACCIONES RÁPIDAS ── */}
        <View style={styles.accionesSection}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.accionesGrid}>
            {ACCIONES.map(a => (
              <PressScale
                key={a.label}
                style={[styles.accionCard, a.estilo]}
                onPress={() => router.push(a.ruta)}
                accessibilityLabel={a.badge ? `${a.label}, ${a.badge} pendientes` : a.label}
              >
                <View style={styles.accionIco}><Icono nombre={a.icono} tamano={24} color={a.color} /></View>
                <Text style={styles.accionLabel}>{a.label}</Text>
                {!!a.badge && (
                  <View style={styles.accionBadge}>
                    <Text style={styles.accionBadgeText}>{a.badge}</Text>
                  </View>
                )}
                {a.candado && <Icono nombre="lock-closed" tamano={14} color="rgba(255,255,255,.5)" style={styles.accionLock} />}
              </PressScale>
            ))}
          </View>
        </View>

        {/* ── PEDIDOS RECIENTES ── */}
        <View style={styles.pedidosSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Pedidos recientes</Text>
            <TouchableOpacity onPress={() => router.push('/proveedor-panel/pedidos')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primaryLight} style={{ marginTop:20 }} />
          ) : pedidos.length === 0 ? (
            <View style={styles.empty}>
              <Icono nombre="file-tray-outline" tamano={44} color="rgba(255,255,255,.3)" style={styles.emptyIco} />
              <Text style={styles.emptyTitle}>Sin pedidos todavía</Text>
              <Text style={styles.emptySub}>Cuando un cliente te contrate aparecerá acá</Text>
            </View>
          ) : (
            pedidos.slice(0,4).map((p, i) => {
              return (
                <Animated.View key={p.id} style={[styles.pedidoCard, {
                  opacity: cardAnims[Math.min(i, 3)],
                }]}>
                  <TouchableOpacity
                    style={styles.pedidoInner}
                    onPress={() => router.push('/proveedor-panel/pedidos')}
                  >
                    <View style={styles.pedidoIco}>
                      <Icono nombre={categoriaInfo(p.servicio?.categoria).icono} tamano={20} color={Colors.primaryLight} />
                    </View>
                    <View style={styles.pedidoInfo}>
                      <Text style={styles.pedidoServicio}>{p.servicio?.nombre}</Text>
                      <View style={styles.pedidoMeta}>
                        <View style={styles.clienteMini}>
                          <FotoPerfil ruta={p.cliente?.avatar} nombre={p.cliente?.nombre} radio={8} estiloTexto={styles.clienteMiniTexto} />
                        </View>
                        <Text style={styles.pedidoCliente}>{p.cliente?.nombre}</Text>
                      </View>
                      <View style={styles.pedidoMeta}>
                        <Icono nombre="calendar-outline" tamano={11} color="rgba(255,255,255,.4)" />
                        <Text style={styles.pedidoFecha}>
                          {new Date(p.fecha).toLocaleDateString('es-AR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pedidoRight}>
                      <Text style={styles.pedidoMonto}>${p.montoTotal?.toLocaleString('es-AR')}</Text>
                      <EstadoBadge estado={p.estado} oscuro />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )
            })
          )}
        </View>

        <View style={{ height:100 }} />
      </ScrollView>
      <FondoBarraEstado color="#0D0D0D" />
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex:1, backgroundColor:'#0D0D0D' },

  // Hero
  hero:               { backgroundColor:'#0D0D0D', padding:22, paddingTop:56, paddingBottom:28, overflow:'hidden' },
  heroBg:             { position:'absolute', width:width*1.5, height:width*1.5, borderRadius:width, backgroundColor:'#1A9E5C', opacity:.04, top:-width*0.5, right:-width*0.3 },
  heroGlow:           { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#1A9E5C', top:20, right:20, opacity:.08 },
  heroGrid:           { position:'absolute', inset:0, opacity:.03 },
  heroTop:            { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  heroGreeting:       { fontSize:11, color:'rgba(255,255,255,.6)', fontFamily: F.semibold, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  heroNombre:         { fontSize:26, fontFamily: F.extrabold, color:'white' },
  heroAvatar:         { width:46, height:46, borderRadius:15, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', position:'relative' },
  heroAvatarText:     { color:'white', fontSize:18, fontFamily: F.extrabold },
  heroAvatarBadge:    { position:'absolute', bottom:2, right:2, width:10, height:10, borderRadius:5, backgroundColor:Colors.primaryLight, borderWidth:2, borderColor:'#0D0D0D' },

  // Ganancia card
  gananciaCard:       { backgroundColor:'rgba(26,158,92,.12)', borderRadius:20, padding:20, marginBottom:14, borderWidth:1, borderColor:'rgba(61,214,140,.2)', flexDirection:'row', alignItems:'center' },
  gananciaLeft:       { flex:1 },
  gananciaLabel:      { fontSize:11, color:'rgba(255,255,255,.6)', fontFamily: F.semibold, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  gananciaNum:        { fontSize:36, fontFamily: F.extrabold, color:'white', marginBottom:8 },
  gananciaBadge:      { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(61,214,140,.2)', alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  gananciaBadgeBaja:  { backgroundColor:'rgba(255,118,117,.18)' },
  gananciaBadgeText:  { fontSize:10, color:Colors.primaryLight, fontFamily: F.bold },
  gananciaRight:      { alignItems:'center', justifyContent:'center' },

  // Toggle
  toggleCard:         { backgroundColor:'rgba(255,255,255,.05)', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'rgba(255,255,255,.08)' },
  toggleLeft:         { flexDirection:'row', alignItems:'center', gap:10 },
  toggleDot:          { width:10, height:10, borderRadius:5 },
  toggleTitle:        { fontSize:14, fontFamily: F.bold, color:'white', marginBottom:2 },
  toggleSub:          { fontFamily: F.regular, fontSize:11, color:'rgba(255,255,255,.6)' },

  // Secciones
  metricasSection:    { padding:22, paddingTop:24, paddingBottom:0 },
  accionesSection:    { padding:22, paddingTop:24, paddingBottom:0 },
  pedidosSection:     { padding:22, paddingTop:24 },
  sectionTitle:       { fontSize:16, fontFamily: F.extrabold, color:'white', marginBottom:14 },
  sectionRow:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionLink:        { fontSize:12, color:Colors.primaryLight, fontFamily: F.bold },

  // Métricas
  metricasGrid:       { flexDirection:'row', gap:10 },
  metricaCard:        { flex:1, backgroundColor:'rgba(255,255,255,.05)', borderRadius:16, padding:14, alignItems:'center', gap:6, borderWidth:1, borderColor:'rgba(255,255,255,.07)' },
  metricaNum:         { fontSize:22, fontFamily: F.extrabold, color:'white' },
  metricaLabel:       { fontSize:9, color:'rgba(255,255,255,.6)', fontFamily: F.semibold, textAlign:'center' },

  // Acciones
  accionesGrid:       { flexDirection:'row', flexWrap:'wrap', gap:10 },
  accionCard:         { width:(width-44-10)/2, borderRadius:18, padding:18, gap:10, position:'relative', borderWidth:1 },
  accionCardGreen:    { backgroundColor:'rgba(26,158,92,.12)', borderColor:'rgba(61,214,140,.2)' },
  accionCardBlue:     { backgroundColor:'rgba(116,185,255,.1)', borderColor:'rgba(116,185,255,.2)' },
  accionCardYellow:   { backgroundColor:'rgba(255,210,63,.1)', borderColor:'rgba(255,210,63,.2)' },
  accionCardPurple:   { backgroundColor:'rgba(162,155,254,.1)', borderColor:'rgba(162,155,254,.2)' },
  accionCardGold:     { backgroundColor:'rgba(255,210,63,.08)', borderColor:'rgba(255,210,63,.25)' },
  accionLock:         { position:'absolute', top:14, right:14 },

  // Plan
  planStrip:          { flexDirection:'row', alignItems:'center', gap:10, marginTop:10, backgroundColor:'rgba(255,210,63,.08)', borderRadius:16, paddingVertical:12, paddingHorizontal:14, borderWidth:1, borderColor:'rgba(255,210,63,.2)' },
  planStripText:      { flex:1, fontSize:12, fontFamily: F.bold, color:'rgba(255,255,255,.8)' },
  planStripCta:       { fontSize:12, fontFamily: F.extrabold, color:'#FFD23F' },
  accionIco:          { width:48, height:48, borderRadius:14, backgroundColor:'rgba(255,255,255,.08)', alignItems:'center', justifyContent:'center' },
  accionLabel:        { fontSize:13, fontFamily: F.bold, color:'white' },
  accionBadge:        { position:'absolute', top:12, right:12, width:20, height:20, borderRadius:10, backgroundColor:'#FF4757', alignItems:'center', justifyContent:'center' },
  accionBadgeText:    { color:'white', fontSize:10, fontFamily: F.extrabold },

  // Pedidos
  pedidoCard:         { backgroundColor:'rgba(255,255,255,.04)', borderRadius:18, marginBottom:10, borderWidth:1, borderColor:'rgba(255,255,255,.07)', overflow:'hidden' },
  pedidoInner:        { flexDirection:'row', alignItems:'center', gap:12, padding:16 },
  pedidoIco:          { width:46, height:46, borderRadius:14, backgroundColor:'rgba(26,158,92,.15)', alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1, gap:3 },
  pedidoServicio:     { fontSize:14, fontFamily: F.bold, color:'white' },
  pedidoMeta:         { flexDirection:'row', alignItems:'center', gap:5 },
  pedidoCliente:      { fontFamily: F.regular, fontSize:11, color:'rgba(255,255,255,.55)' },
  clienteMini:        { width:16, height:16, borderRadius:8, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  clienteMiniTexto:   { color:'white', fontSize:8, fontFamily: F.bold },
  pedidoFecha:        { fontFamily: F.regular, fontSize:11, color:'rgba(255,255,255,.55)' },
  pedidoRight:        { alignItems:'flex-end', gap:6 },
  pedidoMonto:        { fontSize:16, fontFamily: F.extrabold, color:'white' },

  // Empty
  empty:              { alignItems:'center', paddingVertical:40 },
  emptyIco:           { marginBottom:12 },
  emptyTitle:         { fontSize:16, fontFamily: F.extrabold, color:'rgba(255,255,255,.75)', marginBottom:6 },
  emptySub:           { fontFamily: F.regular, fontSize:13, color:'rgba(255,255,255,.55)', textAlign:'center' },
})
