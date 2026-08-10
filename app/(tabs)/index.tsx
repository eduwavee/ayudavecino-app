import { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { pedidosService } from '../../services/pedidos.service'
import { notificacionesService } from '../../services/notificaciones.service'
import { usuariosService } from '../../services/usuarios.service'
import { distanciaKm, formatearDistancia } from '../../utils/distancia'
import { SkeletonBlock } from '../../components/ui/Skeleton'

function SkeletonProvCard({ styles }: { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.provCard}>
      <SkeletonBlock height={80} borderRadius={0} />
      <View style={styles.provCardBody}>
        <SkeletonBlock width="80%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonBlock width="55%" height={11} style={{ marginBottom: 10 }} />
        <SkeletonBlock width="100%" height={20} borderRadius={100} />
      </View>
    </View>
  )
}



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

const TARJETA_BG = ['#C8F5D0', '#FFF3CC', '#CCE5FF', '#FFE5E5']

function categoriaInfo(value?: string) {
  return CATEGORIAS.find(c => c.value === value) ?? { ico: '🔨', nombre: 'Servicios' }
}

const STATS = [
  { num:'2.400+', label:'Vecinos' },
  { num:'98%',    label:'Satisfacción' },
  { num:'850+',   label:'Profesionales' },
]

export default function HomeScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const tema = useTema()
  const styles = getStyles(tema)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const [proveedoresCerca, setProveedoresCerca] = useState<any[]>([])
  const [loadingCerca, setLoadingCerca] = useState(true)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días ☀️' : hora < 18 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙'

  useEffect(() => {
    cargarProveedoresCerca()
  }, [])

  async function cargarProveedoresCerca() {
    try {
      const [proveedores, ubicacion] = await Promise.all([
        usuariosService.listarProveedores(),
        obtenerUbicacion(),
      ])

      const conCoords = (proveedores ?? []).filter(
        (p: any) => typeof p.latitud === 'number' && typeof p.longitud === 'number'
      )

      const conDistancia = conCoords.map((p: any) => ({
        ...p,
        distanciaKm: ubicacion
          ? distanciaKm(ubicacion, { latitude: p.latitud, longitude: p.longitud })
          : null,
      }))

      conDistancia.sort((a: any, b: any) => {
        if (a.distanciaKm == null || b.distanciaKm == null) return 0
        return a.distanciaKm - b.distanciaKm
      })

      setProveedoresCerca(conDistancia.slice(0, 8))
    } catch {
      setProveedoresCerca([])
    } finally {
      setLoadingCerca(false)
    }
  }

  async function obtenerUbicacion(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return null
      const pos = await Location.getCurrentPositionAsync({})
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    } catch {
      return null
    }
  }

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
      {loadingCerca ? (
        <View style={[styles.provsScroll, { flexDirection:'row' }]}>
          {[0, 1].map(i => <SkeletonProvCard key={i} styles={styles} />)}
        </View>
      ) : proveedoresCerca.length === 0 ? (
        <View style={styles.emptyCerca}>
          <Text style={styles.emptyCercaText}>Todavía no hay proveedores con ubicación cargada cerca tuyo</Text>
        </View>
      ) : (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.provsScroll}>
        {proveedoresCerca.map((p, i) => {
          const cat = categoriaInfo(p.servicios?.[0]?.categoria)
          const precioMin = p.servicios?.length
            ? Math.min(...p.servicios.map((s: any) => s.precio))
            : null
          return (
          <TouchableOpacity
            key={p.id}
            style={styles.provCard}
            activeOpacity={.85}
            onPress={() => router.push(`/proveedor/${p.id}`)}
          >
            <View style={[styles.provCardTop, { backgroundColor: TARJETA_BG[i % TARJETA_BG.length] }]}>
              <Text style={styles.provCardIco}>{cat.ico}</Text>
              {p.distanciaKm != null && (
                <View style={styles.provDistBadge}>
                  <Text style={styles.provDist}>📍 {formatearDistancia(p.distanciaKm)}</Text>
                </View>
              )}
            </View>
            <View style={styles.provCardBody}>
              <Text style={styles.provNombre}>{p.nombre}</Text>
              <Text style={styles.provCat}>{cat.nombre}</Text>
              <View style={styles.provRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {p.rating?.toFixed?.(1) ?? '0.0'}</Text>
                </View>
                {precioMin != null && <Text style={styles.provPrecio}>desde ${precioMin}</Text>}
              </View>
            </View>
          </TouchableOpacity>
          )
        })}
      </ScrollView>
      )}

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

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:           { flex:1, backgroundColor:tema.bg },
  header:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  headerLeft:          { flex:1 },
  saludo:              { fontSize:11, color:tema.subTexto, fontWeight:'600', marginBottom:2 },
  nombre:              { fontSize:24, fontWeight:'900', color:tema.texto },
  nombreVerde:         { color:Colors.primary },
  headerRight:         { flexDirection:'row', gap:10, alignItems:'center' },
  notifBtn:            { width:42, height:42, borderRadius:13, backgroundColor:tema.card, alignItems:'center', justifyContent:'center', position:'relative', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:6, elevation:2 },
  notifIco:            { fontSize:18 },
  notifDot:            { position:'absolute', top:8, right:8, width:9, height:9, borderRadius:5, backgroundColor:'#FF4757', borderWidth:2, borderColor:tema.bg },
  avatarBtn:           { shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.1, shadowRadius:6, elevation:3 },
  avatar:              { width:42, height:42, borderRadius:13, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarText:          { color:'white', fontSize:18, fontWeight:'900' },
  searchBar:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:tema.card, borderRadius:18, padding:14, marginHorizontal:22, marginBottom:10, shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.08, shadowRadius:10, elevation:4 },
  searchLeft:          { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
  searchIcon:          { fontSize:16 },
  searchPlaceholder:   { fontSize:14, color:tema.subTexto, flex:1 },
  filterBtn:           { width:34, height:34, borderRadius:10, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center' },
  filterIco:           { fontSize:14 },
  locationRow:         { flexDirection:'row', alignItems:'center', paddingHorizontal:22, marginBottom:20, gap:6 },
  locDot:              { width:8, height:8, borderRadius:4, backgroundColor:Colors.primary },
  locText:             { fontSize:12, color:tema.subTexto, flex:1 },
  locChange:           { fontSize:12, color:Colors.primary, fontWeight:'700' },
  statsStrip:          { flexDirection:'row', backgroundColor:tema.card, marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:10, elevation:3 },
  statItem:            { flex:1, alignItems:'center' },
  statBorder:          { borderLeftWidth:1, borderLeftColor:tema.border },
  statNum:             { fontSize:18, fontWeight:'900', color:tema.texto, marginBottom:2 },
  statLabel:           { fontSize:10, color:tema.subTexto, fontWeight:'500' },
  sectionHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, marginBottom:14 },
  sectionTitle:        { fontSize:18, fontWeight:'900', color:tema.texto },
  sectionLink:         { fontSize:12, color:Colors.primary, fontWeight:'700' },
  catsScroll:          { paddingHorizontal:22, gap:10, marginBottom:24 },
  catChip:             { alignItems:'center', gap:8, width:76 },
  catIcoWrap:          { width:56, height:56, borderRadius:18, backgroundColor:tema.card, alignItems:'center', justifyContent:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  catIco:              { fontSize:26 },
  catNombre:           { fontSize:10, fontWeight:'700', color:tema.texto, textAlign:'center' },
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
  emptyCerca:          { marginHorizontal:22, marginBottom:24, padding:20, borderRadius:16, backgroundColor:tema.card, alignItems:'center' },
  emptyCercaText:      { fontSize:12, color:tema.subTexto, textAlign:'center' },
  provCard:            { width:170, backgroundColor:tema.card, borderRadius:22, overflow:'hidden', shadowColor:tema.sombra, shadowOffset:{width:0,height:4}, shadowOpacity:.08, shadowRadius:12, elevation:4 },
  provCardTop:         { height:80, justifyContent:'space-between', flexDirection:'row', alignItems:'flex-end', padding:14, paddingTop:10 },
  provCardIco:         { fontSize:32, transform:[{translateY:16}] },
  provDistBadge:       { backgroundColor:'white', paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  provDist:            { fontSize:9, fontWeight:'700', color:Colors.dark },
  provCardBody:        { padding:14, paddingTop:22 },
  provNombre:          { fontSize:15, fontWeight:'900', color:tema.texto, marginBottom:2 },
  provCat:             { fontSize:11, color:tema.subTexto, marginBottom:10 },
  provRow:             { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  ratingBadge:         { backgroundColor:tema.bg, paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  ratingText:          { fontSize:11, fontWeight:'700', color:tema.texto },
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
