import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors } from '../../constants/colors'
import { pedidosService } from '../../services/pedidos.service'
import { FUENTES as F } from '../../constants/diseno'
import { conEntrada } from '../../components/ui/Aparecer'
import { alertaError, haptica } from '../../utils/haptica'
import { ProgresoPedido } from '../../components/ui/ProgresoPedido'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'

const FILTROS = ['Todos','Pendientes','En curso','Completados','Cancelados']

const ESTADO_MAP: Record<string, string> = {
  'Todos':'', 'Pendientes':'PENDIENTE', 'En curso':'EN_CURSO',
  'Completados':'COMPLETADO', 'Cancelados':'CANCELADO'
}

const ESTADO_CONFIG: Record<string, any> = {
  PENDIENTE:  { color:'#D4A017', bg:'rgba(255,210,63,.12)', label:'⏳ Pendiente' },
  ACEPTADO:   { color:Colors.primary, bg:'rgba(26,158,92,.1)', label:'✓ Aceptado' },
  EN_CURSO:   { color:'#74B9FF', bg:'rgba(116,185,255,.12)', label:'🔧 En curso' },
  COMPLETADO: { color:Colors.primary, bg:'rgba(26,158,92,.1)', label:'✅ Completado' },
  CANCELADO:  { color:'#FF7675', bg:'rgba(255,118,117,.12)', label:'✕ Cancelado' },
}

export default function PedidosProveedorScreen() {
  const router = useRouter()
  const [pedidos, setPedidos]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro]         = useState('Todos')
  const [accionando, setAccionando] = useState<string|null>(null)

  useFocusEffect(useCallback(() => { cargarPedidos() }, []))

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos()
      setPedidos(data)
    } catch { setPedidos([]) }
    finally { setLoading(false); setRefreshing(false) }
  }

  async function accionarPedido(id: string, estado: string, nombre: string) {
    const msgs: Record<string,string> = {
      ACEPTADO:'¿Aceptar este pedido?', CANCELADO:'¿Rechazar este pedido?', EN_CURSO:'¿Marcar como en curso?'
    }
    Alert.alert(msgs[estado] ?? '¿Confirmar?', nombre, [
      { text:'Cancelar', style:'cancel' },
      { text:'Confirmar', style: estado === 'CANCELADO' ? 'destructive' : 'default',
        onPress: async () => {
          setAccionando(id)
          try {
            await pedidosService.cambiarEstado(id, estado)
            haptica.exito()
            await cargarPedidos()
          } catch (err: any) {
            alertaError(err.response?.data?.mensaje || 'No se pudo actualizar')
          } finally { setAccionando(null) }
        }
      }
    ])
  }

  const filtrados = pedidos.filter(p =>
    filtro === 'Todos' ? true : p.estado === ESTADO_MAP[filtro]
  )

  const tienChat = (estado: string) =>
    ['ACEPTADO','EN_CURSO','COMPLETADO'].includes(estado)

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </PressScale>
        <Text style={styles.title}>Mis Pedidos</Text>
        <Text style={styles.count}>{pedidos.length}</Text>
      </View>

      <FlatList
        data={FILTROS} horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        contentContainerStyle={styles.filtrosContainer}
        style={styles.filtrosList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filtroBtn, filtro === item && styles.filtroBtnActive]}
            onPress={() => setFiltro(item)}
          >
            <Text style={[styles.filtroBtnText, filtro === item && styles.filtroBtnTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarPedidos() }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIco}>📭</Text>
              <Text style={styles.emptyText}>Sin pedidos en esta categoría</Text>
            </View>
          }
          renderItem={conEntrada(({ item: p }) => {
            const est       = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.PENDIENTE
            const isLoading = accionando === p.id
            const puedeChat = tienChat(p.estado)
            // El backend ya los ordena: urgentes primero, después clientes Vecino Premium
            const abierto   = ['PENDIENTE', 'ACEPTADO', 'EN_CURSO'].includes(p.estado)
            const urgente   = p.urgente && abierto

            return (
              <View style={[styles.pedidoCard, urgente && styles.pedidoCardUrgente]}>

                {urgente && (
                  <View style={styles.urgenteBanner}>
                    <Text style={styles.urgenteBannerText}>⚡ URGENTE · el cliente lo necesita cuanto antes</Text>
                  </View>
                )}

                <View style={styles.pedidoTop}>
                  <View style={styles.pedidoIco}><Text style={{ fontFamily: F.regular, fontSize:22}}>🔧</Text></View>
                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoServicio}>{p.servicio?.nombre}</Text>
                    <Text style={styles.pedidoCliente}>👤 {p.cliente?.nombre}</Text>
                    {p.cliente?.plan && p.cliente.plan !== 'GRATIS' && (
                      <View style={styles.clienteBadges}>
                        <PlanBadge plan={p.cliente.plan} rol="CLIENTE" />
                        {p.cliente.plan === 'PREMIUM' && abierto && !urgente && (
                          <Text style={styles.prioridadText}>Prioridad</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.pedidoTopRight}>
                    <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                      <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                    </View>
                    {puedeChat && (
                      <PressScale haptico
                        style={styles.chatBtn}
                        onPress={() => router.push({
                          pathname: '/chat/'+p.id,
                          params: {
                            pedidoId:          p.id,
                            nombreContraparte: p.cliente?.nombre,
                            servicioNombre:    p.servicio?.nombre,
                          }
                        })}
                      >
                        <Text style={styles.chatBtnText}>💬 Chat</Text>
                      </PressScale>
                    )}
                  </View>
                </View>

                <View style={styles.pedidoDetails}>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailText}>
                      📅 {new Date(p.fecha).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' })}
                    </Text>
                  </View>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailText}>
                      🕐 {new Date(p.fecha).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailText}>💰 ${p.montoTotal?.toLocaleString()}</Text>
                  </View>
                </View>

                {p.descripcion && (
                  <Text style={styles.pedidoDesc}>💬 "{p.descripcion}"</Text>
                )}

                <ProgresoPedido estado={p.estado} pagado={!!p.pago} />

                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop:12 }} />
                ) : (
                  <View style={styles.acciones}>
                    {p.estado === 'PENDIENTE' && (
                      <>
                        <PressScale haptico style={styles.btnRechazar} onPress={() => accionarPedido(p.id, 'CANCELADO', p.servicio?.nombre)}>
                          <Text style={styles.btnRechazarText}>✕ Rechazar</Text>
                        </PressScale>
                        <PressScale haptico style={styles.btnAceptar} onPress={() => accionarPedido(p.id, 'ACEPTADO', p.servicio?.nombre)}>
                          <Text style={styles.btnAceptarText}>✓ Aceptar</Text>
                        </PressScale>
                      </>
                    )}
                    {/* Escrow: se puede arrancar recien cuando el cliente pago */}
                    {p.estado === 'ACEPTADO' && p.pago?.estado === 'RETENIDO' && (
                      <PressScale haptico style={styles.btnEnCurso} onPress={() => accionarPedido(p.id, 'EN_CURSO', p.servicio?.nombre)}>
                        <Text style={styles.btnEnCursoText}>🔧 Marcar en curso</Text>
                      </PressScale>
                    )}
                    {p.estado === 'ACEPTADO' && !p.pago && (
                      <View style={styles.esperandoWrap}>
                        <Text style={styles.esperandoText}>⏳ Esperando el pago del cliente</Text>
                      </View>
                    )}
                    {p.estado === 'EN_CURSO' && (
                      <View style={styles.esperandoWrap}>
                        <Text style={styles.esperandoText}>⏳ Esperando confirmación del cliente</Text>
                      </View>
                    )}
                    {p.estado === 'COMPLETADO' && (
                      <View style={[styles.esperandoWrap, { backgroundColor:'rgba(26,158,92,.08)' }]}>
                        <Text style={[styles.esperandoText, { color:Colors.primary }]}>
                          ✅ Trabajo completado{p.pago?.estado === 'LIBERADO' ? ` · cobraste $${(p.pago.monto - p.pago.comision).toLocaleString('es-AR')}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex:1, backgroundColor:Colors.cream },
  header:             { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:            { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:           { fontFamily: F.regular, fontSize:16, color:Colors.dark },
  title:              { flex:1, fontSize:22, fontFamily: F.extrabold, color:Colors.dark },
  count:              { fontSize:13, color:'#6B6B6B', fontFamily: F.semibold },
  filtrosList:        { maxHeight:48, marginBottom:14 },
  filtrosContainer:   { paddingHorizontal:22, gap:8 },
  filtroBtn:          { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  filtroBtnActive:    { backgroundColor:Colors.dark, borderColor:Colors.dark },
  filtroBtnText:      { fontSize:12, fontFamily: F.semibold, color:'#555' },
  filtroBtnTextActive:{ color:'white' },
  listContainer:      { paddingHorizontal:22, gap:14, paddingBottom:100 },
  pedidoCard:         { backgroundColor:'white', borderRadius:20, padding:18, shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:.07, shadowRadius:10, elevation:3 },
  pedidoCardUrgente:  { borderWidth:2, borderColor:'#FFD23F', shadowColor:'#D4A017', shadowOpacity:.2 },
  urgenteBanner:      { backgroundColor:'rgba(255,210,63,.2)', borderRadius:10, paddingVertical:6, paddingHorizontal:10, marginBottom:12 },
  urgenteBannerText:  { fontSize:11, fontFamily: F.extrabold, color:'#A87C00' },
  clienteBadges:      { flexDirection:'row', alignItems:'center', gap:6, marginTop:5 },
  prioridadText:      { fontSize:10, fontFamily: F.bold, color:'#A87C00' },
  pedidoTop:          { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  pedidoIco:          { width:46, height:46, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1 },
  pedidoServicio:     { fontSize:15, fontFamily: F.extrabold, color:Colors.dark, marginBottom:3 },
  pedidoCliente:      { fontFamily: F.regular, fontSize:12, color:'#6B6B6B' },
  pedidoTopRight:     { alignItems:'flex-end', gap:6 },
  estadoBadge:        { paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  estadoText:         { fontSize:10, fontFamily: F.bold },
  chatBtn:            { backgroundColor:'rgba(26,158,92,.1)', paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  chatBtnText:        { fontSize:11, fontFamily: F.bold, color:Colors.primary },
  pedidoDetails:      { flexDirection:'row', gap:8, flexWrap:'wrap', marginBottom:10 },
  detailChip:         { backgroundColor:Colors.cream, paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  detailText:         { fontSize:11, fontFamily: F.semibold, color:Colors.dark },
  pedidoDesc:         { fontFamily: F.regular, fontSize:12, color:'#6B6B6B', fontStyle:'italic', marginBottom:10, paddingHorizontal:4 },
  acciones:           { flexDirection:'row', gap:10, marginTop:4 },
  btnRechazar:        { flex:1, paddingVertical:12, borderRadius:14, borderWidth:1.5, borderColor:'#FF7675', alignItems:'center' },
  btnRechazarText:    { color:'#FF7675', fontFamily: F.bold, fontSize:14 },
  btnAceptar:         { flex:2, paddingVertical:12, borderRadius:14, backgroundColor:Colors.primary, alignItems:'center' },
  btnAceptarText:     { color:'white', fontFamily: F.bold, fontSize:14 },
  btnEnCurso:         { flex:1, paddingVertical:12, borderRadius:14, backgroundColor:'#74B9FF', alignItems:'center' },
  btnEnCursoText:     { color:'white', fontFamily: F.bold, fontSize:14 },
  esperandoWrap:      { flex:1, backgroundColor:'rgba(255,210,63,.1)', borderRadius:14, paddingVertical:12, alignItems:'center' },
  esperandoText:      { color:'#D4A017', fontFamily: F.bold, fontSize:13 },
  empty:              { alignItems:'center', paddingTop:60 },
  emptyIco:           { fontFamily: F.regular, fontSize:48, marginBottom:12, opacity:.3 },
  emptyText:          { fontSize:16, fontFamily: F.bold, color:'#6B6B6B' },
})
