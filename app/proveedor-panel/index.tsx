import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Switch, ActivityIndicator,
  Dimensions, StatusBar
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { pedidosService } from '../../services/pedidos.service'

const { width } = Dimensions.get('window')

export default function ProveedorDashboard() {
  const router   = useRouter()
  const usuario  = useAuthStore(s => s.usuario)
  const [pedidos, setPedidos]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [disponible, setDisponible] = useState(true)

  // Animaciones
  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(30)).current
  const scaleAnim   = useRef(new Animated.Value(0.95)).current
  const glowAnim    = useRef(new Animated.Value(0)).current
  const cardAnims   = [0,1,2,3].map(() => useRef(new Animated.Value(0)).current)

  useEffect(() => {
    cargarPedidos()

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

    // Glow pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue:1, duration:2000, useNativeDriver:true }),
        Animated.timing(glowAnim, { toValue:0, duration:2000, useNativeDriver:true }),
      ])
    ).start()
  }, [])

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos()
      setPedidos(data)
    } catch { setPedidos([]) }
    finally { setLoading(false) }
  }

  const pendientes  = pedidos.filter(p => p.estado === 'PENDIENTE')
  const enCurso     = pedidos.filter(p => p.estado === 'EN_CURSO' || p.estado === 'ACEPTADO')
  const completados = pedidos.filter(p => p.estado === 'COMPLETADO')
  const ganancias   = completados.reduce((acc, p) => acc + (p.montoTotal * 0.9), 0)

  const glowOpacity = glowAnim.interpolate({ inputRange:[0,1], outputRange:[0.3, 0.8] })

  const ESTADO_CONFIG: Record<string, any> = {
    PENDIENTE: { color:'#FFD23F', bg:'rgba(255,210,63,.15)', label:'⏳ Pendiente' },
    ACEPTADO:  { color:Colors.primaryLight, bg:'rgba(61,214,140,.15)', label:'✓ Aceptado' },
    EN_CURSO:  { color:'#74B9FF', bg:'rgba(116,185,255,.15)', label:'🔧 En curso' },
    COMPLETADO:{ color:Colors.primaryLight, bg:'rgba(61,214,140,.15)', label:'✅ Completado' },
    CANCELADO: { color:'#FF7675', bg:'rgba(255,118,117,.15)', label:'✕ Cancelado' },
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ── */}
        <Animated.View style={[styles.hero, { opacity:fadeAnim }]}>

          {/* Decoración de fondo */}
          <View style={styles.heroBg} />
          <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />
          <View style={styles.heroGrid} />

          {/* Top bar */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Panel de trabajo</Text>
              <Text style={styles.heroNombre}>Hola, {usuario?.nombre?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.heroAvatar}
              onPress={() => router.push('/(tabs)/perfil')}
            >
              <Text style={styles.heroAvatarText}>
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </Text>
              <View style={styles.heroAvatarBadge} />
            </TouchableOpacity>
          </View>

          {/* Ganancias destacadas */}
          <Animated.View style={[styles.gananciaCard, { transform:[{scale:scaleAnim}] }]}>
            <View style={styles.gananciaLeft}>
              <Text style={styles.gananciaLabel}>Ganado este mes</Text>
              <Text style={styles.gananciaNum}>
                ${Math.round(ganancias).toLocaleString()}
              </Text>
              <View style={styles.gananciaBadge}>
                <Text style={styles.gananciaBadgeText}>↑ +12% vs mes anterior</Text>
              </View>
            </View>
            <View style={styles.gananciaRight}>
              <Text style={styles.gananciaIco}>💰</Text>
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
              onValueChange={setDisponible}
              trackColor={{ false:'rgba(255,255,255,.1)', true:'rgba(61,214,140,.4)' }}
              thumbColor={disponible ? Colors.primaryLight : '#666'}
            />
          </View>
        </Animated.View>

        {/* ── MÉTRICAS ── */}
        <View style={styles.metricasSection}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.metricasGrid}>
            {[
              { ico:'📋', num:pedidos.length, label:'Total', color:Colors.primaryLight, delay:0 },
              { ico:'⏳', num:pendientes.length, label:'Pendientes', color:'#FFD23F', delay:1 },
              { ico:'🔧', num:enCurso.length, label:'En curso', color:'#74B9FF', delay:2 },
              { ico:'⭐', num:usuario?.rating?.toFixed(1) ?? '0.0', label:'Rating', color:'#FF7675', delay:3 },
            ].map((m, i) => (
              <Animated.View
                key={i}
                style={[styles.metricaCard, {
                  opacity: cardAnims[i],
                  transform:[{ translateY: cardAnims[i].interpolate({ inputRange:[0,1], outputRange:[20,0] }) }]
                }]}
              >
                <Text style={styles.metricaIco}>{m.ico}</Text>
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
            <TouchableOpacity
              style={[styles.accionCard, styles.accionCardGreen]}
              onPress={() => router.push('/proveedor-panel/pedidos')}
            >
              <View style={styles.accionIco}><Text style={{fontSize:26}}>📋</Text></View>
              <Text style={styles.accionLabel}>Ver pedidos</Text>
              {pendientes.length > 0 && (
                <View style={styles.accionBadge}>
                  <Text style={styles.accionBadgeText}>{pendientes.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accionCard, styles.accionCardBlue]}
              onPress={() => router.push('/proveedor-panel/servicios')}
            >
              <View style={styles.accionIco}><Text style={{fontSize:26}}>🔧</Text></View>
              <Text style={styles.accionLabel}>Mis servicios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accionCard, styles.accionCardYellow]}
              onPress={() => router.push('/proveedor-panel/nuevo-servicio')}
            >
              <View style={styles.accionIco}><Text style={{fontSize:26}}>➕</Text></View>
              <Text style={styles.accionLabel}>Nuevo servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accionCard, styles.accionCardPurple]}
              onPress={() => router.push('/(tabs)/perfil')}
            >
              <View style={styles.accionIco}><Text style={{fontSize:26}}>👤</Text></View>
              <Text style={styles.accionLabel}>Mi perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PEDIDOS RECIENTES ── */}
        <View style={styles.pedidosSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Pedidos recientes</Text>
            <TouchableOpacity onPress={() => router.push('/proveedor-panel/pedidos')}>
              <Text style={styles.sectionLink}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primaryLight} style={{ marginTop:20 }} />
          ) : pedidos.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>📭</Text>
              <Text style={styles.emptyTitle}>Sin pedidos todavía</Text>
              <Text style={styles.emptySub}>Cuando un cliente te contrate aparecerá acá</Text>
            </View>
          ) : (
            pedidos.slice(0,4).map((p, i) => {
              const est = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.PENDIENTE
              return (
                <Animated.View key={p.id} style={[styles.pedidoCard, {
                  opacity: cardAnims[Math.min(i, 3)],
                }]}>
                  <TouchableOpacity
                    style={styles.pedidoInner}
                    onPress={() => router.push('/proveedor-panel/pedidos')}
                  >
                    <View style={styles.pedidoIco}>
                      <Text style={{fontSize:20}}>🔧</Text>
                    </View>
                    <View style={styles.pedidoInfo}>
                      <Text style={styles.pedidoServicio}>{p.servicio?.nombre}</Text>
                      <Text style={styles.pedidoCliente}>👤 {p.cliente?.nombre}</Text>
                      <Text style={styles.pedidoFecha}>
                        📅 {new Date(p.fecha).toLocaleDateString('es-AR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.pedidoRight}>
                      <Text style={styles.pedidoMonto}>${p.montoTotal?.toLocaleString()}</Text>
                      <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                        <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )
            })
          )}
        </View>

        <View style={{ height:100 }} />
      </ScrollView>
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
  heroGreeting:       { fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:'600', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  heroNombre:         { fontSize:26, fontWeight:'900', color:'white' },
  heroAvatar:         { width:46, height:46, borderRadius:15, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', position:'relative' },
  heroAvatarText:     { color:'white', fontSize:18, fontWeight:'900' },
  heroAvatarBadge:    { position:'absolute', bottom:2, right:2, width:10, height:10, borderRadius:5, backgroundColor:Colors.primaryLight, borderWidth:2, borderColor:'#0D0D0D' },

  // Ganancia card
  gananciaCard:       { backgroundColor:'rgba(26,158,92,.12)', borderRadius:20, padding:20, marginBottom:14, borderWidth:1, borderColor:'rgba(61,214,140,.2)', flexDirection:'row', alignItems:'center' },
  gananciaLeft:       { flex:1 },
  gananciaLabel:      { fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:'600', letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  gananciaNum:        { fontSize:36, fontWeight:'900', color:'white', marginBottom:8 },
  gananciaBadge:      { backgroundColor:'rgba(61,214,140,.2)', alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  gananciaBadgeText:  { fontSize:10, color:Colors.primaryLight, fontWeight:'700' },
  gananciaRight:      { alignItems:'center', justifyContent:'center' },
  gananciaIco:        { fontSize:48 },

  // Toggle
  toggleCard:         { backgroundColor:'rgba(255,255,255,.05)', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'rgba(255,255,255,.08)' },
  toggleLeft:         { flexDirection:'row', alignItems:'center', gap:10 },
  toggleDot:          { width:10, height:10, borderRadius:5 },
  toggleTitle:        { fontSize:14, fontWeight:'700', color:'white', marginBottom:2 },
  toggleSub:          { fontSize:11, color:'rgba(255,255,255,.35)' },

  // Secciones
  metricasSection:    { padding:22, paddingTop:24, paddingBottom:0 },
  accionesSection:    { padding:22, paddingTop:24, paddingBottom:0 },
  pedidosSection:     { padding:22, paddingTop:24 },
  sectionTitle:       { fontSize:16, fontWeight:'900', color:'white', marginBottom:14 },
  sectionRow:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionLink:        { fontSize:12, color:Colors.primaryLight, fontWeight:'700' },

  // Métricas
  metricasGrid:       { flexDirection:'row', gap:10 },
  metricaCard:        { flex:1, backgroundColor:'rgba(255,255,255,.05)', borderRadius:16, padding:14, alignItems:'center', gap:6, borderWidth:1, borderColor:'rgba(255,255,255,.07)' },
  metricaIco:         { fontSize:22 },
  metricaNum:         { fontSize:22, fontWeight:'900', color:'white' },
  metricaLabel:       { fontSize:9, color:'rgba(255,255,255,.4)', fontWeight:'600', textAlign:'center' },

  // Acciones
  accionesGrid:       { flexDirection:'row', flexWrap:'wrap', gap:10 },
  accionCard:         { width:(width-44-10)/2, borderRadius:18, padding:18, gap:10, position:'relative', borderWidth:1 },
  accionCardGreen:    { backgroundColor:'rgba(26,158,92,.12)', borderColor:'rgba(61,214,140,.2)' },
  accionCardBlue:     { backgroundColor:'rgba(116,185,255,.1)', borderColor:'rgba(116,185,255,.2)' },
  accionCardYellow:   { backgroundColor:'rgba(255,210,63,.1)', borderColor:'rgba(255,210,63,.2)' },
  accionCardPurple:   { backgroundColor:'rgba(162,155,254,.1)', borderColor:'rgba(162,155,254,.2)' },
  accionIco:          { width:48, height:48, borderRadius:14, backgroundColor:'rgba(255,255,255,.08)', alignItems:'center', justifyContent:'center' },
  accionLabel:        { fontSize:13, fontWeight:'700', color:'white' },
  accionBadge:        { position:'absolute', top:12, right:12, width:20, height:20, borderRadius:10, backgroundColor:'#FF4757', alignItems:'center', justifyContent:'center' },
  accionBadgeText:    { color:'white', fontSize:10, fontWeight:'900' },

  // Pedidos
  pedidoCard:         { backgroundColor:'rgba(255,255,255,.04)', borderRadius:18, marginBottom:10, borderWidth:1, borderColor:'rgba(255,255,255,.07)', overflow:'hidden' },
  pedidoInner:        { flexDirection:'row', alignItems:'center', gap:12, padding:16 },
  pedidoIco:          { width:46, height:46, borderRadius:14, backgroundColor:'rgba(26,158,92,.15)', alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1, gap:3 },
  pedidoServicio:     { fontSize:14, fontWeight:'700', color:'white' },
  pedidoCliente:      { fontSize:11, color:'rgba(255,255,255,.4)' },
  pedidoFecha:        { fontSize:11, color:'rgba(255,255,255,.3)' },
  pedidoRight:        { alignItems:'flex-end', gap:6 },
  pedidoMonto:        { fontSize:16, fontWeight:'900', color:'white' },
  estadoBadge:        { paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  estadoText:         { fontSize:10, fontWeight:'700' },

  // Empty
  empty:              { alignItems:'center', paddingVertical:40 },
  emptyIco:           { fontSize:48, marginBottom:12, opacity:.3 },
  emptyTitle:         { fontSize:16, fontWeight:'800', color:'rgba(255,255,255,.4)', marginBottom:6 },
  emptySub:           { fontSize:13, color:'rgba(255,255,255,.2)', textAlign:'center' },
})
