import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import { Colors } from '../../constants/colors'
import { usuariosService } from '../../services/usuarios.service'
import { resenasService } from '../../services/resenas.service'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { categoriaInfo } from '../../constants/categorias'
import { nombreDeLugar } from '../../utils/ubicacion'
import { archivoUrl } from '../../constants/config'
import { favoritosService } from '../../services/favoritos.service'
import { BotonCorazon } from '../../components/ui/BotonCorazon'
import { useAuthStore } from '../../store/authStore'
import { FUENTES as F, DURACION, CURVA, RESORTE } from '../../constants/diseno'
import Reanimated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation, withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Aparecer } from '../../components/ui/Aparecer'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { Estrellas } from '../../components/ui/Estrellas'
import { textoRating } from '../../utils/rating'
import { useTema, TemaTokens } from '../../store/temaStore'

function FilaInfo({ icono, texto }: { icono: NombreIcono; texto: string }) {
  const styles = getStyles(useTema())
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIco}><Icono nombre={icono} tamano={16} color={Colors.primary} /></View>
      <Text style={styles.infoText}>{texto}</Text>
    </View>
  )
}

const TABS = ['Sobre mí', 'Servicios', 'Reseñas']

// Params de "Nuevo pedido": la categoría la usa "presupuesto a varios" (Vecino Premium)
const paramsPedido = (s: any, proveedorId: string, proveedorNombre?: string) => ({
  servicioId: s.id, servicioNombre: s.nombre, precio: s.precio,
  categoria: s.categoria, proveedorId, proveedorNombre,
})

function SkeletonPerfilProveedor() {
  const styles = getStyles(useTema())
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <SkeletonBlock width={72} height={72} borderRadius={20} style={{ backgroundColor:'rgba(255,255,255,.12)' }} />
          <View>
            <SkeletonBlock width={140} height={18} style={{ marginBottom:6, backgroundColor:'rgba(255,255,255,.12)' }} />
            <SkeletonBlock width={90} height={12} style={{ backgroundColor:'rgba(255,255,255,.12)' }} />
          </View>
        </View>
      </View>
      <View style={styles.statsStrip}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.statItem, i > 0 && styles.statBorder]}>
            <SkeletonBlock width={30} height={20} style={{ marginBottom:6 }} />
            <SkeletonBlock width={44} height={10} />
          </View>
        ))}
      </View>
      <View style={[styles.tabContent, { gap:10 }]}>
        <SkeletonBlock width="100%" height={60} borderRadius={16} />
        <SkeletonBlock width="100%" height={60} borderRadius={16} />
      </View>
    </View>
  )
}

function SkeletonResenaCard() {
  const styles = getStyles(useTema())
  return (
    <View style={styles.resenaCard}>
      <View style={styles.resenaHeader}>
        <SkeletonBlock width={36} height={36} borderRadius={12} />
        <View style={styles.resenaHeaderInfo}>
          <SkeletonBlock width={100} height={12} style={{ marginBottom:5 }} />
          <SkeletonBlock width={60} height={10} />
        </View>
      </View>
      <SkeletonBlock width="90%" height={12} />
    </View>
  )
}

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const dias = Math.floor(diff / 86400000)
  if (dias < 1)  return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
  return new Date(fecha).toLocaleDateString('es-AR', { year:'numeric', month:'long' })
}

export default function ProveedorScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>()
  const router   = useRouter()
  const tema     = useTema()
  const styles   = getStyles(tema)
  const [proveedor, setProveedor] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [tabActiva, setTabActiva] = useState('Sobre mí')
  const [lugar, setLugar]         = useState<string | null>(null)
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  // Parallax de la cabecera y barra compacta que aparece al scrollear
  const scrollY = useSharedValue(0)
  const alScrollear = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const heroContenido = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 120], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, 200], [-30, 0, 70], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-100, 0], [1.08, 1], Extrapolation.CLAMP) },
    ],
  }))
  const barraCompacta = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [110, 160], [0, 1], Extrapolation.CLAMP),
  }))

  // Indicador que se desliza bajo la pestaña activa (translateX + scaleX, sin animar width)
  const [tabsLayout, setTabsLayout] = useState<Record<string, { x: number; w: number }>>({})
  const indicadorX = useSharedValue(0)
  const indicadorW = useSharedValue(0)
  useEffect(() => {
    const l = tabsLayout[tabActiva]
    if (!l) return
    indicadorX.value = withSpring(l.x, RESORTE.firme)
    indicadorW.value = withSpring(l.w, RESORTE.firme)
  }, [tabActiva, tabsLayout])
  const indicador = useAnimatedStyle(() => ({
    transform: [{ translateX: indicadorX.value }, { scaleX: indicadorW.value / 100 }],
  }))
  const esCliente = useAuthStore(s => s.usuario?.rol) === 'CLIENTE'
  const [favorito, setFavorito]   = useState(false)

  const [resenas, setResenas]         = useState<any[]>([])
  const [promedio, setPromedio]       = useState('0.0')
  const [loadingResenas, setLoadingResenas] = useState(true)

  useEffect(() => {
    if (id) {
      cargarProveedor()
      cargarResenas()
      if (esCliente) {
        favoritosService.listar().then(lista => setFavorito(lista.some(p => p.id === id))).catch(() => {})
      }
    }
  }, [id])

  async function cargarProveedor() {
    try {
      const data = await usuariosService.obtenerPerfil(id)
      setProveedor(data)
      if (typeof data.latitud === 'number' && typeof data.longitud === 'number') {
        nombreDeLugar({ latitude: data.latitud, longitude: data.longitud }).then(setLugar)
      }
    } catch {
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function toggleFavorito() {
    const nuevo = !favorito
    setFavorito(nuevo) // optimista: se revierte si falla
    try {
      if (nuevo) await favoritosService.agregar(id)
      else await favoritosService.quitar(id)
    } catch {
      setFavorito(!nuevo)
      Alert.alert('Error', 'No se pudo actualizar tus favoritos')
    }
  }

  async function cargarResenas() {
    try {
      const data = await resenasService.obtenerDeProveedor(id)
      setResenas(data.resenas ?? [])
      setPromedio(data.promedio ?? '0.0')
    } catch {
      setResenas([])
    } finally {
      setLoadingResenas(false)
    }
  }

  if (loading) {
    return <SkeletonPerfilProveedor />
  }

  return (
    <View style={styles.container}>
      <Reanimated.ScrollView showsVerticalScrollIndicator={false} onScroll={alScrollear} scrollEventThrottle={16}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroPattern} />
          <Reanimated.View style={heroContenido}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {proveedor?.avatar
                ? <Image source={{ uri: archivoUrl(proveedor.avatar)! }} style={styles.avatarImg} />
                : <Icono nombre={categoriaInfo(proveedor?.servicios?.[0]?.categoria).icono} tamano={32} color={Colors.dark} />}
            </View>
            <View style={styles.heroTextos}>
              <Text style={styles.heroName}>{proveedor?.nombre}</Text>
              <Text style={styles.heroCat}>
                {[proveedor?.servicios?.[0] && categoriaInfo(proveedor.servicios[0].categoria).nombre, lugar].filter(Boolean).join(' · ') || 'Proveedor'}
              </Text>
              <View style={styles.badgesRow}>
                <PlanBadge plan={proveedor?.plan} rol="PROVEEDOR" oscuro grande />
                {proveedor?.verificado && (
                  <View style={styles.badgeGreen}>
                    <Icono nombre="shield-checkmark" tamano={11} color="#3DD68C" />
                    <Text style={styles.badgeGreenText}>Verificado</Text>
                  </View>
                )}
                {proveedor?.topRated && (
                  <View style={styles.badgeYellow}>
                    <Icono nombre="star" tamano={11} color="#FFD23F" />
                    <Text style={styles.badgeYellowText}>Top rated</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          </Reanimated.View>
        </View>

        {/* Stats */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color:Colors.primary }]}>{textoRating(proveedor?.rating, '–')}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statNum}>{proveedor?._count?.pedidosComoProveedor ?? 0}</Text>
            <Text style={styles.statLabel}>Trabajos</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statNum}>{proveedor?.servicios?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={styles.tab}
              onPress={() => setTabActiva(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tabActiva === t }}
              onLayout={e => {
                const { x, width } = e.nativeEvent.layout
                setTabsLayout(prev => ({ ...prev, [t]: { x, w: width } }))
              }}
            >
              <Text style={[styles.tabText, tabActiva === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
          <Reanimated.View style={[styles.tabIndicador, indicador]} />
        </View>

        {/* El contenido de cada pestaña entra con un fundido corto al cambiar */}
        <Aparecer key={tabActiva} desde="lugar">
        {/* Tab: Sobre mí */}
        {tabActiva === 'Sobre mí' && (
          <View style={styles.tabContent}>
            <Text style={styles.aboutText}>
              {proveedor?.bio || `${proveedor?.nombre ?? 'Este profesional'} todavía no escribió una descripción.`}
            </Text>
            <View style={styles.infoRows}>
              {!!lugar && <FilaInfo icono="location-outline" texto={lugar} />}
              {proveedor?.respondeRapido && <FilaInfo icono="flash-outline" texto="Responde rápido" />}
              {proveedor?.verificado && <FilaInfo icono="shield-checkmark-outline" texto="Identidad verificada" />}
              <FilaInfo
                icono="calendar-outline"
                texto={`En AyudaVecino desde ${new Date(proveedor?.creadoEn).toLocaleDateString('es-AR', { month:'long', year:'numeric' })}`}
              />
            </View>
          </View>
        )}

        {/* Tab: Servicios */}
        {tabActiva === 'Servicios' && (
          <View style={styles.tabContent}>
            {proveedor?.servicios?.length === 0 && (
              <Text style={styles.emptyTab}>Sin servicios publicados</Text>
            )}
            {proveedor?.servicios?.map((s: any) => (
              <View key={s.id} style={styles.serviceBlock}>
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => router.push({ pathname:'/pedido/nuevo', params: paramsPedido(s, id, proveedor?.nombre) })}
                >
                  <View style={styles.serviceLeft}>
                    <View style={styles.serviceIco}><Icono nombre={categoriaInfo(s.categoria).icono} tamano={20} color={Colors.primary} /></View>
                    <View style={{ flex:1 }}>
                      <Text style={styles.serviceName}>{s.nombre}</Text>
                      <Text style={styles.serviceDesc}>{s.descripcion}</Text>
                    </View>
                  </View>
                  <Text style={styles.servicePrice}>${s.precio?.toLocaleString('es-AR')}</Text>
                </TouchableOpacity>
                {s.fotos?.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
                    {s.fotos.map((ruta: string) => (
                      <TouchableOpacity key={ruta} onPress={() => setFotoAbierta(ruta)}>
                        <Image source={{ uri: archivoUrl(ruta)! }} style={styles.fotoMini} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tab: Reseñas */}
        {tabActiva === 'Reseñas' && (
          <View style={styles.tabContent}>
            <View style={styles.ratingBig}>
              <Text style={styles.ratingNum}>{promedio}</Text>
              <View>
                <View style={styles.ratingStars}>
                  <Estrellas valor={Number(promedio)} tamano={18} />
                </View>
                <Text style={styles.ratingCount}>{resenas.length} reseña{resenas.length === 1 ? '' : 's'}</Text>
              </View>
            </View>

            {loadingResenas ? (
              <>
                <SkeletonResenaCard />
                <SkeletonResenaCard />
              </>
            ) : resenas.length === 0 ? (
              <Text style={styles.emptyTab}>Sin reseñas todavía</Text>
            ) : (
              resenas.map((r: any) => (
                <View key={r.id} style={styles.resenaCard}>
                  <View style={styles.resenaHeader}>
                    <View style={styles.resenaAvatar}>
                      <FotoPerfil ruta={r.autor?.avatar} nombre={r.autor?.nombre} radio={12} estiloTexto={styles.resenaAvatarText} />
                    </View>
                    <View style={styles.resenaHeaderInfo}>
                      <Text style={styles.resenaAutor}>{r.autor?.nombre ?? 'Vecino'}</Text>
                      <Text style={styles.resenaFecha}>{tiempoRelativo(r.creadoEn)}</Text>
                    </View>
                    <Estrellas valor={r.puntaje} tamano={12} />
                  </View>
                  {!!r.comentario && (
                    <Text style={styles.resenaComentario}>{r.comentario}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        </Aparecer>

        <View style={{ height:120 }} />
      </Reanimated.ScrollView>

      {/* Barra superior fija: aparece con el nombre al scrollear; volver y favorito siempre a mano */}
      <Reanimated.View pointerEvents="none" style={[styles.barraCompacta, { height: insets.top + 56, paddingTop: insets.top }, barraCompacta]}>
        <Text style={styles.barraNombre} numberOfLines={1}>{proveedor?.nombre}</Text>
      </Reanimated.View>
      <PressScale accessibilityLabel="Volver" hitSlop={10} style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()}>
        <Icono nombre="arrow-back" tamano={20} color="white" />
      </PressScale>
      {esCliente && (
        <BotonCorazon activo={favorito} onToggle={toggleFavorito} style={[styles.favBtn, { top: insets.top + 10 }]} />
      )}

      {/* Visor de fotos de trabajos */}
      <Modal visible={!!fotoAbierta} transparent animationType="fade" onRequestClose={() => setFotoAbierta(null)}>
        <Pressable style={styles.visor} onPress={() => setFotoAbierta(null)}>
          {fotoAbierta && <Image source={{ uri: archivoUrl(fotoAbierta)! }} style={styles.visorFoto} resizeMode="contain" />}
          <Text style={styles.visorCerrar}>Tocá para cerrar</Text>
        </Pressable>
      </Modal>

      {/* CTA fijo */}
      <View style={styles.bottomCta}>
        <PressScale haptico
          style={styles.chatBtn}
          onPress={() => Alert.alert('Chat', 'El chat con el proveedor se habilita cuando te acepta un pedido. Lo vas a encontrar en la pestaña Pedidos.')}
        >
          <Icono nombre="chatbubble-ellipses-outline" tamano={22} color={tema.texto} />
        </PressScale>
        <PressScale haptico
          style={styles.contratarBtn}
          onPress={() => {
            if (proveedor?.servicios?.length > 0) {
              router.push({ pathname:'/pedido/nuevo', params: paramsPedido(proveedor.servicios[0], id, proveedor?.nombre) })
            }
          }}
        >
          <Text style={styles.contratarText}>
            Contratar · desde ${proveedor?.servicios?.[0]?.precio?.toLocaleString('es-AR') ?? '—'}
          </Text>
        </PressScale>
      </View>
      <FondoBarraEstado color={Colors.dark} />
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:      { flex:1, backgroundColor:tema.bg },
  loadingWrap:    { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:tema.bg },
  hero:           { height:200, backgroundColor:'#1a1a1a', justifyContent:'flex-end', padding:20, overflow:'hidden' },
  favBtn:         { position:'absolute', top:52, right:20, width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,.12)', alignItems:'center', justifyContent:'center', zIndex:10 },
  avatarImg:      { width:'100%', height:'100%', borderRadius:17 },
  barraCompacta:  { position:'absolute', top:0, left:0, right:0, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', zIndex:5 },
  barraNombre:    { color:'white', fontSize:15, fontFamily: F.bold, maxWidth:'60%' },
  tabIndicador:   { position:'absolute', left:0, bottom:-1, width:100, height:2.5, borderRadius:2, backgroundColor:Colors.primary, transformOrigin:'left' },
  heroPattern:    { position:'absolute', inset:0, opacity:.15 },
  backBtn:        { position:'absolute', top:52, left:20, width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,.12)', alignItems:'center', justifyContent:'center', zIndex:10 },
  avatarWrap:     { flexDirection:'row', alignItems:'center', gap:14, marginBottom:8 },
  heroTextos:     { flex:1 },
  avatar:         { width:72, height:72, borderRadius:20, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:tema.bg, overflow:'hidden' },
  heroName:       { fontSize:20, fontFamily: F.extrabold, color:'white', marginBottom:2 },
  heroCat:        { fontFamily: F.regular, fontSize:12, color:'rgba(255,255,255,.6)' },
  // En el flujo, debajo del subtítulo: absoluta abajo a la derecha tapaba la ciudad
  badgesRow:      { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6 },
  badgeGreen:     { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(61,214,140,.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:100, borderWidth:1, borderColor:'rgba(61,214,140,.3)' },
  badgeGreenText: { fontSize:10, fontFamily: F.bold, color:'#3DD68C' },
  badgeYellow:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,210,63,.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:100, borderWidth:1, borderColor:'rgba(255,210,63,.3)' },
  badgeYellowText:{ fontSize:10, fontFamily: F.bold, color:'#FFD23F' },
  statsStrip:     { flexDirection:'row', backgroundColor:tema.card, marginHorizontal:20, marginTop:20, borderRadius:18, padding:16, shadowColor:tema.sombra, shadowOffset:{width:0,height:4}, shadowOpacity:.06, shadowRadius:12, elevation:3 },
  statItem:       { flex:1, alignItems:'center' },
  statBorder:     { borderLeftWidth:1, borderLeftColor:tema.border },
  statNum:        { fontSize:22, fontFamily: F.extrabold, color:tema.texto, marginBottom:2 },
  statLabel:      { fontFamily: F.regular, fontSize:10, color:tema.subTexto },
  tabs:           { flexDirection:'row', paddingHorizontal:20, marginTop:20, borderBottomWidth:1, borderBottomColor:tema.border },
  tab:            { paddingVertical:12, paddingHorizontal:14 },
  tabText:        { fontSize:13, fontFamily: F.semibold, color:tema.subTexto },
  tabTextActive:  { color:tema.texto },
  tabContent:     { padding:20 },
  aboutText:      { fontFamily: F.regular, fontSize:13, color:tema.subTexto, lineHeight:20, marginBottom:16 },
  infoRows:       { gap:12 },
  infoRow:        { flexDirection:'row', alignItems:'center', gap:10 },
  infoIco:        { width:32, height:32, borderRadius:10, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  infoText:       { fontFamily: F.regular, fontSize:13, color:tema.subTexto },
  // La tarjeta es el bloque entero: así las fotos del trabajo quedan adentro, no sueltas debajo
  serviceBlock:   { marginBottom:10, backgroundColor:tema.card, borderRadius:16, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  fotosRow:       { gap:8, paddingHorizontal:14, paddingBottom:14 },
  fotoMini:       { width:88, height:66, borderRadius:10, backgroundColor:tema.inputBg },
  visor:          { flex:1, backgroundColor:'rgba(0,0,0,.92)', alignItems:'center', justifyContent:'center' },
  visorFoto:      { width:'100%', height:'75%' },
  visorCerrar:    { fontFamily: F.regular, color:'rgba(255,255,255,.6)', fontSize:12, marginTop:16 },
  serviceCard:    { borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  serviceLeft:    { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  serviceIco:     { width:42, height:42, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceName:    { fontSize:14, fontFamily: F.bold, color:tema.texto, marginBottom:2 },
  serviceDesc:    { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  servicePrice:   { fontSize:16, fontFamily: F.extrabold, color:tema.texto },
  ratingBig:      { flexDirection:'row', alignItems:'center', gap:16, marginBottom:16 },
  ratingNum:      { fontSize:48, fontFamily: F.extrabold, color:tema.texto },
  ratingStars:    { marginBottom:4 },
  ratingCount:    { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  emptyTab:       { textAlign:'center', color:tema.subTexto, marginTop:20 },
  resenaCard:     { backgroundColor:tema.card, borderRadius:16, padding:14, marginBottom:10, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  resenaHeader:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 },
  resenaAvatar:   { width:36, height:36, borderRadius:12, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  resenaAvatarText:{ color:'white', fontSize:14, fontFamily: F.extrabold },
  resenaHeaderInfo:{ flex:1 },
  resenaAutor:    { fontSize:13, fontFamily: F.extrabold, color:tema.texto },
  resenaFecha:    { fontFamily: F.regular, fontSize:11, color:tema.subTexto, marginTop:1 },
  resenaComentario:{ fontFamily: F.regular, fontSize:13, color:tema.subTexto, lineHeight:19 },
  bottomCta:      { position:'absolute', bottom:0, left:0, right:0, backgroundColor:tema.card, padding:16, paddingBottom:32, flexDirection:'row', gap:10, borderTopWidth:1, borderTopColor:tema.border },
  chatBtn:        { width:50, height:50, borderRadius:14, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border, alignItems:'center', justifyContent:'center' },
  contratarBtn:   { flex:1, backgroundColor:tema.seleccion, borderRadius:14, paddingVertical:14, alignItems:'center' },
  contratarText:  { color:'white', fontSize:15, fontFamily: F.bold },
})
