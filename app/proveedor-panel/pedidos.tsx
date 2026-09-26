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
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { categoriaInfo } from '../../constants/categorias'
import { useTema, TemaTokens } from '../../store/temaStore'

// Aviso de espera o resultado al pie de la tarjeta
function Aviso({ icono, texto, color, bg }: { icono: NombreIcono; texto: string; color: string; bg: string }) {
  const styles = getStyles(useTema())
  return (
    <View style={[styles.esperandoWrap, { backgroundColor: bg }]}>
      <Icono nombre={icono} tamano={15} color={color} />
      <Text style={[styles.esperandoText, { color }]}>{texto}</Text>
    </View>
  )
}

const FILTROS = ['Todos','Pendientes','En curso','Completados','Cancelados']

const ESTADO_MAP: Record<string, string> = {
  'Todos':'', 'Pendientes':'PENDIENTE', 'En curso':'EN_CURSO',
  'Completados':'COMPLETADO', 'Cancelados':'CANCELADO'
}

export default function PedidosProveedorScreen() {
  const router = useRouter()
  const tema   = useTema()
  const styles = getStyles(tema)
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

  async function accionarPedido(id: string, estado: string, nombre: string, titulo?: string) {
    const msgs: Record<string,string> = {
      ACEPTADO:'¿Aceptar este pedido?', CANCELADO:'¿Rechazar este pedido?', EN_CURSO:'¿Marcar como en curso?'
    }
    // Los botones dicen qué hacen: "Cancelar / Confirmar" en un aviso sobre un pedido se
    // confundía con cancelar el pedido
    const accion: Record<string,string> = { ACEPTADO:'Aceptar', CANCELADO: titulo ? 'Cancelar pedido' : 'Rechazar', EN_CURSO:'Empezar' }
    Alert.alert(titulo ?? msgs[estado] ?? '¿Confirmar?', nombre, [
      { text:'Volver', style:'cancel' },
      { text: accion[estado] ?? 'Confirmar', style: estado === 'CANCELADO' ? 'destructive' : 'default',
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

  // "En curso" incluye los aceptados: antes un pedido aceptado solo aparecía en "Todos"
  const filtrados = pedidos.filter(p =>
    filtro === 'Todos' ? true
      : filtro === 'En curso' ? ['ACEPTADO', 'EN_CURSO'].includes(p.estado)
      : p.estado === ESTADO_MAP[filtro]
  )

  const tienChat = (estado: string) =>
    ['ACEPTADO','EN_CURSO','COMPLETADO'].includes(estado)

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
          <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
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
              <Icono nombre="file-tray-outline" tamano={48} color={tema.subTexto} style={styles.emptyIco} />
              <Text style={styles.emptyText}>Sin pedidos en esta categoría</Text>
            </View>
          }
          renderItem={conEntrada(({ item: p }) => {
            const isLoading = accionando === p.id
            const puedeChat = tienChat(p.estado)
            // El backend ya los ordena: urgentes primero, después clientes Vecino Premium
            const abierto   = ['PENDIENTE', 'ACEPTADO', 'EN_CURSO'].includes(p.estado)
            const urgente   = p.urgente && abierto

            return (
              <View style={[styles.pedidoCard, urgente && styles.pedidoCardUrgente]}>

                {urgente && (
                  <View style={styles.urgenteBanner}>
                    <Icono nombre="flash" tamano={13} color={tema.dorado} />
                    <Text style={styles.urgenteBannerText}>URGENTE · el cliente lo necesita cuanto antes</Text>
                  </View>
                )}

                <View style={styles.pedidoTop}>
                  <View style={styles.pedidoIco}>
                    <Icono nombre={categoriaInfo(p.servicio?.categoria).icono} tamano={22} color={Colors.primary} />
                  </View>
                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoServicio}>{p.servicio?.nombre}</Text>
                    <View style={styles.detailFila}>
                      <View style={styles.clienteMini}>
                        <FotoPerfil ruta={p.cliente?.avatar} nombre={p.cliente?.nombre} radio={10} estiloTexto={styles.clienteMiniTexto} />
                      </View>
                      <Text style={styles.pedidoCliente}>{p.cliente?.nombre}</Text>
                    </View>
                    {p.cliente?.plan && p.cliente.plan !== 'GRATIS' && (
                      <View style={styles.clienteBadges}>
                        <PlanBadge plan={p.cliente.plan} rol="CLIENTE" oscuro={tema.esOscuro} />
                        {p.cliente.plan === 'PREMIUM' && abierto && !urgente && (
                          <Text style={styles.prioridadText}>Prioridad</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.pedidoTopRight}>
                    <EstadoBadge estado={p.estado} oscuro={tema.esOscuro} />
                    {puedeChat && (
                      <PressScale haptico
                        style={styles.chatBtn}
                        onPress={() => router.push({
                          pathname: '/chat/[pedidoId]',
                          params: {
                            pedidoId:          p.id,
                            nombreContraparte: p.cliente?.nombre,
                            servicioNombre:    p.servicio?.nombre,
                          }
                        })}
                      >
                        <Icono nombre="chatbubble-ellipses-outline" tamano={13} color={Colors.primary} />
                        <Text style={styles.chatBtnText}>Chat</Text>
                      </PressScale>
                    )}
                  </View>
                </View>

                <View style={styles.pedidoDetails}>
                  <View style={styles.detailChip}>
                    <Icono nombre="calendar-outline" tamano={12} color={tema.texto} />
                    <Text style={styles.detailText}>
                      {new Date(p.fecha).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' })}
                    </Text>
                  </View>
                  <View style={styles.detailChip}>
                    <Icono nombre="time-outline" tamano={12} color={tema.texto} />
                    <Text style={styles.detailText}>
                      {new Date(p.fecha).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.detailChip}>
                    <Icono nombre="cash-outline" tamano={12} color={tema.texto} />
                    <Text style={styles.detailText}>${p.montoTotal?.toLocaleString('es-AR')}</Text>
                  </View>
                </View>

                {p.descripcion && (
                  <View style={styles.descFila}>
                    <Icono nombre="chatbox-ellipses-outline" tamano={13} color={tema.subTexto} />
                    <Text style={styles.pedidoDesc}>"{p.descripcion}"</Text>
                  </View>
                )}

                <ProgresoPedido estado={p.estado} pagado={!!p.pago} tema={tema} />

                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop:12 }} />
                ) : (
                  <View style={styles.acciones}>
                    {p.estado === 'PENDIENTE' && (
                      <>
                        <PressScale haptico style={styles.btnRechazar} onPress={() => accionarPedido(p.id, 'CANCELADO', p.servicio?.nombre)}>
                          <Icono nombre="close" tamano={16} color={tema.peligro} />
                          <Text style={styles.btnRechazarText}>Rechazar</Text>
                        </PressScale>
                        <PressScale haptico style={styles.btnAceptar} onPress={() => accionarPedido(p.id, 'ACEPTADO', p.servicio?.nombre)}>
                          <Icono nombre="checkmark" tamano={16} color="white" />
                          <Text style={styles.btnAceptarText}>Aceptar</Text>
                        </PressScale>
                      </>
                    )}
                    {/* Escrow: se puede arrancar recien cuando el cliente pago */}
                    {p.estado === 'ACEPTADO' && p.pago?.estado === 'RETENIDO' && (
                      <PressScale haptico style={styles.btnEnCurso} onPress={() => accionarPedido(p.id, 'EN_CURSO', p.servicio?.nombre)}>
                        <Icono nombre="construct-outline" tamano={16} color="white" />
                        <Text style={styles.btnEnCursoText}>Marcar en curso</Text>
                      </PressScale>
                    )}
                    {p.estado === 'ACEPTADO' && !p.pago && (
                      <View style={{ flex:1, gap:10 }}>
                        <Aviso icono="hourglass-outline" texto="Esperando el pago del cliente" color={tema.dorado} bg="rgba(255,210,63,.12)" />
                        {/* Si el cliente nunca paga, el proveedor puede liberar su agenda */}
                        <PressScale haptico style={styles.btnRechazar} onPress={() => accionarPedido(p.id, 'CANCELADO', p.servicio?.nombre, '¿Cancelar este pedido?')}>
                          <Icono nombre="close" tamano={16} color={tema.peligro} />
                          <Text style={styles.btnRechazarText}>Cancelar pedido</Text>
                        </PressScale>
                      </View>
                    )}
                    {p.estado === 'EN_CURSO' && (
                      <Aviso icono="hourglass-outline" texto="Esperando confirmación del cliente" color={tema.dorado} bg="rgba(255,210,63,.12)" />
                    )}
                    {p.estado === 'COMPLETADO' && (
                      <Aviso
                        icono="checkmark-done-circle"
                        color={tema.esOscuro ? Colors.primaryLight : '#137A47'}
                        bg="rgba(26,158,92,.08)"
                        texto={`Trabajo completado${p.pago?.estado === 'LIBERADO' ? ` · cobraste $${(p.pago.monto - p.pago.comision).toLocaleString('es-AR')}` : ''}`}
                      />
                    )}
                  </View>
                )}
              </View>
            )
          })}
        />
      )}
      <FondoBarraEstado color={tema.bg} />
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:          { flex:1, backgroundColor:tema.bg },
  header:             { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:            { width:38, height:38, borderRadius:12, backgroundColor:tema.overlay, alignItems:'center', justifyContent:'center' },
  title:              { flex:1, fontSize:22, fontFamily: F.extrabold, color:tema.texto },
  count:              { fontSize:13, color:tema.subTexto, fontFamily: F.semibold },
  // Sin flexGrow/flexShrink 0 la lista de pedidos le robaba altura y los chips quedaban cortados
  filtrosList:        { flexGrow:0, flexShrink:0, marginBottom:14 },
  // alignItems:center: cada chip toma su altura natural en vez de estirarse al alto de la lista
  filtrosContainer:   { paddingHorizontal:22, gap:8, alignItems:'center' },
  filtroBtn:          { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  filtroBtnActive:    { backgroundColor:tema.seleccion, borderColor:tema.seleccion },
  filtroBtnText:      { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  filtroBtnTextActive:{ color:'white' },
  listContainer:      { paddingHorizontal:22, gap:14, paddingBottom:100 },
  pedidoCard:         { backgroundColor:tema.card, borderRadius:20, padding:18, shadowColor:tema.sombra, shadowOffset:{width:0,height:3}, shadowOpacity:.07, shadowRadius:10, elevation:3 },
  pedidoCardUrgente:  { borderWidth:2, borderColor:'#FFD23F', shadowColor:'#D4A017', shadowOpacity:.2 },
  urgenteBanner:      { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(255,210,63,.2)', borderRadius:10, paddingVertical:6, paddingHorizontal:10, marginBottom:12 },
  urgenteBannerText:  { fontSize:11, fontFamily: F.extrabold, color:tema.dorado },
  clienteBadges:      { flexDirection:'row', alignItems:'center', gap:6, marginTop:5 },
  prioridadText:      { fontSize:10, fontFamily: F.bold, color:tema.dorado },
  pedidoTop:          { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  pedidoIco:          { width:46, height:46, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1 },
  pedidoServicio:     { fontSize:15, fontFamily: F.extrabold, color:tema.texto, marginBottom:3 },
  pedidoCliente:      { fontFamily: F.regular, fontSize:12, color:tema.subTexto },
  clienteMini:        { width:20, height:20, borderRadius:10, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  clienteMiniTexto:   { color:'white', fontSize:10, fontFamily: F.bold },
  pedidoTopRight:     { alignItems:'flex-end', gap:6 },
  chatBtn:            { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(26,158,92,.1)', paddingHorizontal:10, paddingVertical:4, borderRadius:100 },
  chatBtnText:        { fontSize:11, fontFamily: F.bold, color:Colors.primary },
  detailFila:         { flexDirection:'row', alignItems:'center', gap:4 },
  pedidoDetails:      { flexDirection:'row', gap:8, flexWrap:'wrap', marginBottom:10 },
  detailChip:         { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:tema.bg, paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  detailText:         { fontSize:11, fontFamily: F.semibold, color:tema.texto },
  descFila:           { flexDirection:'row', alignItems:'flex-start', gap:6, marginBottom:10, paddingHorizontal:4 },
  pedidoDesc:         { flex:1, fontFamily: F.regular, fontSize:12, color:tema.subTexto, fontStyle:'italic' },
  acciones:           { flexDirection:'row', gap:10, marginTop:4 },
  btnRechazar:        { flex:1, flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:14, borderWidth:1.5, borderColor:'#E17055', alignItems:'center' },
  btnRechazarText:    { color:tema.peligro, fontFamily: F.bold, fontSize:14 },
  btnAceptar:         { flex:2, flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:14, backgroundColor:Colors.primary, alignItems:'center' },
  btnAceptarText:     { color:'white', fontFamily: F.bold, fontSize:14 },
  btnEnCurso:         { flex:1, flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:14, backgroundColor:'#1F6FD1', alignItems:'center' },
  btnEnCursoText:     { color:'white', fontFamily: F.bold, fontSize:14 },
  esperandoWrap:      { flex:1, flexDirection:'row', justifyContent:'center', gap:7, borderRadius:14, paddingVertical:12, paddingHorizontal:10, alignItems:'center' },
  esperandoText:      { fontFamily: F.bold, fontSize:13, flexShrink:1 },
  empty:              { alignItems:'center', paddingTop:60 },
  emptyIco:           { marginBottom:12, opacity:.5 },
  emptyText:          { fontSize:16, fontFamily: F.bold, color:tema.subTexto },
})
