import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Modal, Pressable, Switch, Alert, Image
} from 'react-native'
import { archivoUrl } from '../../constants/config'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import * as Location from 'expo-location'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import { CATEGORIAS as CATEGORIAS_SERVICIO, categoriaInfo } from '../../constants/categorias'
import { distanciaKm, formatearDistancia } from '../../utils/distancia'
import { serviciosService } from '../../services/servicios.service'
import { useTema, TemaTokens } from '../../store/temaStore'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { FUENTES as F } from '../../constants/diseno'
import { conEntrada } from '../../components/ui/Aparecer'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { obtenerPosicion, MENSAJE_UBICACION_APAGADA } from '../../utils/ubicacion'
import { textoRating } from '../../utils/rating'

function SkeletonServiceCard({ styles }: { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceLeft}>
        <SkeletonBlock width={48} height={48} borderRadius={14} />
        <View style={styles.serviceInfo}>
          <SkeletonBlock width="70%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="45%" height={11} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={90} height={16} borderRadius={100} />
        </View>
      </View>
      <SkeletonBlock width={44} height={16} />
    </View>
  )
}

const CATEGORIAS: { label: string; value: string; icono: NombreIcono }[] = [
  { label:'Todos', value:'', icono:'apps-outline' },
  ...CATEGORIAS_SERVICIO.map(c => ({ label: c.nombre, value: c.value, icono: c.icono })),
]

type Orden = 'rating' | 'precio_asc' | 'precio_desc' | 'cercanos'

interface Filtros {
  orden:       Orden
  ratingMin:   number | null
  precioMin:   string
  precioMax:   string
  verificados: boolean
}

const FILTROS_INICIALES: Filtros = { orden:'rating', ratingMin:null, precioMin:'', precioMax:'', verificados:false }

const ORDENES: { value: Orden; label: string; icono: NombreIcono }[] = [
  // Por defecto: primero los planes Premium y Pro, y dentro de cada grupo los mejor valorados
  { value:'rating',      label:'Recomendados',  icono:'star-outline' },
  { value:'cercanos',    label:'Más cercanos',  icono:'navigate-outline' },
  { value:'precio_asc',  label:'Menor precio',  icono:'trending-down-outline' },
  { value:'precio_desc', label:'Mayor precio',  icono:'trending-up-outline' },
]

const RATINGS: { value: number | null; label: string }[] = [
  { value:null, label:'Todos' }, { value:3, label:'3+' }, { value:4, label:'4+' }, { value:4.5, label:'4.5+' },
]

function cantidadFiltrosActivos(f: Filtros) {
  return [f.orden !== 'rating', f.ratingMin != null, !!f.precioMin, !!f.precioMax, f.verificados].filter(Boolean).length
}

export default function BuscarScreen() {
  const router = useRouter()
  const tema = useTema()
  const styles = getStyles(tema)
  const { categoria } = useLocalSearchParams<{ categoria?: string }>()
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [catActiva, setCatActiva] = useState(categoria ?? '')
  const [busqueda, setBusqueda]   = useState('')
  const [filtros, setFiltros]     = useState<Filtros>(FILTROS_INICIALES)
  const [borrador, setBorrador]   = useState<Filtros>(FILTROS_INICIALES) // lo que se edita en el panel
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [miUbicacion, setMiUbicacion]   = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    if (categoria !== undefined) setCatActiva(categoria)
  }, [categoria])

  // La busqueda por texto se hace en el servidor; se espera a que dejes de tipear
  useEffect(() => {
    const t = setTimeout(cargarServicios, busqueda ? 400 : 0)
    return () => clearTimeout(t)
  }, [catActiva, busqueda, filtros])

  async function cargarServicios() {
    setLoading(true)
    try {
      const data = await serviciosService.listarTodos({
        categoria:   catActiva || undefined,
        q:           busqueda.trim() || undefined,
        ratingMin:   filtros.ratingMin ?? undefined,
        precioMin:   filtros.precioMin ? Number(filtros.precioMin) : undefined,
        precioMax:   filtros.precioMax ? Number(filtros.precioMax) : undefined,
        verificados: filtros.verificados,
        orden:       filtros.orden === 'cercanos' ? 'rating' : filtros.orden,
      })
      setServicios(data)
    } catch {
      setServicios([])
    } finally {
      setLoading(false)
    }
  }

  async function aplicarFiltros() {
    if (borrador.orden === 'cercanos' && !miUbicacion) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Ubicación', 'Activá el permiso de ubicación para ordenar por cercanía')
          return
        }
        const pos = await obtenerPosicion()
        if (!pos) {
          Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Probá de nuevo en un momento.')
          return
        }
        setMiUbicacion(pos)
      } catch (e: any) {
        Alert.alert('Ubicación', e?.message === 'UBICACION_APAGADA' ? MENSAJE_UBICACION_APAGADA : 'No se pudo obtener tu ubicación')
        return
      }
    }
    setFiltros(borrador)
    setPanelAbierto(false)
  }

  function distanciaDe(s: any): number | null {
    const p = s.proveedor
    if (!miUbicacion || typeof p?.latitud !== 'number' || typeof p?.longitud !== 'number') return null
    return distanciaKm(miUbicacion, { latitude: p.latitud, longitude: p.longitud })
  }

  // "Más cercanos" se ordena en la app (el backend no sabe dónde estás); sin ubicación van al final
  const filtrados = filtros.orden !== 'cercanos' ? servicios : [...servicios].sort((a, b) => {
    const da = distanciaDe(a), db = distanciaDe(b)
    if (da == null) return 1
    if (db == null) return -1
    return da - db
  })
  const activos = cantidadFiltrosActivos(filtros)
  // Proveedores Premium: carrusel arriba de todo (solo con el orden por defecto)
  const recomendados = filtros.orden === 'rating'
    ? filtrados.filter(s => s.proveedor?.plan === 'PREMIUM').slice(0, 6)
    : []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchWrap}>
        <Icono nombre="search-outline" tamano={18} color={tema.subTexto} style={styles.searchIco} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar servicio o proveedor..."
          placeholderTextColor={tema.subTexto}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 &&
          <TouchableOpacity onPress={() => setBusqueda('')} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10}>
            <Icono nombre="close-circle" tamano={18} color={tema.subTexto} style={styles.clearBtn} />
          </TouchableOpacity>
        }
        <TouchableOpacity
          style={[styles.filtroBtn, activos > 0 && styles.filtroBtnActivo]}
          onPress={() => { setBorrador(filtros); setPanelAbierto(true) }}
          accessibilityRole="button"
          accessibilityLabel={activos > 0 ? `Filtros, ${activos} activos` : 'Filtros'}
          hitSlop={8}
        >
          <Icono nombre="options-outline" tamano={19} color={activos > 0 ? Colors.primary : tema.texto} />
          {activos > 0 && <View style={styles.filtroBadge}><Text style={styles.filtroBadgeText}>{activos}</Text></View>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIAS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.value}
        contentContainerStyle={styles.catsContainer}
        style={styles.catsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, catActiva === item.value && styles.catBtnActive]}
            onPress={() => setCatActiva(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: catActiva === item.value }}
          >
            <Icono nombre={item.icono} tamano={14} color={catActiva === item.value ? 'white' : tema.subTexto} />
            <Text style={[styles.catBtnText, catActiva === item.value && styles.catBtnTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {!loading && (
        <Text style={styles.contador}>
          <Text style={styles.contadorNum}>{filtrados.length}</Text> {filtrados.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
        </Text>
      )}

      {loading ? (
        <View style={styles.listContainer}>
          {[0, 1, 2, 3].map(i => <SkeletonServiceCard key={i} styles={styles} />)}
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={recomendados.length > 0 ? (
            <View style={styles.recoWrap}>
              <View style={styles.recoTituloFila}>
                <Icono nombre="diamond" tamano={15} color="#B8860B" />
                <Text style={styles.recoTitulo}>Recomendados</Text>
              </View>
              <FlatList
                data={recomendados}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={s => 'reco-' + s.id}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item: s }) => (
                  <PressScale style={styles.recoCard} onPress={() => router.push(`/proveedor/${s.proveedor?.id}`)}>
                    <View style={styles.recoIco}>
                      {s.fotos?.[0]
                        ? <Image source={{ uri: archivoUrl(s.fotos[0])! }} style={[StyleSheet.absoluteFill, { borderRadius: 11 }]} />
                        : <Icono nombre={categoriaInfo(s.categoria).icono} tamano={20} color={tema.dorado} />}
                    </View>
                    <Text style={styles.recoNombre} numberOfLines={1}>{s.nombre}</Text>
                    <Text style={styles.recoProveedor} numberOfLines={1}>{s.proveedor?.nombre}</Text>
                    <View style={styles.recoFila}>
                      <View style={styles.ratingFila}>
                        <Icono nombre="star" tamano={12} color="#F5B301" />
                        <Text style={styles.serviceRating}>{textoRating(s.proveedor?.rating)}</Text>
                      </View>
                      <Text style={styles.recoPrecio}>${s.precio?.toLocaleString('es-AR')}</Text>
                    </View>
                  </PressScale>
                )}
              />
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icono nombre="search-outline" tamano={44} color={tema.subTexto} style={styles.emptyIco} />
              <Text style={styles.emptyText}>No hay servicios disponibles</Text>
              <Text style={styles.emptySub}>{activos > 0 || busqueda ? 'Probá sacando algún filtro' : 'Intentá con otra categoría'}</Text>
            </View>
          }
          renderItem={conEntrada(({ item }) => (
            <TouchableOpacity
              style={[styles.serviceCard, item.proveedor?.plan === 'PREMIUM' && styles.serviceCardPremium]}
              onPress={() => router.push(`/proveedor/${item.proveedor?.id}`)}
            >
              <View style={styles.serviceLeft}>
                {/* La foto del trabajo muestra más que el ícono de la categoría */}
                <View style={styles.serviceIco}>
                  {item.fotos?.[0]
                    ? <Image source={{ uri: archivoUrl(item.fotos[0])! }} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                    : <Icono nombre={categoriaInfo(item.categoria).icono} tamano={22} color={Colors.primary} />}
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.nombre}</Text>
                  <View style={styles.proveedorFila}>
                    <View style={styles.proveedorMini}>
                      <FotoPerfil ruta={item.proveedor?.avatar} nombre={item.proveedor?.nombre} radio={9} estiloTexto={styles.proveedorMiniTexto} />
                    </View>
                    <Text style={styles.serviceProveedor} numberOfLines={1}>{item.proveedor?.nombre}</Text>
                  </View>
                  <View style={styles.serviceRow}>
                    <View style={styles.ratingFila}>
                      <Icono nombre="star" tamano={12} color="#F5B301" />
                      <Text style={styles.serviceRating}>{textoRating(item.proveedor?.rating)}</Text>
                    </View>
                    {item.proveedor?.verificado && (
                      <View style={styles.verifiedBadge}>
                        <Icono nombre="shield-checkmark" tamano={10} color={Colors.primary} />
                        <Text style={styles.verifiedText}>Verificado</Text>
                      </View>
                    )}
                    <PlanBadge plan={item.proveedor?.plan} rol="PROVEEDOR" oscuro={tema.esOscuro} />
                    {distanciaDe(item) != null && (
                      <View style={styles.ratingFila}>
                        <Icono nombre="location-outline" tamano={11} color={tema.subTexto} />
                        <Text style={styles.serviceDist}>{formatearDistancia(distanciaDe(item)!)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Text style={styles.servicePrice}>${item.precio?.toLocaleString('es-AR')}</Text>
            </TouchableOpacity>
          ))}
        />
      )}

      {/* Panel de filtros */}
      <Modal visible={panelAbierto} transparent animationType="slide" onRequestClose={() => setPanelAbierto(false)}>
        <Pressable style={styles.panelFondo} onPress={() => setPanelAbierto(false)} />
        <View style={styles.panel}>
          <View style={styles.panelHandle} />
          <Text style={styles.panelTitulo}>Filtros</Text>

          <Text style={styles.panelLabel}>ORDENAR POR</Text>
          <View style={styles.chips}>
            {ORDENES.map(o => (
              <TouchableOpacity key={o.value} style={[styles.chip, borrador.orden === o.value && styles.chipActivo]} onPress={() => setBorrador({ ...borrador, orden:o.value })}>
                <Icono nombre={o.icono} tamano={14} color={borrador.orden === o.value ? 'white' : tema.subTexto} />
                <Text style={[styles.chipText, borrador.orden === o.value && styles.chipTextActivo]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.panelLabel}>CALIFICACIÓN MÍNIMA</Text>
          <View style={styles.chips}>
            {RATINGS.map(r => (
              <TouchableOpacity key={String(r.value)} style={[styles.chip, borrador.ratingMin === r.value && styles.chipActivo]} onPress={() => setBorrador({ ...borrador, ratingMin:r.value })}>
                {r.value != null && <Icono nombre="star" tamano={13} color={borrador.ratingMin === r.value ? '#FFD23F' : '#F5B301'} />}
                <Text style={[styles.chipText, borrador.ratingMin === r.value && styles.chipTextActivo]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.panelLabel}>PRECIO</Text>
          <View style={styles.precioRow}>
            <TextInput style={styles.precioInput} placeholder="Mínimo" placeholderTextColor={tema.subTexto} keyboardType="numeric"
              value={borrador.precioMin} onChangeText={v => setBorrador({ ...borrador, precioMin:v.replace(/[^0-9]/g, '') })} />
            <Text style={styles.precioGuion}>—</Text>
            <TextInput style={styles.precioInput} placeholder="Máximo" placeholderTextColor={tema.subTexto} keyboardType="numeric"
              value={borrador.precioMax} onChangeText={v => setBorrador({ ...borrador, precioMax:v.replace(/[^0-9]/g, '') })} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Solo proveedores verificados</Text>
            <Switch value={borrador.verificados} onValueChange={v => setBorrador({ ...borrador, verificados:v })}
              trackColor={{ true:Colors.primary, false:'#ccc' }} thumbColor="white" />
          </View>

          <View style={styles.panelBotones}>
            <PressScale haptico style={styles.btnLimpiar} onPress={() => setBorrador(FILTROS_INICIALES)}>
              <Text style={styles.btnLimpiarText}>Limpiar</Text>
            </PressScale>
            <PressScale haptico style={styles.btnAplicar} onPress={aplicarFiltros}>
              <Text style={styles.btnAplicarText}>Ver resultados</Text>
            </PressScale>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:        { flex:1, backgroundColor:tema.bg },
  header:           { paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  title:            { fontSize:26, fontFamily: F.extrabold, color:tema.texto },
  searchWrap:       { flexDirection:'row', alignItems:'center', backgroundColor:tema.card, borderRadius:16, padding:12, marginHorizontal:22, marginBottom:14, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:3 },
  searchIco:        { marginRight:10 },
  searchInput:      { fontFamily: F.regular, flex:1, fontSize:14, color:tema.texto },
  clearBtn:         { padding:4 },
  filtroBtn:        { marginLeft:8, width:34, height:34, borderRadius:10, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center' },
  filtroBtnActivo:  { backgroundColor:Colors.greenLight },
  filtroBadge:      { position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  filtroBadgeText:  { color:'white', fontSize:9, fontFamily: F.extrabold },
  serviceDist:      { fontSize:10, fontFamily: F.semibold, color:tema.subTexto },
  panelFondo:       { flex:1, backgroundColor:'rgba(0,0,0,.4)' },
  panel:            { backgroundColor:tema.card, borderTopLeftRadius:26, borderTopRightRadius:26, padding:22, paddingBottom:34 },
  panelHandle:      { alignSelf:'center', width:40, height:4, borderRadius:2, backgroundColor:tema.border, marginBottom:14 },
  panelTitulo:      { fontSize:20, fontFamily: F.extrabold, color:tema.texto, marginBottom:16 },
  panelLabel:       { fontSize:11, fontFamily: F.bold, color:tema.subTexto, letterSpacing:1.2, marginBottom:8 },
  chips:            { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:18 },
  chip:             { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:tema.bg, borderWidth:1.5, borderColor:tema.border },
  chipActivo:       { backgroundColor:tema.seleccion, borderColor:tema.seleccion },
  chipText:         { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  chipTextActivo:   { color:'white' },
  precioRow:        { flexDirection:'row', alignItems:'center', gap:10, marginBottom:18 },
  precioInput:      { fontFamily: F.regular, flex:1, backgroundColor:tema.inputBg, borderRadius:12, paddingHorizontal:14, paddingVertical:10, fontSize:14, color:tema.texto },
  precioGuion:      { color:tema.subTexto },
  switchRow:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:22 },
  switchLabel:      { fontSize:14, fontFamily: F.semibold, color:tema.texto },
  panelBotones:     { flexDirection:'row', gap:10 },
  btnLimpiar:       { flex:1, paddingVertical:14, borderRadius:14, borderWidth:1.5, borderColor:tema.border, alignItems:'center' },
  btnLimpiarText:   { fontSize:14, fontFamily: F.bold, color:tema.texto },
  btnAplicar:       { flex:2, paddingVertical:14, borderRadius:14, backgroundColor:tema.seleccion, alignItems:'center' },
  btnAplicarText:   { fontSize:14, fontFamily: F.bold, color:'white' },
  // Sin flexGrow/flexShrink 0 la lista de abajo le robaba altura y los chips quedaban cortados
  catsList:         { flexGrow:0, flexShrink:0, marginBottom:14 },
  catsContainer:    { paddingHorizontal:22, gap:8 },
  catBtn:           { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  catBtnActive:     { backgroundColor:tema.seleccion, borderColor:tema.seleccion },
  catBtnText:       { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  catBtnTextActive: { color:'white' },
  contador:         { fontFamily: F.regular, paddingHorizontal:22, marginBottom:12, fontSize:12, color:tema.subTexto },
  contadorNum:      { color:tema.texto, fontFamily: F.bold },
  listContainer:    { paddingHorizontal:22, gap:12, paddingBottom:100 },
  serviceCard:      { backgroundColor:tema.card, borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  serviceCardPremium: { borderWidth:1.5, borderColor:'rgba(255,210,63,.6)' },
  recoWrap:         { marginBottom:6 },
  recoTituloFila:   { flexDirection:'row', alignItems:'center', gap:6, marginBottom:10 },
  recoTitulo:       { fontSize:15, fontFamily: F.extrabold, color:tema.texto },
  ratingFila:       { flexDirection:'row', alignItems:'center', gap:3 },
  recoCard:         { width:170, backgroundColor:tema.card, borderRadius:18, padding:14, gap:2, borderWidth:2, borderColor:'#FFD23F' },
  recoIco:          { width:38, height:38, borderRadius:11, backgroundColor:'rgba(255,210,63,.2)', alignItems:'center', justifyContent:'center', marginBottom:6 },
  recoNombre:       { fontSize:14, fontFamily: F.bold, color:tema.texto },
  recoProveedor:    { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  recoFila:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:6 },
  recoPrecio:       { fontSize:14, fontFamily: F.extrabold, color:tema.texto },
  serviceLeft:      { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  serviceIco:       { width:48, height:48, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceInfo:      { flex:1 },
  serviceName:      { fontSize:14, fontFamily: F.bold, color:tema.texto, marginBottom:2 },
  serviceProveedor: { flexShrink:1, fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  proveedorFila:    { flexDirection:'row', alignItems:'center', gap:5, marginBottom:6 },
  proveedorMini:    { width:18, height:18, borderRadius:9, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  proveedorMiniTexto:{ color:'white', fontSize:9, fontFamily: F.bold },
  serviceRow:       { flexDirection:'row', alignItems:'center', gap:8 },
  serviceRating:    { fontSize:11, fontFamily: F.bold, color:tema.texto },
  verifiedBadge:    { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:Colors.greenLight, paddingHorizontal:8, paddingVertical:2, borderRadius:100 },
  verifiedText:     { fontSize:9, fontFamily: F.bold, color:Colors.primary },
  servicePrice:     { fontSize:16, fontFamily: F.extrabold, color:tema.texto },
  empty:            { alignItems:'center', paddingTop:60 },
  emptyIco:         { marginBottom:12, opacity:.5 },
  emptyText:        { fontSize:16, fontFamily: F.bold, color:tema.subTexto },
  emptySub:         { fontFamily: F.regular, fontSize:13, color:tema.subTexto, marginTop:4 },
})
