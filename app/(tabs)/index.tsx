import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, RefreshControl, Image } from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Colors } from '../../constants/colors'
import { CATEGORIAS, categoriaInfo } from '../../constants/categorias'
import { useAuthStore } from '../../store/authStore'
import { useNotifStore } from '../../store/notificacionesStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { usuariosService } from '../../services/usuarios.service'
import { estadisticasService, Estadisticas } from '../../services/estadisticas.service'
import { nombreDeLugar, obtenerPosicion } from '../../utils/ubicacion'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ONBOARDING_KEY } from '../../constants/config'
import { distanciaKm, formatearDistancia } from '../../utils/distancia'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { PressScale } from '../../components/ui/PressScale'
import { FUENTES as F, HIT_SLOP } from '../../constants/diseno'
import { Aparecer } from '../../components/ui/Aparecer'
import { ContadorAnimado } from '../../components/ui/ContadorAnimado'
import { archivoUrl } from '../../constants/config'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { textoRating } from '../../utils/rating'

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


const TARJETA_BG = ['#C8F5D0', '#FFF3CC', '#CCE5FF', '#FFE5E5']
// Más lejos que esto ya no es "cerca tuyo" (antes aparecían proveedores de otra provincia)
const RADIO_CERCA_KM = 50

// Franja de estadisticas (vienen del backend; "—" mientras cargan o si no hay datos).
// Los numeros cuentan desde 0 al aparecer.
function statsDe(e: Estadisticas | null) {
  return [
    { valor: e?.vecinos,       sufijo: '',  label:'Vecinos' },
    { valor: e?.satisfaccion,  sufijo: '%', label:'Satisfacción' },
    { valor: e?.profesionales, sufijo: '',  label:'Profesionales' },
  ]
}

export default function HomeScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const noLeidas = useNotifStore(s => s.noLeidas)
  const tema = useTema()
  const styles = getStyles(tema)

  const [proveedoresCerca, setProveedoresCerca] = useState<any[]>([])
  const [loadingCerca, setLoadingCerca] = useState(true)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [lugar, setLugar] = useState('Buscando tu ubicación…')
  const [refrescando, setRefrescando] = useState(false)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const icoSaludo: NombreIcono = hora < 12 ? 'sunny-outline' : hora < 18 ? 'partly-sunny-outline' : 'moon-outline'

  useEffect(() => {
    cargarProveedoresCerca()
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    try {
      setEstadisticas(await estadisticasService.obtener())
    } catch {}
  }

  async function cargarProveedoresCerca() {
    try {
      const [proveedores, ubicacion] = await Promise.all([
        usuariosService.listarProveedores(),
        obtenerUbicacion(),
      ])

      setLugar(ubicacion ? (await nombreDeLugar(ubicacion)) ?? 'Tu ubicación' : 'Ubicación no disponible')

      // Un proveedor no se ve a sí mismo como "cerca tuyo"
      const conCoords = (proveedores ?? []).filter(
        (p: any) => typeof p.latitud === 'number' && typeof p.longitud === 'number' && p.id !== usuario?.id
      )

      const conDistancia = conCoords.map((p: any) => ({
        ...p,
        distanciaKm: ubicacion
          ? distanciaKm(ubicacion, { latitude: p.latitud, longitude: p.longitud })
          : null,
      }))

      // Sin ubicación no se puede filtrar por distancia: se muestran todos
      const cercanos = ubicacion
        ? conDistancia.filter((p: any) => p.distanciaKm <= RADIO_CERCA_KM)
        : conDistancia

      cercanos.sort((a: any, b: any) => {
        if (a.distanciaKm == null || b.distanciaKm == null) return 0
        return a.distanciaKm - b.distanciaKm
      })

      setProveedoresCerca(cercanos.slice(0, 8))
    } catch {
      setProveedoresCerca([])
    } finally {
      setLoadingCerca(false)
    }
  }

  async function alRefrescar() {
    setRefrescando(true)
    await Promise.all([cargarProveedoresCerca(), cargarEstadisticas()])
    setRefrescando(false)
  }

  async function obtenerUbicacion(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Inicio se monta detrás del onboarding la primera vez: sin esto, el permiso de
      // ubicación aparecía encima de la presentación, antes de explicar para qué es
      if (!(await AsyncStorage.getItem(ONBOARDING_KEY))) return null
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return null
      return await obtenerPosicion()
    } catch {
      return null
    }
  }


  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={Colors.primary} colors={[Colors.primary]} />
      }
    >

      {/* ── HEADER ── */}
      <Aparecer style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.saludoFila}>
            <Icono nombre={icoSaludo} tamano={13} color={tema.subTexto} />
            <Text style={styles.saludo}>{saludo}</Text>
          </View>
          <Text style={styles.nombre}>
            Hola, <Text style={styles.nombreVerde}>{usuario?.nombre?.split(' ')[0] ?? 'vecino'}</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <PressScale
            style={styles.notifBtn}
            onPress={() => router.push('/notificaciones')}
            hitSlop={HIT_SLOP}
            accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
          >
            <Icono nombre={noLeidas > 0 ? 'notifications' : 'notifications-outline'} tamano={21} color={tema.texto} />
            {noLeidas > 0 && (
              <Aparecer desde="lugar" style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
              </Aparecer>
            )}
          </PressScale>
          <PressScale style={styles.avatarBtn} onPress={() => router.push('/(tabs)/perfil')} accessibilityLabel="Mi perfil">
            <View style={styles.avatar}>
              {usuario?.avatar
                ? <Image source={{ uri: archivoUrl(usuario.avatar)! }} style={styles.avatarImg} />
                : <Text style={styles.avatarText}>{usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}</Text>}
            </View>
          </PressScale>
        </View>
      </Aparecer>

      {/* ── SEARCH ── */}
      <Aparecer indice={1}>
        <PressScale style={styles.searchBar} scaleTo={0.98} onPress={() => router.push('/(tabs)/buscar')} accessibilityLabel="Buscar servicios">
          <View style={styles.searchLeft}>
            <Icono nombre="search-outline" tamano={19} color={tema.subTexto} />
            <Text style={styles.searchPlaceholder}>¿Qué servicio necesitás?</Text>
          </View>
          <View style={styles.filterBtn}>
            <Icono nombre="options-outline" tamano={18} color={tema.texto} />
          </View>
        </PressScale>

        {/* Ubicación */}
        <View style={styles.locationRow}>
          <Icono nombre="location" tamano={14} color={Colors.primary} />
          <Text style={styles.locText}>{lugar}</Text>
          <TouchableOpacity onPress={cargarProveedoresCerca} hitSlop={HIT_SLOP}><Text style={styles.locChange}>Actualizar</Text></TouchableOpacity>
        </View>
      </Aparecer>

      {/* ── STATS STRIP ── */}
      <Aparecer indice={2} style={styles.statsStrip}>
        {statsDe(estadisticas).map((s, i) => (
          <View key={i} style={[styles.statItem, i > 0 && styles.statBorder]}>
            <ContadorAnimado style={styles.statNum} valor={s.valor} sufijo={s.sufijo} />
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Aparecer>

      {/* ── CATEGORÍAS ── */}
      <Aparecer indice={3} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Categorías</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/buscar')}>
          <Text style={styles.sectionLink}>Ver todas</Text>
        </TouchableOpacity>
      </Aparecer>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
        {CATEGORIAS.map((cat, i) => (
          <Aparecer key={cat.value} indice={i} desde="derecha" retraso={200}>
            <PressScale
              style={styles.catChip}
              haptico
              accessibilityLabel={`Categoría ${cat.nombre}`}
              onPress={() => router.push({ pathname: '/(tabs)/buscar', params: { categoria: cat.value } })}
            >
              <View style={styles.catIcoWrap}>
                <Icono nombre={cat.icono} tamano={24} color={Colors.primary} />
              </View>
              {/* Nombres largos ("Electrodomésticos") se achican un poco en vez de partirse a mitad de palabra */}
              <Text
                style={styles.catNombre}
                numberOfLines={cat.nombre.includes(' ') ? 2 : 1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >{cat.nombre}</Text>
            </PressScale>
          </Aparecer>
        ))}
      </ScrollView>

      {/* ── BANNER PROMO ── */}
      {/* Lo que la app garantiza de verdad: el pago queda retenido hasta confirmar el trabajo */}
      <Aparecer indice={4}>
        <PressScale style={styles.promoBanner} scaleTo={0.98} onPress={() => router.push('/(tabs)/buscar')}>
          <View style={styles.promoBg} />
          <View style={styles.promoContent}>
            <View style={styles.promoTag}>
              <Icono nombre="lock-closed" tamano={11} color={Colors.primaryLight} />
              <Text style={styles.promoTagText}>Pago protegido</Text>
            </View>
            <Text style={styles.promoTitle}>Pagás, y el proveedor{'\n'}cobra <Text style={styles.promoVerde}>cuando confirmás</Text></Text>
            <View style={styles.promoCta}>
              <Text style={styles.promoCtaText}>Buscar un servicio</Text>
              <Icono nombre="arrow-forward" tamano={14} color={Colors.dark} />
            </View>
          </View>
          <Icono nombre="shield-checkmark" tamano={64} color={Colors.primaryLight} style={styles.promoEmoji} />
        </PressScale>
      </Aparecer>

      {/* ── PROVEEDORES CERCA ── */}
      <Aparecer indice={5} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Cerca tuyo</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mapa')}>
          <Text style={styles.sectionLink}>Ver mapa</Text>
        </TouchableOpacity>
      </Aparecer>
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
          <Aparecer key={p.id} indice={i} desde="derecha">
          <PressScale
            style={styles.provCard}
            haptico
            accessibilityLabel={`${p.nombre}, ${cat.nombre}, calificación ${textoRating(p.rating, 'sin reseñas')}`}
            onPress={() => router.push(`/proveedor/${p.id}`)}
          >
            <View style={[styles.provCardTop, { backgroundColor: TARJETA_BG[i % TARJETA_BG.length] }]}>
              {/* Con foto de perfil se muestra la foto; si no, el ícono de su categoría */}
              {p.avatar
                ? <Image source={{ uri: archivoUrl(p.avatar)! }} style={styles.provCardFoto} />
                : <Icono nombre={cat.icono} tamano={34} color={Colors.dark} style={styles.provCardIco} />}
              {p.distanciaKm != null && (
                <View style={styles.provDistBadge}>
                  <Icono nombre="location" tamano={10} color={Colors.dark} />
                  <Text style={styles.provDist}>{formatearDistancia(p.distanciaKm)}</Text>
                </View>
              )}
            </View>
            <View style={styles.provCardBody}>
              <Text style={styles.provNombre}>{p.nombre}</Text>
              <Text style={styles.provCat}>{cat.nombre}</Text>
              <View style={styles.provRow}>
                <View style={styles.ratingBadge}>
                  <Icono nombre="star" tamano={11} color="#F5B301" />
                  <Text style={styles.ratingText}>{textoRating(p.rating)}</Text>
                </View>
                {precioMin != null && <Text style={styles.provPrecio}>desde ${precioMin.toLocaleString('es-AR')}</Text>}
              </View>
            </View>
          </PressScale>
          </Aparecer>
          )
        })}
      </ScrollView>
      )}

      {/* ── BANNER PROVEEDOR ── */}
      {usuario?.rol === 'CLIENTE' && (
        <Aparecer indice={6}>
        <PressScale style={styles.proveedorBanner} scaleTo={0.98} onPress={() => router.push('/(auth)/registro')}>
          <View>
            <Text style={styles.proveedorBannerTitle}>¿Ofrecés servicios?</Text>
            <Text style={styles.proveedorBannerSub}>Unite como proveedor y conseguí clientes</Text>
          </View>
          <Icono nombre="arrow-forward" tamano={20} color={Colors.primary} />
        </PressScale>
        </Aparecer>
      )}

      {usuario?.rol === 'PROVEEDOR' && (
  <Aparecer indice={6}>
  <PressScale
    style={styles.proveedorPanelBtn}
    haptico
    scaleTo={0.98}
    onPress={() => router.push('/proveedor-panel')}
  >
    <View style={styles.proveedorPanelLeft}>
      <View style={styles.proveedorPanelIcoWrap}>
        <Icono nombre="briefcase" tamano={22} color={Colors.primaryLight} />
      </View>
      <View>
        <Text style={styles.proveedorPanelTitle}>Panel de proveedor</Text>
        <Text style={styles.proveedorPanelSub}>Ver pedidos, servicios y métricas</Text>
      </View>
    </View>
    <Icono nombre="arrow-forward" tamano={20} color={Colors.primaryLight} />
  </PressScale>
  </Aparecer>
)}
<View style={{ height:100 }} />
    </ScrollView>
    <FondoBarraEstado color={tema.bg} />
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:           { flex:1, backgroundColor:tema.bg },
  header:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  headerLeft:          { flex:1 },
  saludoFila:          { flexDirection:'row', alignItems:'center', gap:5, marginBottom:2 },
  saludo:              { fontSize:11, color:tema.subTexto, fontFamily: F.semibold },
  nombre:              { fontSize:24, fontFamily: F.extrabold, color:tema.texto },
  nombreVerde:         { color:Colors.primary },
  headerRight:         { flexDirection:'row', gap:10, alignItems:'center' },
  notifBtn:            { width:42, height:42, borderRadius:13, backgroundColor:tema.card, alignItems:'center', justifyContent:'center', position:'relative', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:6, elevation:2 },
  notifBadge:          { position:'absolute', top:-4, right:-4, minWidth:18, height:18, borderRadius:9, paddingHorizontal:4, backgroundColor:'#FF4757', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:tema.bg },
  notifBadgeText:      { color:'white', fontSize:9, fontFamily: F.bold, lineHeight:12 },
  avatarImg:           { width:'100%', height:'100%', borderRadius:13 },
  avatarBtn:           { shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.1, shadowRadius:6, elevation:3 },
  avatar:              { width:42, height:42, borderRadius:13, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarText:          { color:'white', fontSize:18, fontFamily: F.extrabold },
  searchBar:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:tema.card, borderRadius:18, padding:14, marginHorizontal:22, marginBottom:10, shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.08, shadowRadius:10, elevation:4 },
  searchLeft:          { flexDirection:'row', alignItems:'center', gap:10, flex:1 },
  searchPlaceholder:   { fontFamily: F.regular, fontSize:14, color:tema.subTexto, flex:1 },
  filterBtn:           { width:34, height:34, borderRadius:10, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center' },
  locationRow:         { flexDirection:'row', alignItems:'center', paddingHorizontal:22, marginBottom:20, gap:6 },
  locText:             { fontFamily: F.regular, fontSize:12, color:tema.subTexto, flex:1 },
  locChange:           { fontSize:12, color:Colors.primary, fontFamily: F.bold },
  statsStrip:          { flexDirection:'row', backgroundColor:tema.card, marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:10, elevation:3 },
  statItem:            { flex:1, alignItems:'center' },
  statBorder:          { borderLeftWidth:1, borderLeftColor:tema.border },
  statNum:             { fontSize:18, fontFamily: F.extrabold, color:tema.texto, marginBottom:2 },
  statLabel:           { fontSize:10, color:tema.subTexto, fontFamily: F.medium },
  sectionHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:22, marginBottom:14 },
  sectionTitle:        { fontSize:18, fontFamily: F.extrabold, color:tema.texto },
  sectionLink:         { fontSize:12, color:Colors.primary, fontFamily: F.bold },
  catsScroll:          { paddingHorizontal:22, gap:10, marginBottom:24 },
  catChip:             { alignItems:'center', gap:8, width:84 },
  catIcoWrap:          { width:56, height:56, borderRadius:18, backgroundColor:tema.card, alignItems:'center', justifyContent:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  catNombre:           { fontSize:10, fontFamily: F.bold, color:tema.texto, textAlign:'center' },
  promoBanner:         { marginHorizontal:22, marginBottom:24, backgroundColor:'#1a1a1a', borderRadius:22, padding:22, flexDirection:'row', justifyContent:'space-between', alignItems:'center', overflow:'hidden' },
  promoBg:             { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:Colors.primary, opacity:.12, right:-60, top:-60 },
  promoContent:        { flex:1 },
  promoTag:            { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(61,214,140,.2)', alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:100, marginBottom:10 },
  promoTagText:        { color:'#3DD68C', fontSize:10, fontFamily: F.bold },
  promoTitle:          { fontSize:20, fontFamily: F.extrabold, color:'white', lineHeight:26, marginBottom:12 },
  promoVerde:          { color:'#3DD68C', fontStyle:'italic' },
  promoCta:            { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:Colors.primaryLight, paddingHorizontal:16, paddingVertical:8, borderRadius:100, alignSelf:'flex-start' },
  promoCtaText:        { fontSize:12, fontFamily: F.bold, color:'#1a1a1a' },
  promoEmoji:          { opacity:.9 },
  provsScroll:         { paddingHorizontal:22, gap:14, marginBottom:24 },
  emptyCerca:          { marginHorizontal:22, marginBottom:24, padding:20, borderRadius:16, backgroundColor:tema.card, alignItems:'center' },
  emptyCercaText:      { fontFamily: F.regular, fontSize:12, color:tema.subTexto, textAlign:'center' },
  provCard:            { width:170, backgroundColor:tema.card, borderRadius:22, overflow:'hidden', shadowColor:tema.sombra, shadowOffset:{width:0,height:4}, shadowOpacity:.08, shadowRadius:12, elevation:4 },
  provCardTop:         { height:80, justifyContent:'space-between', flexDirection:'row', alignItems:'flex-end', padding:14, paddingTop:10 },
  provCardIco:         { opacity:.75, transform:[{translateY:16}] },
  provCardFoto:        { width:52, height:52, borderRadius:16, borderWidth:3, borderColor:tema.card, transform:[{translateY:26}] },
  provDistBadge:       { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'white', paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  provDist:            { fontSize:9, fontFamily: F.bold, color:Colors.dark },
  provCardBody:        { padding:14, paddingTop:22 },
  provNombre:          { fontSize:15, fontFamily: F.extrabold, color:tema.texto, marginBottom:2 },
  provCat:             { fontFamily: F.regular, fontSize:11, color:tema.subTexto, marginBottom:10 },
  provRow:             { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  ratingBadge:         { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:tema.bg, paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  ratingText:          { fontSize:11, fontFamily: F.bold, color:tema.texto },
  provPrecio:          { fontSize:11, fontFamily: F.bold, color:Colors.primary },
  proveedorBanner:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:22, marginBottom:24, backgroundColor:Colors.greenLight, borderRadius:18, padding:18, borderWidth:1.5, borderColor:Colors.primary },
  proveedorBannerTitle:{ fontSize:15, fontFamily: F.extrabold, color:Colors.dark, marginBottom:3 },
  proveedorBannerSub:  { fontFamily: F.regular, fontSize:12, color:'#555' },
  proveedorPanelBtn:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:22, marginBottom:16, backgroundColor:'#1a1a1a', borderRadius:20, padding:18 },
proveedorPanelLeft:  { flexDirection:'row', alignItems:'center', gap:14 },
proveedorPanelIcoWrap: { width:44, height:44, borderRadius:13, backgroundColor:'rgba(61,214,140,.15)', alignItems:'center', justifyContent:'center' },
proveedorPanelTitle: { fontSize:15, fontFamily: F.extrabold, color:'white', marginBottom:3 },
proveedorPanelSub:   { fontFamily: F.regular, fontSize:12, color:'rgba(255,255,255,.5)' },
})
