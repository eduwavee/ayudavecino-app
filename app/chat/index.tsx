import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { pedidosService } from '../../services/pedidos.service'
import { useAuthStore } from '../../store/authStore'

export default function ChatListScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarPedidos() }, [])

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos()
      // Solo pedidos activos tienen chat
      setPedidos(data.filter((p: any) =>
        ['ACEPTADO','EN_CURSO','COMPLETADO'].includes(p.estado)
      ))
    } catch { setPedidos([]) }
    finally { setLoading(false) }
  }

  const esProveedor = usuario?.rol === 'PROVEEDOR'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes</Text>
        <Text style={styles.count}>{pedidos.length} conversaciones</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>💬</Text>
              <Text style={styles.emptyTitle}>Sin conversaciones</Text>
              <Text style={styles.emptySub}>Los chats aparecen cuando un pedido es aceptado</Text>
            </View>
          }
          renderItem={({ item: p }) => {
            const contraparte = esProveedor ? p.cliente : p.proveedor
            const estadoConfig: Record<string,any> = {
              ACEPTADO:   { color:Colors.primary, label:'Aceptado' },
              EN_CURSO:   { color:'#74B9FF',       label:'En curso' },
              COMPLETADO: { color:'#888',           label:'Completado' },
            }
            const est = estadoConfig[p.estado] ?? estadoConfig.ACEPTADO
            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => router.push({
                  pathname: '/chat/[pedidoId]',
                  params: {
                    pedidoId:       p.id,
                    nombreContraparte: contraparte?.nombre ?? 'Usuario',
                    servicioNombre: p.servicio?.nombre,
                  }
                })}
              >
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>
                    {contraparte?.nombre?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                  <View style={[styles.onlineDot, { backgroundColor: est.color }]} />
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatNombre}>{contraparte?.nombre}</Text>
                    <Text style={styles.chatFecha}>
                      {new Date(p.fecha).toLocaleDateString('es-AR', { day:'numeric', month:'short' })}
                    </Text>
                  </View>
                  <Text style={styles.chatServicio}>{p.servicio?.nombre}</Text>
                  <Text style={[styles.chatEstado, { color: est.color }]}>● {est.label}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:Colors.cream },
  header:       { paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  title:        { fontSize:26, fontWeight:'900', color:Colors.dark },
  count:        { fontSize:13, color:Colors.gray, marginTop:2 },
  list:         { paddingHorizontal:22, gap:10, paddingBottom:100 },
  chatItem:     { backgroundColor:'white', borderRadius:18, padding:16, flexDirection:'row', alignItems:'center', gap:14, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  chatAvatar:   { width:52, height:52, borderRadius:16, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', position:'relative' },
  chatAvatarText:{ color:'white', fontSize:20, fontWeight:'900' },
  onlineDot:    { position:'absolute', bottom:2, right:2, width:12, height:12, borderRadius:6, borderWidth:2, borderColor:'white' },
  chatInfo:     { flex:1, gap:3 },
  chatTop:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  chatNombre:   { fontSize:15, fontWeight:'800', color:Colors.dark },
  chatFecha:    { fontSize:11, color:Colors.gray },
  chatServicio: { fontSize:12, color:Colors.gray },
  chatEstado:   { fontSize:11, fontWeight:'700' },
  empty:        { alignItems:'center', paddingTop:80 },
  emptyIco:     { fontSize:56, marginBottom:16, opacity:.3 },
  emptyTitle:   { fontSize:18, fontWeight:'800', color:Colors.dark, marginBottom:6 },
  emptySub:     { fontSize:13, color:Colors.gray, textAlign:'center', paddingHorizontal:32 },
})
