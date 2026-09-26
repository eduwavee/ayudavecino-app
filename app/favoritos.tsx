import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors } from '../constants/colors'
import { categoriaInfo } from '../constants/categorias'
import { favoritosService } from '../services/favoritos.service'
import { useTema, TemaTokens } from '../store/temaStore'
import { FUENTES as F } from '../constants/diseno'
import { conEntrada } from '../components/ui/Aparecer'
import { PressScale } from '../components/ui/PressScale'
import { Icono } from '../components/ui/Icono'
import { FondoBarraEstado } from '../components/ui/FondoBarraEstado'
import { textoRating } from '../utils/rating'

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
        <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
          <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
        </PressScale>
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
              <View style={styles.emptyIco}><Icono nombre="heart-outline" tamano={34} color="#E0475B" /></View>
              <Text style={styles.emptyTitle}>Todavía no guardaste proveedores</Text>
              <Text style={styles.emptySub}>Tocá el corazón en el perfil de un proveedor para tenerlo a mano acá.</Text>
            </View>
          }
          renderItem={conEntrada(({ item: p }) => {
            const cat = categoriaInfo(p.servicios?.[0]?.categoria)
            const precioMin = p.servicios?.length ? Math.min(...p.servicios.map((s: any) => s.precio)) : null
            return (
              <TouchableOpacity style={styles.card} activeOpacity={.8} onPress={() => router.push(`/proveedor/${p.id}`)}>
                <View style={styles.ico}><Icono nombre={cat.icono} tamano={24} color={Colors.primary} /></View>
                <View style={styles.info}>
                  <View style={styles.fila}>
                    <Text style={styles.nombre}>{p.nombre}</Text>
                    {p.verificado && <Icono nombre="shield-checkmark" tamano={14} color={Colors.primary} />}
                  </View>
                  <View style={styles.fila}>
                    <Text style={styles.sub}>{cat.nombre} ·</Text>
                    <Icono nombre="star" tamano={11} color="#F5B301" />
                    <Text style={styles.sub}>{textoRating(p.rating)}</Text>
                  </View>
                  {precioMin != null && <Text style={styles.precio}>desde ${precioMin.toLocaleString('es-AR')}</Text>}
                </View>
                <TouchableOpacity onPress={() => quitar(p)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar a ${p.nombre} de favoritos`}>
                  <Icono nombre="heart" tamano={22} color="#FF4D5E" />
                </TouchableOpacity>
              </TouchableOpacity>
            )
          })}
        />
      )}
      <FondoBarraEstado color={tema.bg} />
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:  { flex:1, backgroundColor:tema.bg },
  header:     { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:    { width:38, height:38, borderRadius:12, backgroundColor:tema.overlay, alignItems:'center', justifyContent:'center' },
  title:      { fontSize:24, fontFamily: F.extrabold, color:tema.texto },
  list:       { paddingHorizontal:22, paddingBottom:40, flexGrow:1 },
  card:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:tema.card, borderRadius:18, padding:14, marginBottom:10, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  ico:        { width:50, height:50, borderRadius:15, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  info:       { flex:1 },
  fila:       { flexDirection:'row', alignItems:'center', gap:4, marginBottom:2 },
  nombre:     { fontSize:15, fontFamily: F.extrabold, color:tema.texto, flexShrink:1 },
  sub:        { fontFamily: F.regular, fontSize:12, color:tema.subTexto },
  precio:     { fontSize:12, fontFamily: F.bold, color:Colors.primary, marginTop:3 },
  empty:      { alignItems:'center', paddingTop:80, paddingHorizontal:30 },
  emptyIco:   { width:76, height:76, borderRadius:24, backgroundColor:'rgba(224,71,91,.1)', alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle: { fontSize:16, fontFamily: F.extrabold, color:tema.texto, marginBottom:6, textAlign:'center' },
  emptySub:   { fontFamily: F.regular, fontSize:13, color:tema.subTexto, textAlign:'center', lineHeight:19 },
})
