import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import { serviciosService } from '../../services/servicios.service'

const CATEGORIAS = [
  { label:'Todos',        value:'' },
  { label:'Plomería',     value:'plomeria' },
  { label:'Electricidad', value:'electricidad' },
  { label:'Albañilería',  value:'albanileria' },
  { label:'Carpintería',  value:'carpinteria' },
  { label:'Jardín',       value:'jardin' },
  { label:'Limpieza',     value:'limpieza' },
  { label:'Pintura',      value:'pintura' },
]

export default function BuscarScreen() {
  const router = useRouter()
  const { categoria } = useLocalSearchParams<{ categoria?: string }>()
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [catActiva, setCatActiva] = useState(categoria ?? '')
  const [busqueda, setBusqueda]   = useState('')

  useEffect(() => {
    if (categoria !== undefined) setCatActiva(categoria)
  }, [categoria])

  useEffect(() => {
    cargarServicios()
  }, [catActiva])

  async function cargarServicios() {
    setLoading(true)
    try {
      const data = await serviciosService.listarTodos({ categoria: catActiva || undefined })
      setServicios(data)
    } catch {
      setServicios([])
    } finally {
      setLoading(false)
    }
  }

  const filtrados = servicios.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.proveedor?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

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
          placeholderTextColor="#bbb"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 &&
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        }
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
        <ActivityIndicator color={Colors.primary} style={{ marginTop:40 }} />
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
              <Text style={styles.emptySub}>Intentá con otra categoría</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push(`/proveedor/${item.proveedor?.id}`)}
            >
              <View style={styles.serviceLeft}>
                <View style={styles.serviceIco}>
                  <Text style={styles.serviceIcoText}>🔧</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.nombre}</Text>
                  <Text style={styles.serviceProveedor}>{item.proveedor?.nombre}</Text>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceRating}>⭐ {item.proveedor?.rating?.toFixed(1) ?? '0.0'}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verificado</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.servicePrice}>${item.precio?.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:Colors.cream },
  header:           { paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  title:            { fontSize:26, fontWeight:'900', color:Colors.dark },
  searchWrap:       { flexDirection:'row', alignItems:'center', backgroundColor:'white', borderRadius:16, padding:12, marginHorizontal:22, marginBottom:14, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:3 },
  searchIco:        { fontSize:16, marginRight:10 },
  searchInput:      { flex:1, fontSize:14, color:Colors.dark },
  clearBtn:         { fontSize:14, color:'#bbb', padding:4 },
  catsList:         { maxHeight:48, marginBottom:14 },
  catsContainer:    { paddingHorizontal:22, gap:8 },
  catBtn:           { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  catBtnActive:     { backgroundColor:Colors.dark, borderColor:Colors.dark },
  catBtnText:       { fontSize:12, fontWeight:'600', color:'#555' },
  catBtnTextActive: { color:'white' },
  contador:         { paddingHorizontal:22, marginBottom:12, fontSize:12, color:Colors.gray },
  contadorNum:      { color:Colors.dark, fontWeight:'700' },
  listContainer:    { paddingHorizontal:22, gap:12, paddingBottom:100 },
  serviceCard:      { backgroundColor:'white', borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  serviceLeft:      { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  serviceIco:       { width:48, height:48, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceIcoText:   { fontSize:22 },
  serviceInfo:      { flex:1 },
  serviceName:      { fontSize:14, fontWeight:'700', color:Colors.dark, marginBottom:2 },
  serviceProveedor: { fontSize:11, color:Colors.gray, marginBottom:6 },
  serviceRow:       { flexDirection:'row', alignItems:'center', gap:8 },
  serviceRating:    { fontSize:11, fontWeight:'700', color:Colors.dark },
  verifiedBadge:    { backgroundColor:Colors.greenLight, paddingHorizontal:8, paddingVertical:2, borderRadius:100 },
  verifiedText:     { fontSize:9, fontWeight:'700', color:Colors.primary },
  servicePrice:     { fontSize:16, fontWeight:'900', color:Colors.dark },
  empty:            { alignItems:'center', paddingTop:60 },
  emptyIco:         { fontSize:48, marginBottom:12, opacity:.3 },
  emptyText:        { fontSize:16, fontWeight:'700', color:Colors.gray },
  emptySub:         { fontSize:13, color:'#bbb', marginTop:4 },
})
