import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { usuariosService } from '../../services/usuarios.service'
import { resenasService } from '../../services/resenas.service'
import { SkeletonBlock } from '../../components/ui/Skeleton'

const TABS = ['Sobre mí', 'Servicios', 'Reseñas']

function SkeletonPerfilProveedor() {
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
  const [proveedor, setProveedor] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [tabActiva, setTabActiva] = useState('Sobre mí')

  const [resenas, setResenas]         = useState<any[]>([])
  const [promedio, setPromedio]       = useState('0.0')
  const [loadingResenas, setLoadingResenas] = useState(true)

  useEffect(() => {
    if (id) {
      cargarProveedor()
      cargarResenas()
    }
  }, [id])

  async function cargarProveedor() {
    try {
      const data = await usuariosService.obtenerPerfil(id)
      setProveedor(data)
    } catch {
      router.back()
    } finally {
      setLoading(false)
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
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroPattern} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIco}>🔧</Text>
            </View>
            <View>
              <Text style={styles.heroName}>{proveedor?.nombre}</Text>
              <Text style={styles.heroCat}>Tucumán</Text>
            </View>
          </View>
          <View style={styles.badgesRow}>
            <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>✓ Verificado</Text></View>
            <View style={styles.badgeYellow}><Text style={styles.badgeYellowText}>⭐ Top rated</Text></View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color:Colors.primary }]}>{proveedor?.rating?.toFixed(1) ?? '0.0'}</Text>
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
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tabActiva === t && styles.tabActive]} onPress={() => setTabActiva(t)}>
              <Text style={[styles.tabText, tabActiva === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Sobre mí */}
        {tabActiva === 'Sobre mí' && (
          <View style={styles.tabContent}>
            <Text style={styles.aboutText}>Profesional con experiencia en su área. Trabajo en toda la zona de Tucumán capital y alrededores.</Text>
            <View style={styles.infoRows}>
              <View style={styles.infoRow}><Text style={styles.infoIco}>📍</Text><Text style={styles.infoText}>San Miguel de Tucumán</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoIco}>⚡</Text><Text style={styles.infoText}>Responde rápido</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoIco}>🆔</Text><Text style={styles.infoText}>Identidad verificada</Text></View>
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
              <TouchableOpacity
                key={s.id}
                style={styles.serviceCard}
                onPress={() => router.push({ pathname:'/pedido/nuevo', params:{ servicioId:s.id, servicioNombre:s.nombre, precio:s.precio, proveedorId:id } })}
              >
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceIco}><Text style={{fontSize:20}}>🔧</Text></View>
                  <View>
                    <Text style={styles.serviceName}>{s.nombre}</Text>
                    <Text style={styles.serviceDesc}>{s.descripcion}</Text>
                  </View>
                </View>
                <Text style={styles.servicePrice}>${s.precio?.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab: Reseñas */}
        {tabActiva === 'Reseñas' && (
          <View style={styles.tabContent}>
            <View style={styles.ratingBig}>
              <Text style={styles.ratingNum}>{promedio}</Text>
              <View>
                <Text style={styles.ratingStars}>
                  {'⭐'.repeat(Math.round(Number(promedio))) || '☆'}
                </Text>
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
                      <Text style={styles.resenaAvatarText}>
                        {r.autor?.nombre?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.resenaHeaderInfo}>
                      <Text style={styles.resenaAutor}>{r.autor?.nombre ?? 'Vecino'}</Text>
                      <Text style={styles.resenaFecha}>{tiempoRelativo(r.creadoEn)}</Text>
                    </View>
                    <Text style={styles.resenaEstrellas}>{'⭐'.repeat(r.puntaje)}</Text>
                  </View>
                  {!!r.comentario && (
                    <Text style={styles.resenaComentario}>{r.comentario}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height:120 }} />
      </ScrollView>

      {/* CTA fijo */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.chatBtn}>
          <Text style={{fontSize:20}}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contratarBtn}
          onPress={() => {
            if (proveedor?.servicios?.length > 0) {
              const s = proveedor.servicios[0]
              router.push({ pathname:'/pedido/nuevo', params:{ servicioId:s.id, servicioNombre:s.nombre, precio:s.precio, proveedorId:id } })
            }
          }}
        >
          <Text style={styles.contratarText}>
            Contratar · desde ${proveedor?.servicios?.[0]?.precio?.toLocaleString() ?? '—'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.cream },
  loadingWrap:    { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:Colors.cream },
  hero:           { height:200, backgroundColor:'#1a1a1a', justifyContent:'flex-end', padding:20, overflow:'hidden' },
  heroPattern:    { position:'absolute', inset:0, opacity:.15 },
  backBtn:        { position:'absolute', top:52, left:20, width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,.12)', alignItems:'center', justifyContent:'center' },
  backText:       { color:'white', fontSize:16 },
  avatarWrap:     { flexDirection:'row', alignItems:'flex-end', gap:14, marginBottom:8 },
  avatar:         { width:72, height:72, borderRadius:20, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor:Colors.cream },
  avatarIco:      { fontSize:32 },
  heroName:       { fontSize:20, fontWeight:'900', color:'white', marginBottom:2 },
  heroCat:        { fontSize:12, color:'rgba(255,255,255,.6)' },
  badgesRow:      { flexDirection:'row', gap:6, position:'absolute', bottom:14, right:20 },
  badgeGreen:     { backgroundColor:'rgba(61,214,140,.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:100, borderWidth:1, borderColor:'rgba(61,214,140,.3)' },
  badgeGreenText: { fontSize:10, fontWeight:'700', color:'#3DD68C' },
  badgeYellow:    { backgroundColor:'rgba(255,210,63,.2)', paddingHorizontal:10, paddingVertical:4, borderRadius:100, borderWidth:1, borderColor:'rgba(255,210,63,.3)' },
  badgeYellowText:{ fontSize:10, fontWeight:'700', color:'#FFD23F' },
  statsStrip:     { flexDirection:'row', backgroundColor:'white', marginHorizontal:20, marginTop:20, borderRadius:18, padding:16, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.06, shadowRadius:12, elevation:3 },
  statItem:       { flex:1, alignItems:'center' },
  statBorder:     { borderLeftWidth:1, borderLeftColor:Colors.border },
  statNum:        { fontSize:22, fontWeight:'900', color:Colors.dark, marginBottom:2 },
  statLabel:      { fontSize:10, color:Colors.gray },
  tabs:           { flexDirection:'row', paddingHorizontal:20, marginTop:20, borderBottomWidth:1, borderBottomColor:Colors.border },
  tab:            { paddingVertical:10, paddingHorizontal:14, borderBottomWidth:2, borderBottomColor:'transparent', marginBottom:-1 },
  tabActive:      { borderBottomColor:Colors.dark },
  tabText:        { fontSize:13, fontWeight:'600', color:'#aaa' },
  tabTextActive:  { color:Colors.dark },
  tabContent:     { padding:20 },
  aboutText:      { fontSize:13, color:'#555', lineHeight:20, marginBottom:16 },
  infoRows:       { gap:12 },
  infoRow:        { flexDirection:'row', alignItems:'center', gap:10 },
  infoIco:        { fontSize:16 },
  infoText:       { fontSize:13, color:'#555' },
  serviceCard:    { backgroundColor:'white', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  serviceLeft:    { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  serviceIco:     { width:42, height:42, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceName:    { fontSize:14, fontWeight:'700', color:Colors.dark, marginBottom:2 },
  serviceDesc:    { fontSize:11, color:Colors.gray },
  servicePrice:   { fontSize:16, fontWeight:'900', color:Colors.dark },
  ratingBig:      { flexDirection:'row', alignItems:'center', gap:16, marginBottom:16 },
  ratingNum:      { fontSize:48, fontWeight:'900', color:Colors.dark },
  ratingStars:    { fontSize:16, marginBottom:4 },
  ratingCount:    { fontSize:11, color:Colors.gray },
  emptyTab:       { textAlign:'center', color:Colors.gray, marginTop:20 },
  resenaCard:     { backgroundColor:'white', borderRadius:16, padding:14, marginBottom:10, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  resenaHeader:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 },
  resenaAvatar:   { width:36, height:36, borderRadius:12, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  resenaAvatarText:{ color:'white', fontSize:14, fontWeight:'900' },
  resenaHeaderInfo:{ flex:1 },
  resenaAutor:    { fontSize:13, fontWeight:'800', color:Colors.dark },
  resenaFecha:    { fontSize:11, color:Colors.gray, marginTop:1 },
  resenaEstrellas:{ fontSize:11 },
  resenaComentario:{ fontSize:13, color:'#555', lineHeight:19 },
  bottomCta:      { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'white', padding:16, paddingBottom:32, flexDirection:'row', gap:10, borderTopWidth:1, borderTopColor:Colors.border },
  chatBtn:        { width:50, height:50, borderRadius:14, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border, alignItems:'center', justifyContent:'center' },
  contratarBtn:   { flex:1, backgroundColor:Colors.dark, borderRadius:14, paddingVertical:14, alignItems:'center' },
  contratarText:  { color:'white', fontSize:15, fontWeight:'700' },
})
