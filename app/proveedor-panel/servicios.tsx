import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors } from '../../constants/colors'
import { serviciosService } from '../../services/servicios.service'
import { useAuthStore } from '../../store/authStore'

const CAT_ICOS: Record<string,string> = {
  plomeria:'🔧', electricidad:'⚡', albanileria:'🏗️',
  carpinteria:'🪟', jardin:'🌿', limpieza:'🧹', pintura:'🎨',
}

export default function ServiciosProveedorScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useFocusEffect(useCallback(() => { cargarServicios() }, []))

  async function cargarServicios() {
    if (!usuario?.id) return
    try {
      const data = await serviciosService.serviciosDeProveedor(usuario.id)
      setServicios(data)
    } catch { setServicios([]) }
    finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Servicios</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/proveedor-panel/nuevo-servicio')}
        >
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>🔧</Text>
              <Text style={styles.emptyTitle}>Sin servicios publicados</Text>
              <Text style={styles.emptySub}>Creá tu primer servicio para empezar a recibir pedidos</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/proveedor-panel/nuevo-servicio')}
              >
                <Text style={styles.emptyBtnText}>+ Crear primer servicio</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item: s }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceIco}>
                    <Text style={{fontSize:24}}>{CAT_ICOS[s.categoria] ?? '🔧'}</Text>
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{s.nombre}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>{s.descripcion}</Text>
                    <View style={styles.serviceTags}>
                      <View style={styles.catTag}>
                        <Text style={styles.catTagText}>{s.categoria}</Text>
                      </View>
                      <View style={[styles.catTag, { backgroundColor: s.activo ? 'rgba(26,158,92,.1)' : 'rgba(255,118,117,.1)' }]}>
                        <Text style={[styles.catTagText, { color: s.activo ? Colors.primary : '#FF7675' }]}>
                          {s.activo ? '● Activo' : '● Inactivo'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.servicePrice}>${s.precio?.toLocaleString()}</Text>
              </View>

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname:'/proveedor-panel/nuevo-servicio', params:{ id:s.id, nombre:s.nombre, descripcion:s.descripcion, precio:s.precio, categoria:s.categoria } })}
                >
                  <Text style={styles.editBtnText}>✏️ Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex:1, backgroundColor:Colors.cream },
  header:        { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:       { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:      { fontSize:16, color:Colors.dark },
  title:         { flex:1, fontSize:22, fontWeight:'900', color:Colors.dark },
  addBtn:        { backgroundColor:Colors.primary, paddingHorizontal:14, paddingVertical:8, borderRadius:100 },
  addBtnText:    { color:'white', fontSize:13, fontWeight:'700' },
  listContainer: { paddingHorizontal:22, gap:14, paddingBottom:100 },
  serviceCard:   { backgroundColor:'white', borderRadius:20, padding:18, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.06, shadowRadius:10, elevation:3 },
  serviceTop:    { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 },
  serviceLeft:   { flexDirection:'row', gap:12, flex:1 },
  serviceIco:    { width:50, height:50, borderRadius:15, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceInfo:   { flex:1, gap:4 },
  serviceName:   { fontSize:15, fontWeight:'800', color:Colors.dark },
  serviceDesc:   { fontSize:12, color:Colors.gray, lineHeight:18 },
  serviceTags:   { flexDirection:'row', gap:6, flexWrap:'wrap', marginTop:4 },
  catTag:        { backgroundColor:Colors.cream, paddingHorizontal:10, paddingVertical:3, borderRadius:100 },
  catTagText:    { fontSize:10, fontWeight:'700', color:Colors.gray },
  servicePrice:  { fontSize:18, fontWeight:'900', color:Colors.dark },
  serviceActions:{ borderTopWidth:1, borderTopColor:Colors.border, paddingTop:12, flexDirection:'row', gap:10 },
  editBtn:       { flex:1, paddingVertical:10, borderRadius:12, borderWidth:1.5, borderColor:Colors.border, alignItems:'center' },
  editBtnText:   { fontSize:13, fontWeight:'700', color:Colors.dark },
  empty:         { alignItems:'center', paddingTop:60, paddingHorizontal:32 },
  emptyIco:      { fontSize:56, marginBottom:16, opacity:.3 },
  emptyTitle:    { fontSize:18, fontWeight:'800', color:Colors.dark, marginBottom:8 },
  emptySub:      { fontSize:13, color:Colors.gray, textAlign:'center', lineHeight:20, marginBottom:24 },
  emptyBtn:      { backgroundColor:Colors.primary, paddingHorizontal:24, paddingVertical:14, borderRadius:16 },
  emptyBtnText:  { color:'white', fontSize:14, fontWeight:'700' },
})
