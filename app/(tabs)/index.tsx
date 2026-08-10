import { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { pedidosService } from '../../services/pedidos.service'
import { notificacionesService } from '../../services/notificaciones.service'



const { width } = Dimensions.get('window')

const CATEGORIAS = [
  { ico:'🔧', nombre:'Plomería',     value:'plomeria' },
  { ico:'⚡', nombre:'Electricidad', value:'electricidad' },
  { ico:'🏗️', nombre:'Albañilería',  value:'albanileria' },
  { ico:'🪟', nombre:'Carpintería',  value:'carpinteria' },
  { ico:'🌿', nombre:'Jardín',       value:'jardin' },
  { ico:'🧹', nombre:'Limpieza',     value:'limpieza' },
  { ico:'🎨', nombre:'Pintura',      value:'pintura' },
]

const PROVEEDORES = [
  { id:'1', nombre:'Carlos M.', cat:'Plomero',      rating:'4.9', dist:'1.2 km', precio:'6.000', bg:'#C8F5D0', ico:'🔧' },
  { id:'2', nombre:'Diego R.',  cat:'Electricista', rating:'4.8', dist:'0.8 km', precio:'7.000', bg:'#FFF3CC', ico:'⚡' },
  { id:'3', nombre:'Omar S.',   cat:'Albañil',      rating:'4.7', dist:'2.1 km', precio:'9.000', bg:'#CCE5FF', ico:'🏗️' },
  { id:'4', nombre:'Laura P.',  cat:'Pintora',      rating:'5.0', dist:'3.0 km', precio:'8.500', bg:'#FFE5E5', ico:'🎨' },
]

const STATS = [
  { num:'2.400+', label:'Vecinos' },
  { num:'98%',    label:'Satisfacción' },
  { num:'850+',   label:'Profesionales' },
]

export default function HomeScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días ☀️' : hora < 18 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙'

  useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim,  { toValue:1, duration:600, useNativeDriver:true }),
    Animated.timing(slideAnim, { toValue:0, duration:600, useNativeDriver:true }),
  ]).start()

  // Polling de notificaciones
  if (!usuario?.id) return
  const prevEstados: Record<string, string> = {}
  const intervalo = setInterval(async () => {
    try {
      const pedidos = await pedidosService.misPedidos()
      for (const p of pedidos) {
        const anterior = prevEstados[p.id]
        const actual   = p.estado
        if (!anterior) { prevEstados[p.id] = actual; continue }
        if (anterior !== actual) {
          const msgs: Record<string, string> = {
            ACEPTADO:  '✅ El proveedor aceptó tu pedido',
            EN_CURSO:  '🔧 El trabajo está en curso',
            COMPLETADO:'🎉 Trabajo completado, confirmá el pago',
            CANCELADO: '❌ El pedido fue cancelado',
          }
          if (msgs[actual]) {
            await notificacionesService.mostrarLocal('AyudaVecino', msgs[actual])
          }
          prevEstados[p.id] = actual
        }
      }
    } catch {}
  }, 30000)
  return () => clearInterval(intervalo)
}, [usuario?.id])

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HEADER ── */}
      <Animated.View style={[styles.header, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.saludo}>{saludo}</Text>
          <Text style={styles.nombre}>
            Hola, <Text style={styles.nombreVerde}>{usuario?.nombre?.split(' ')[0] ?? 'vecino'}</Text> 👋
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notificaciones')}>
            <Text style={styles.notifIco}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(tabs)/perfil')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── SEARCH ── */}
      <Animated.View style={[{ opacity:fadeAnim }]}>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/buscar')}>
          <View style={styles.searchLeft}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>¿Qué servicio necesitás?</Text>
          </View>
          <View style={styles.filterBtn}>
            <Text style={styles.filterIco}>⚙️</Text>
          </View>
        </TouchableOpacity>

        {/* Ubicación */}
        <View style={styles.locationRow}>
          <View style={styles.locDot} />
          <Text style={styles.locText}>San Miguel de Tucumán, 4000</Text>
          <TouchableOpacity><Text style={styles.locChange}>Cambiar</Text></TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── STATS STRIP ── */}
      <Animated.View style={[styles.statsStrip, { opacity:fadeAnim }]}>
        {STATS.map((s, i) => (
          <View key={i} style={[styles.statItem, i > 0 && styles.statBorder]}>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── CATEGORÍAS ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/buscar')}>
          <Text style={styles.sectionLink}>Ver todas →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
        {CATEGORIAS.map((cat, i) => (
          <TouchableOpacity
            key={i}
            style={styles.catChip}
            onPress={() => router.push({ pathname: '/(tabs)/buscar', params: { categoria: cat.value } })}
          >
            <View style={styles.catIcoWrap}>
              <Text style={styles.catIco}>{cat.ico}</Text>
            </View>
            <Text style={styles.catNombre}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── BANNER PROMO ── */}
      <TouchableOpacity style={styles.promoBanner} activeOpacity={.9}>
        <View style={styles.promoBg} />
        <View style={styles.promoContent}>
          <View style={styles.promoTag}>
            <Text style={styles.promoTagText}>🎉 Oferta especial</Text>
          </View>
          <Text style={styles.promoTitle}>Primera consulta{'\n'}<Text style={styles.promoVerde}>sin costo</Text></Text>
          <View style={styles.promoCta}>
            <Text style={styles.promoCtaText}>Aprovechar →</Text>
          </View>
        </View>
        <Text style={styles.promoEmoji}>🏘️</Text>
      </TouchableOpacity>

      {/* ── PROVEEDORES CERCA ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cerca tuyo</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mapa')}>
          <Text style={styles.sectionLink}>Ver mapa →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.provsScroll}>
        {PROVEEDORES.map(p => (
          <TouchableOpacity key={p.id} style={styles.provCard} activeOpacity={.85}>
            <View style={[styles.provCardTop, { backgroundColor: p.bg }]}>
              <Text style={styles.provCardIco}>{p.ico}</Text>
              <View style={styles.provDistBadge}>
                <Text style={styles.provDist}>📍 {p.dist}</Text>
              </View>
            </View>
            <View style={styles.provCardBody}>
              <Text style={styles.provNombre}>{p.nombre}</Text>
              <Text style={styles.provCat}>{p.cat}</Text>
              <View style={styles.provRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                </View>
                <Text style={styles.provPrecio}>desde ${p.precio}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── BANNER PROVEEDOR ── */}
      {usuario?.rol === 'CLIENTE' && (
        <TouchableOpacity style={styles.proveedorBanner} onPress={() => router.push('/(auth)/registro')}>
          <View>
            <Text style={styles.proveedorBannerTitle}>¿Ofrecés servicios?</Text>
            <Text style={styles.proveedorBannerSub}>Unite como proveedor y conseguí clientes</Text>
          </View>
          <Text style={styles.proveedorBannerIco}>→</Text>
        </TouchableOpacity>
      )}

      {usuario?.rol === 'PROVEEDOR' && (
  <TouchableOpacity
    style={styles.proveedorPanelBtn}
    onPress={() => router.push('/proveedor-panel')}
  >
    <View style={styles.proveedorPanelLeft}>
      <Text style={styles.proveedorPanelIco}>🔨</Text>
      <View>
        <Text style={styles.proveedorPanelTitle}>Panel de proveedor</Text>
        <Text style={styles.proveedorPanelSub}>Ver pedidos, servicios y métricas</Text>
      </View>
    </View>
    <Text style={styles.proveedorPanelArrow}>→</Text>
  </TouchableOpacity>
)}
<View style={{ height:100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:           { flex:1, backgroundColor:Colors.cream },
  header:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  headerLeft:          { flex:1 },
  saludo:              { fontSize:11, color:Colors.gray, fontWeight:'600', marginBottom:2 },
  nombre:              { fontSize:24, fontWeight:'900', color:Colors.dark },
  nombreVerde:         { color:Colors.primary },
  headerRight:         { flexDirection:'row', gap:10, alignItems:'center' },
  notifBtn:            { width:42, height:42, borderRadius:13, backgroundColor:'white', alignItems:'center', justifyContent:'center', position:'relative', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:6, elevation:2 },
  notifIco:            { fontSize:18 },
  notifDot:            { position:'absolute', top:8, right:8, width:9, height:9, borderRadius:5, backgroundColor:'#FF4757', borderWidth:2, borderColor:Colors.cream },
  avatarBtn:           { shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.1, shadowRadius:6, elevation:3 },
  avatar:              { width:42, height:42, borderRadius:13, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarText:          { color:'white', fontSize:18, fontWeight:'900' },
  searchBar:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'white', borderRadius:18, padding:14, marginHorizontal:22, marginBottom:10, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.08, shadowRadius:10, elevation:4 },
  searchLeft:          { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
  searchIcon:          { fontSize:16 },
  searchPlaceholder:   { fontSize:14, color:'#bbb', flex:1 },
  filterBtn:           { width:34, height:34, borderRadius:10, backgroundColor:Colors.cream, alignItems:'center', justifyContent:'center' },
  filterIco:           { fontSize:14 },
  locationRow:         { flexDirection:'row', alignItems:'center', paddingHorizontal:22, marginBottom:20, gap:6 },
  locDot:              { width:8, height:8, borderRadius:4, backgroundColor:Colors.primary },
  locText:             { fontSize:12, color:Colors.gray, flex:1 },
  locChange:           { fontSize:12, color:Colors.primary, fontWeight:'700' },
  statsStrip:          { flexDirection:'row', backgroundColor:'white', marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:10, elevation:3 },
  statItem:            { flex:1, alignItems:'center' },
  statBorder:          { borderLeftWidth:1, borderLeftColor:'#f0f0f0' },
  statNum:             { fontSize:18, fontWeight:'900', color:Colors.dark, marginBottom:2 },
  statLabel:           { fontSize:10, color:Colors.gray, fontWeight:'500' },
  sectionHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, marginBottom:14 },
  sectionTitle:        { fontSize:18, fontWeight:'900', color:Colors.dark },
  sectionLink:         { fontSize:12, color:Colors.primary, fontWeight:'700' },
  catsScroll:          { paddingHorizontal:22, gap:10, marginBottom:24 },
  catChip:             { alignItems:'center', gap:8, width:76 },
  catIcoWrap:          { width:56, height:56, borderRadius:18, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  catIco:              { fontSize:26 },
  catNombre:           { fontSize:10, fontWeight:'700', color:Colors.dark, textAlign:'center' },
  promoBanner:         { marginHorizontal:22, marginBottom:24, backgroundColor:'#1a1a1a', borderRadius:22, padding:22, flexDirection:'row', justifyContent:'space-between', alignItems:'center', overflow:'hidden' },
  promoBg:             { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:Colors.primary, opacity:.12, right:-60, top:-60 },
  promoContent:        { flex:1 },
  promoTag:            { backgroundColor:'rgba(61,214,140,.2)', alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:100, marginBottom:10 },
  promoTagText:        { color:'#3DD68C', fontSize:10, fontWeight:'700' },
  promoTitle:          { fontSize:20, fontWeight:'900', color:'white', lineHeight:26, marginBottom:12 },
  promoVerde:          { color:'#3DD68C', fontStyle:'italic' },
  promoCta:            { backgroundColor:Colors.primaryLight, paddingHorizontal:16, paddingVertical:8, borderRadius:100, alignSelf:'flex-start' },
  promoCtaText:        { fontSize:12, fontWeight:'700', color:'#1a1a1a' },
  promoEmoji:          { fontSize:48 },
  provsScroll:         { paddingHorizontal:22, gap:14, marginBottom:24 },
  provCard:            { width:170, backgroundColor:'white', borderRadius:22, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.08, shadowRadius:12, elevation:4 },
  provCardTop:         { height:80, justifyContent:'space-between', flexDirection:'row', alignItems:'flex-end', padding:14, paddingTop:10 },
  provCardIco:         { fontSize:32, transform:[{translateY:16}] },
  provDistBadge:       { backgroundColor:'white', paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  provDist:            { fontSize:9, fontWeight:'700', color:Colors.dark },
  provCardBody:        { padding:14, paddingTop:22 },
  provNombre:          { fontSize:15, fontWeight:'900', color:Colors.dark, marginBottom:2 },
  provCat:             { fontSize:11, color:Colors.gray, marginBottom:10 },
  provRow:             { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  ratingBadge:         { backgroundColor:Colors.cream, paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  ratingText:          { fontSize:11, fontWeight:'700', color:Colors.dark },
  provPrecio:          { fontSize:11, fontWeight:'700', color:Colors.primary },
  proveedorBanner:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:22, marginBottom:24, backgroundColor:Colors.greenLight, borderRadius:18, padding:18, borderWidth:1.5, borderColor:Colors.primary },
  proveedorBannerTitle:{ fontSize:15, fontWeight:'900', color:Colors.dark, marginBottom:3 },
  proveedorBannerSub:  { fontSize:12, color:'#555' },
  proveedorBannerIco:  { fontSize:22, color:Colors.primary, fontWeight:'900' },
  proveedorPanelBtn:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:22, marginBottom:16, backgroundColor:'#1a1a1a', borderRadius:20, padding:18 },
proveedorPanelLeft:  { flexDirection:'row', alignItems:'center', gap:14 },
proveedorPanelIco:   { fontSize:28 },
proveedorPanelTitle: { fontSize:15, fontWeight:'900', color:'white', marginBottom:3 },
proveedorPanelSub:   { fontSize:12, color:'rgba(255,255,255,.5)' },
proveedorPanelArrow: { fontSize:20, color:Colors.primaryLight, fontWeight:'900' },
})
