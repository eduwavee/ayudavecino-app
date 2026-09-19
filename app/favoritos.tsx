import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors } from '../constants/colors'
import { categoriaInfo } from '../constants/categorias'
import { favoritosService } from '../services/favoritos.service'
import { useTema, TemaTokens } from '../store/temaStore'

// Proveedores que el cliente guardó con el corazón en su perfil
export default function FavoritosScreen() {
  const router = useRouter()
  const tema   = useTema()
  const styles = getStyles(tema)
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    try {
      setFavoritos(await favoritosService.listar())
    } catch {
      setFavoritos([])
    } finally {
      setLoading(false)
    }
  }

  function quitar(p: any) {
    Alert.alert('¿Quitar de favoritos?', p.nombre, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: async () => {
        setFavoritos(prev => prev.filter(f => f.id !== p.id))
        try { await favoritosService.quitar(p.id) } catch { cargar() }
      } },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis favoritos</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>🤍</Text>
              <Text style={styles.emptyTitle}>Todavía no guardaste proveedores</Text>
              <Text style={styles.emptySub}>Tocá el corazón en el perfil de un proveedor para tenerlo a mano acá.</Text>
            </View>
          }
          renderItem={({ item: p }) => {
            const cat = categoriaInfo(p.servicios?.[0]?.categoria)
            const precioMin = p.servicios?.length ? Math.min(...p.servicios.map((s: any) => s.precio)) : null
            return (
              <TouchableOpacity style={styles.card} activeOpacity={.8} onPress={() => router.push(`/proveedor/${p.id}`)}>
                <View style={styles.ico}><Text style={{ fontSize:24 }}>{cat.ico}</Text></View>
                <View style={styles.info}>
                  <Text style={styles.nombre}>{p.nombre}{p.verificado ? '  ✓' : ''}</Text>
                  <Text style={styles.sub}>{cat.nombre} · ⭐ {p.rating?.toFixed(1) ?? '0.0'}</Text>
                  {precioMin != null && <Text style={styles.precio}>desde ${precioMin.toLocaleString('es-AR')}</Text>}
                </View>
                <TouchableOpacity onPress={() => quitar(p)} hitSlop={10}>
                  <Text style={styles.corazon}>❤️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:  { flex:1, backgroundColor:tema.bg },
  header:     { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:    { width:38, height:38, borderRadius:12, backgroundColor:tema.overlay, alignItems:'center', justifyContent:'center' },
  backText:   { fontSize:16, color:tema.texto },
  title:      { fontSize:24, fontWeight:'900', color:tema.texto },
  list:       { paddingHorizontal:22, paddingBottom:40, flexGrow:1 },
  card:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:tema.card, borderRadius:18, padding:14, marginBottom:10, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  ico:        { width:50, height:50, borderRadius:15, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  info:       { flex:1 },
  nombre:     { fontSize:15, fontWeight:'800', color:tema.texto, marginBottom:2 },
  sub:        { fontSize:12, color:tema.subTexto },
  precio:     { fontSize:12, fontWeight:'700', color:Colors.primary, marginTop:3 },
  corazon:    { fontSize:20 },
  empty:      { alignItems:'center', paddingTop:80, paddingHorizontal:30 },
  emptyIco:   { fontSize:52, marginBottom:14 },
  emptyTitle: { fontSize:16, fontWeight:'800', color:tema.texto, marginBottom:6, textAlign:'center' },
  emptySub:   { fontSize:13, color:tema.subTexto, textAlign:'center', lineHeight:19 },
})
