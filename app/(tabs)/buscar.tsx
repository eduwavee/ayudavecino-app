import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Modal, Pressable, Switch, Alert
} from 'react-native'
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

const CATEGORIAS = [
  { label:'Todos', value:'' },
  ...CATEGORIAS_SERVICIO.map(c => ({ label: c.nombre, value: c.value })),
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

const ORDENES: { value: Orden; label: string }[] = [
  { value:'rating',      label:'⭐ Mejor valorados' },
  { value:'cercanos',    label:'📍 Más cercanos' },
  { value:'precio_asc',  label:'💲 Menor precio' },
  { value:'precio_desc', label:'💰 Mayor precio' },
]

const RATINGS: { value: number | null; label: string }[] = [
  { value:null, label:'Todos' }, { value:3, label:'3+ ⭐' }, { value:4, label:'4+ ⭐' }, { value:4.5, label:'4.5+ ⭐' },
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
        const pos = await Location.getCurrentPositionAsync({})
        setMiUbicacion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      } catch {
        Alert.alert('Ubicación', 'No se pudo obtener tu ubicación')
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIco}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar servicio o proveedor..."
          placeholderTextColor={tema.subTexto}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 &&
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        }
        <TouchableOpacity
          style={[styles.filtroBtn, activos > 0 && styles.filtroBtnActivo]}
          onPress={() => { setBorrador(filtros); setPanelAbierto(true) }}
        >
          <Text style={styles.filtroBtnIco}>⚙️</Text>
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
          >
            <Text style={[styles.catBtnText, catActiva === item.value && styles.catBtnTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {!loading && (
        <Text style={styles.contador}>
          <Text style={styles.contadorNum}>{filtrados.length}</Text> servicios encontrados
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>🔍</Text>
              <Text style={styles.emptyText}>No hay servicios disponibles</Text>
              <Text style={styles.emptySub}>{activos > 0 || busqueda ? 'Probá sacando algún filtro' : 'Intentá con otra categoría'}</Text>
            </View>
          }
          renderItem={conEntrada(({ item }) => (
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push(`/proveedor/${item.proveedor?.id}`)}
            >
              <View style={styles.serviceLeft}>
                <View style={styles.serviceIco}>
                  <Text style={styles.serviceIcoText}>{categoriaInfo(item.categoria).ico}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.nombre}</Text>
                  <Text style={styles.serviceProveedor}>{item.proveedor?.nombre}</Text>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceRating}>⭐ {item.proveedor?.rating?.toFixed(1) ?? '0.0'}</Text>
                    {item.proveedor?.verificado && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Verificado</Text>
                      </View>
                    )}
                    {distanciaDe(item) != null && (
                      <Text style={styles.serviceDist}>📍 {formatearDistancia(distanciaDe(item)!)}</Text>
                    )}
                  </View>
                </View>
              </View>
              <Text style={styles.servicePrice}>${item.precio?.toLocaleString()}</Text>
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
                <Text style={[styles.chipText, borrador.orden === o.value && styles.chipTextActivo]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.panelLabel}>CALIFICACIÓN MÍNIMA</Text>
          <View style={styles.chips}>
            {RATINGS.map(r => (
              <TouchableOpacity key={String(r.value)} style={[styles.chip, borrador.ratingMin === r.value && styles.chipActivo]} onPress={() => setBorrador({ ...borrador, ratingMin:r.value })}>
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
            <TouchableOpacity style={styles.btnLimpiar} onPress={() => setBorrador(FILTROS_INICIALES)}>
              <Text style={styles.btnLimpiarText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAplicar} onPress={aplicarFiltros}>
              <Text style={styles.btnAplicarText}>Ver resultados</Text>
            </TouchableOpacity>
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
  searchIco:        { fontFamily: F.regular, fontSize:16, marginRight:10 },
  searchInput:      { fontFamily: F.regular, flex:1, fontSize:14, color:tema.texto },
  clearBtn:         { fontFamily: F.regular, fontSize:14, color:tema.subTexto, padding:4 },
  filtroBtn:        { marginLeft:8, width:34, height:34, borderRadius:10, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center' },
  filtroBtnActivo:  { backgroundColor:Colors.greenLight },
  filtroBtnIco:     { fontFamily: F.regular, fontSize:15 },
  filtroBadge:      { position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  filtroBadgeText:  { color:'white', fontSize:9, fontFamily: F.extrabold },
  serviceDist:      { fontSize:10, fontFamily: F.semibold, color:tema.subTexto },
  panelFondo:       { flex:1, backgroundColor:'rgba(0,0,0,.4)' },
  panel:            { backgroundColor:tema.card, borderTopLeftRadius:26, borderTopRightRadius:26, padding:22, paddingBottom:34 },
  panelHandle:      { alignSelf:'center', width:40, height:4, borderRadius:2, backgroundColor:tema.border, marginBottom:14 },
  panelTitulo:      { fontSize:20, fontFamily: F.extrabold, color:tema.texto, marginBottom:16 },
  panelLabel:       { fontSize:11, fontFamily: F.bold, color:tema.subTexto, letterSpacing:1.2, marginBottom:8 },
  chips:            { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:18 },
  chip:             { paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:tema.bg, borderWidth:1.5, borderColor:tema.border },
  chipActivo:       { backgroundColor:Colors.dark, borderColor:Colors.dark },
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
  btnAplicar:       { flex:2, paddingVertical:14, borderRadius:14, backgroundColor:Colors.dark, alignItems:'center' },
  btnAplicarText:   { fontSize:14, fontFamily: F.bold, color:'white' },
  catsList:         { maxHeight:48, marginBottom:14 },
  catsContainer:    { paddingHorizontal:22, gap:8 },
  catBtn:           { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  catBtnActive:     { backgroundColor:Colors.dark, borderColor:Colors.dark },
  catBtnText:       { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  catBtnTextActive: { color:'white' },
  contador:         { fontFamily: F.regular, paddingHorizontal:22, marginBottom:12, fontSize:12, color:tema.subTexto },
  contadorNum:      { color:tema.texto, fontFamily: F.bold },
  listContainer:    { paddingHorizontal:22, gap:12, paddingBottom:100 },
  serviceCard:      { backgroundColor:tema.card, borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  serviceLeft:      { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  serviceIco:       { width:48, height:48, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceIcoText:   { fontFamily: F.regular, fontSize:22 },
  serviceInfo:      { flex:1 },
  serviceName:      { fontSize:14, fontFamily: F.bold, color:tema.texto, marginBottom:2 },
  serviceProveedor: { fontFamily: F.regular, fontSize:11, color:tema.subTexto, marginBottom:6 },
  serviceRow:       { flexDirection:'row', alignItems:'center', gap:8 },
  serviceRating:    { fontSize:11, fontFamily: F.bold, color:tema.texto },
  verifiedBadge:    { backgroundColor:Colors.greenLight, paddingHorizontal:8, paddingVertical:2, borderRadius:100 },
  verifiedText:     { fontSize:9, fontFamily: F.bold, color:Colors.primary },
  servicePrice:     { fontSize:16, fontFamily: F.extrabold, color:tema.texto },
  empty:            { alignItems:'center', paddingTop:60 },
  emptyIco:         { fontFamily: F.regular, fontSize:48, marginBottom:12, opacity:.3 },
  emptyText:        { fontSize:16, fontFamily: F.bold, color:tema.subTexto },
  emptySub:         { fontFamily: F.regular, fontSize:13, color:tema.subTexto, marginTop:4 },
})
