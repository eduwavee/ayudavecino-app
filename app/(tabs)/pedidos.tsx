import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { pedidosService } from '../../services/pedidos.service'
import { useAuthStore } from '../../store/authStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { SkeletonBlock } from '../../components/ui/Skeleton'

function SkeletonPedidoCard({ styles }: { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoTop}>
        <SkeletonBlock width={44} height={44} borderRadius={12} />
        <View style={styles.pedidoInfo}>
          <SkeletonBlock width="65%" height={13} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="45%" height={11} />
        </View>
        <SkeletonBlock width={70} height={18} borderRadius={100} />
      </View>
      <View style={[styles.pedidoBottom, { borderTopWidth:0, paddingTop:0 }]}>
        <SkeletonBlock width={90} height={11} />
        <SkeletonBlock width={50} height={14} />
      </View>
    </View>
  )
}

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:   { color:'#D4A017', bg:'rgba(255,210,63,.15)', label:'⏳ Pendiente' },
  ACEPTADO:    { color:Colors.primary, bg:'rgba(26,158,92,.12)', label:'✓ Aceptado' },
  EN_CURSO:    { color:'#74B9FF', bg:'rgba(116,185,255,.15)', label:'🔧 En curso' },
  COMPLETADO:  { color:Colors.primary, bg:'rgba(26,158,92,.12)', label:'✅ Completado' },
  CANCELADO:   { color:'#FF7675', bg:'rgba(255,118,117,.15)', label:'✕ Cancelado' },
}

export default function PedidosScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const tema = useTema()
  const styles = getStyles(tema)
  const esProveedor = usuario?.rol === 'PROVEEDOR'

  const [pedidos, setPedidos]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro]         = useState('todos')
  const [completando, setCompletando] = useState<string|null>(null)

  useFocusEffect(useCallback(() => { cargarPedidos() }, []))

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos()
      setPedidos(data)
    } catch {
      setPedidos([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function confirmarCompletado(id: string, servicioNombre: string) {
    Alert.alert(
      '¿Confirmar trabajo completado?',
      `${servicioNombre} — vas a poder dejar una reseña después de confirmar.`,
      [
        { text: 'Todavía no', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setCompletando(id)
            try {
              await pedidosService.cambiarEstado(id, 'COMPLETADO')
              await cargarPedidos()
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo confirmar')
            } finally {
              setCompletando(null)
            }
          }
        }
      ]
    )
  }

  const filtrados = filtro === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtro.toUpperCase())

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-AR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <View style={styles.container}>

      {/* Header diferente según rol */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{esProveedor ? 'Mis Trabajos' : 'Mis Pedidos'}</Text>
          <Text style={styles.subtitle}>
            {esProveedor ? 'Pedidos que recibiste' : 'Servicios que contrataste'}
          </Text>
        </View>
        {esProveedor && (
          <TouchableOpacity
            style={styles.panelBtn}
            onPress={() => router.push('/proveedor-panel')}
          >
            <Text style={styles.panelBtnText}>Panel →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{pedidos.filter(p => p.estado === 'PENDIENTE').length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.statNum, { color:'#74B9FF' }]}>{pedidos.filter(p => p.estado === 'EN_CURSO' || p.estado === 'ACEPTADO').length}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.statNum, { color:Colors.primary }]}>{pedidos.filter(p => p.estado === 'COMPLETADO').length}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      {/* Filtros */}
      <FlatList
        data={['todos','pendiente','en_curso','completado','cancelado']}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        contentContainerStyle={styles.filtrosContainer}
        style={styles.filtrosList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filtroBtn, filtro === item && styles.filtroBtnActive]}
            onPress={() => setFiltro(item)}
          >
            <Text style={[styles.filtroBtnText, filtro === item && styles.filtroBtnTextActive]}>
              {item === 'todos' ? 'Todos' : item.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.listContainer}>
          {[0, 1, 2].map(i => <SkeletonPedidoCard key={i} styles={styles} />)}
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarPedidos() }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>{esProveedor ? '🔨' : '📋'}</Text>
              <Text style={styles.emptyText}>{esProveedor ? 'Sin trabajos todavía' : 'No hay pedidos'}</Text>
              <Text style={styles.emptySub}>{esProveedor ? 'Cuando un cliente te contrate aparecerá acá' : 'Tus pedidos aparecerán acá'}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const est      = ESTADO_CONFIG[item.estado] ?? ESTADO_CONFIG.PENDIENTE
            const tienChat = ['ACEPTADO','EN_CURSO','COMPLETADO'].includes(item.estado)
            const contraparte = esProveedor ? item.cliente : item.proveedor

            return (
              <TouchableOpacity
                style={styles.pedidoCard}
                activeOpacity={tienChat ? .7 : 1}
                onPress={() => {
                  if (tienChat) {
                    router.push({
                      pathname: '/chat/'+item.id,
                      params: {
                        pedidoId:          item.id,
                        nombreContraparte: contraparte?.nombre,
                        servicioNombre:    item.servicio?.nombre,
                      }
                    })
                  }
                }}
              >
                <View style={styles.pedidoTop}>
                  <View style={styles.pedidoIco}>
                    <Text style={{ fontSize:20 }}>🔧</Text>
                  </View>
                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoServicio}>{item.servicio?.nombre}</Text>
                    <Text style={styles.pedidoContraparte}>
                      {esProveedor ? '👤 Cliente: ' : '🔧 Proveedor: '}{contraparte?.nombre}
                    </Text>
                  </View>
                  <View style={styles.pedidoRight}>
                    <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                      <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                    </View>
                    {tienChat && <Text style={styles.chatHint}>💬 Chat</Text>}
                  </View>
                </View>

                {/* Acciones rápidas para proveedor */}
                {esProveedor && item.estado === 'PENDIENTE' && (
                  <View style={styles.accionesRow}>
                    <TouchableOpacity
                      style={styles.btnAceptar}
                      onPress={() => router.push('/proveedor-panel/pedidos')}
                    >
                      <Text style={styles.btnAceptarText}>✓ Gestionar pedido</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Confirmar completado (solo cliente, pedido en curso) */}
                {!esProveedor && item.estado === 'EN_CURSO' && (
                  <View style={styles.accionesRow}>
                    {completando === item.id ? (
                      <ActivityIndicator color={Colors.primary} style={{ flex:1 }} />
                    ) : (
                      <TouchableOpacity
                        style={styles.btnAceptar}
                        onPress={() => confirmarCompletado(item.id, item.servicio?.nombre)}
                      >
                        <Text style={styles.btnAceptarText}>✅ Confirmar trabajo completado</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.pedidoBottom}>
                  <Text style={styles.pedidoFecha}>📅 {formatFecha(item.fecha)}</Text>
                  <View style={styles.bottomRight}>
                    {item.estado === 'COMPLETADO' && !esProveedor && (
                      <TouchableOpacity
                        style={styles.calificarBtn}
                        onPress={() => router.push({
                          pathname: '/resena/nueva',
                          params: {
                            pedidoId:        item.id,
                            proveedorNombre: item.proveedor?.nombre,
                            servicioNombre:  item.servicio?.nombre,
                          }
                        })}
                      >
                        <Text style={styles.calificarBtnText}>⭐ Calificar</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.pedidoMonto}>${item.montoTotal?.toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:          { flex:1, backgroundColor:tema.bg },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:60, paddingBottom:12 },
  title:              { fontSize:26, fontWeight:'900', color:tema.texto },
  subtitle:           { fontSize:12, color:tema.subTexto, marginTop:2 },
  panelBtn:           { backgroundColor:Colors.dark, paddingHorizontal:14, paddingVertical:8, borderRadius:100 },
  panelBtnText:       { color:'white', fontSize:12, fontWeight:'700' },
  statsRow:           { flexDirection:'row', gap:10, paddingHorizontal:22, marginBottom:16 },
  statChip:           { flex:1, backgroundColor:tema.card, borderRadius:14, padding:12, alignItems:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  statNum:            { fontSize:22, fontWeight:'900', color:tema.texto, marginBottom:2 },
  statLabel:          { fontSize:10, color:tema.subTexto, fontWeight:'500' },
  filtrosList:        { maxHeight:48, marginBottom:14 },
  filtrosContainer:   { paddingHorizontal:22, gap:8 },
  filtroBtn:          { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  filtroBtnActive:    { backgroundColor:Colors.dark, borderColor:Colors.dark },
  filtroBtnText:      { fontSize:12, fontWeight:'600', color:tema.subTexto },
  filtroBtnTextActive:{ color:'white' },
  listContainer:      { paddingHorizontal:22, gap:12, paddingBottom:100 },
  pedidoCard:         { backgroundColor:tema.card, borderRadius:18, padding:16, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  pedidoTop:          { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  pedidoIco:          { width:44, height:44, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1 },
  pedidoServicio:     { fontSize:14, fontWeight:'700', color:tema.texto, marginBottom:2 },
  pedidoContraparte:  { fontSize:11, color:tema.subTexto },
  pedidoRight:        { alignItems:'flex-end', gap:4 },
  estadoBadge:        { paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  estadoText:         { fontSize:10, fontWeight:'700' },
  chatHint:           { fontSize:10, color:Colors.primary, fontWeight:'600' },
  accionesRow:        { flexDirection:'row', gap:8, marginBottom:12 },
  btnRechazar:        { flex:1, paddingVertical:10, borderRadius:12, borderWidth:1.5, borderColor:tema.border, alignItems:'center' },
  btnRechazarText:    { color:tema.texto, fontWeight:'600', fontSize:13 },
  btnAceptar:         { flex:2, paddingVertical:10, borderRadius:12, backgroundColor:Colors.primary, alignItems:'center' },
  btnAceptarText:     { color:'white', fontWeight:'700', fontSize:13 },
  pedidoBottom:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderTopWidth:1, borderTopColor:tema.border, paddingTop:10 },
  bottomRight:        { flexDirection:'row', alignItems:'center', gap:8 },
  pedidoFecha:        { fontSize:11, color:tema.subTexto },
  pedidoMonto:        { fontSize:16, fontWeight:'900', color:tema.texto },
  calificarBtn:       { backgroundColor:'rgba(255,210,63,.15)', paddingHorizontal:12, paddingVertical:6, borderRadius:100 },
  calificarBtnText:   { fontSize:11, fontWeight:'700', color:'#D4A017' },
  empty:              { alignItems:'center', paddingTop:60 },
  emptyIco:           { fontSize:48, marginBottom:12, opacity:.3 },
  emptyText:          { fontSize:16, fontWeight:'700', color:tema.subTexto },
  emptySub:           { fontSize:13, color:tema.subTexto, marginTop:4, textAlign:'center', paddingHorizontal:32 },
})
