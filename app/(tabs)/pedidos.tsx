import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { pedidosService } from '../../services/pedidos.service'
import { useAuthStore } from '../../store/authStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { FUENTES as F } from '../../constants/diseno'
import { conEntrada } from '../../components/ui/Aparecer'
import { alertaError, haptica } from '../../utils/haptica'
import { ProgresoPedido } from '../../components/ui/ProgresoPedido'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { usePlan } from '../../hooks/usePlan'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { categoriaInfo } from '../../constants/categorias'

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

// Estado del pago del pedido (escrow)
const PAGO_ESTADO: Record<string, { texto: string; color: string; icono: NombreIcono }> = {
  RETENIDO: { texto:'Pago retenido hasta que confirmes el trabajo', color:'#8A6500',      icono:'lock-closed' },
  LIBERADO: { texto:'Pago liberado al proveedor',                   color:'#137A47',      icono:'checkmark-circle' },
  DEVUELTO: { texto:'Pago devuelto',                                color:'#6B6B6B',      icono:'return-down-back' },
}

export default function PedidosScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const tema = useTema()
  // Los colores del estado del pago dependen del tema: los tonos oscuros no se leían sobre
  // la tarjeta en modo oscuro
  const colorPago = (estado: string) =>
    estado === 'RETENIDO' ? tema.dorado
      : estado === 'LIBERADO' ? (tema.esOscuro ? Colors.primaryLight : '#137A47')
      : tema.subTexto
  const styles = getStyles(tema)
  const esProveedor = usuario?.rol === 'PROVEEDOR'

  const [pedidos, setPedidos]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro]         = useState('todos')
  const [completando, setCompletando] = useState<string|null>(null)
  const { nivel, pedirMejora } = usePlan()

  useFocusEffect(useCallback(() => { cargarPedidos() }, []))

  // Vecino Plus / Premium: volver a pedir el mismo servicio con un toque
  function repetirPedido(p: any) {
    if (nivel < 1) {
      pedirMejora('Repetir un pedido con un toque es parte de Vecino Plus y Vecino Premium.')
      return
    }
    if (p.servicio?.activo === false) {
      alertaError('Ese servicio ya no está publicado. Buscá otro parecido en la pestaña Buscar.')
      return
    }
    router.push({
      pathname: '/pedido/nuevo',
      params: {
        servicioId:      p.servicioId,
        servicioNombre:  p.servicio?.nombre,
        precio:          p.servicio?.precio,
        categoria:       p.servicio?.categoria,
        proveedorId:     p.proveedorId,
        proveedorNombre: p.proveedor?.nombre,
        descripcion:     p.descripcion ?? '',
      },
    })
  }

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

  function pagarPedido(id: string, servicioNombre: string, monto: number) {
    Alert.alert(
      `¿Pagar $${monto?.toLocaleString('es-AR')}?`,
      `${servicioNombre} — el pago queda retenido y se le libera al proveedor recién cuando confirmes que el trabajo está hecho.

(Modo de prueba: no se cobra dinero real.)`,
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: async () => {
            setCompletando(id)
            try {
              await pedidosService.pagar(id)
              haptica.exito()
              await cargarPedidos()
            } catch (err: any) {
              alertaError(err.response?.data?.mensaje || 'No se pudo procesar el pago')
            } finally {
              setCompletando(null)
            }
          },
        },
      ]
    )
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
              haptica.exito()
              await cargarPedidos()
            } catch (err: any) {
              alertaError(err.response?.data?.mensaje || 'No se pudo confirmar')
            } finally {
              setCompletando(null)
            }
          }
        }
      ]
    )
  }

  // El cliente puede cancelar mientras el trabajo no arrancó (si ya pagó, se le devuelve)
  function cancelarPedido(id: string, servicioNombre: string, pagado: boolean) {
    Alert.alert(
      '¿Cancelar el pedido?',
      `${servicioNombre}${pagado ? ' — te devolvemos el pago completo.' : ''}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            setCompletando(id)
            try {
              await pedidosService.cambiarEstado(id, 'CANCELADO')
              haptica.exito()
              await cargarPedidos()
            } catch (err: any) {
              alertaError(err.response?.data?.mensaje || 'No se pudo cancelar el pedido')
            } finally {
              setCompletando(null)
            }
          },
        },
      ]
    )
  }

  // "En curso" incluye los aceptados (igual que el contador de arriba): antes un pedido
  // aceptado no aparecía en ningún filtro salvo "Todos"
  const filtrados = filtro === 'todos'
    ? pedidos
    : filtro === 'en_curso'
      ? pedidos.filter(p => p.estado === 'EN_CURSO' || p.estado === 'ACEPTADO')
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
          <PressScale haptico
            style={styles.panelBtn}
            onPress={() => router.push('/proveedor-panel')}
          >
            <Text style={styles.panelBtnText}>Panel</Text>
            <Icono nombre="arrow-forward" tamano={13} color="white" />
          </PressScale>
        )}
      </View>

      {/* Stats rápidas */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statNum}>{pedidos.filter(p => p.estado === 'PENDIENTE').length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.statNum, { color:'#1F6FD1' }]}>{pedidos.filter(p => p.estado === 'EN_CURSO' || p.estado === 'ACEPTADO').length}</Text>
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
              <Icono nombre={esProveedor ? 'briefcase-outline' : 'receipt-outline'} tamano={48} color={tema.subTexto} style={styles.emptyIco} />
              <Text style={styles.emptyText}>{esProveedor ? 'Sin trabajos todavía' : 'No hay pedidos'}</Text>
              <Text style={styles.emptySub}>{esProveedor ? 'Cuando un cliente te contrate aparecerá acá' : 'Tus pedidos aparecerán acá'}</Text>
            </View>
          }
          renderItem={conEntrada(({ item }) => {
            const tienChat = ['ACEPTADO','EN_CURSO','COMPLETADO'].includes(item.estado)
            const contraparte = esProveedor ? item.cliente : item.proveedor

            return (
              <TouchableOpacity
                style={styles.pedidoCard}
                activeOpacity={tienChat ? .7 : 1}
                onPress={() => {
                  if (tienChat) {
                    router.push({
                      pathname: '/chat/[pedidoId]',
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
                    <Icono nombre={categoriaInfo(item.servicio?.categoria).icono} tamano={20} color={Colors.primary} />
                  </View>
                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoServicio}>{item.servicio?.nombre}</Text>
                    <View style={styles.contraparteFila}>
                      <Icono nombre={esProveedor ? 'person-outline' : 'briefcase-outline'} tamano={11} color={tema.subTexto} />
                      <Text style={styles.pedidoContraparte}>
                        {esProveedor ? 'Cliente: ' : 'Proveedor: '}{contraparte?.nombre}
                      </Text>
                    </View>
                    {(item.urgente || (contraparte?.plan && contraparte.plan !== 'GRATIS')) && (
                      <View style={styles.badgesRow}>
                        {item.urgente && (
                          <View style={styles.urgenteBadge}>
                            <Icono nombre="flash" tamano={10} color={tema.dorado} />
                            <Text style={styles.urgenteText}>Urgente</Text>
                          </View>
                        )}
                        <PlanBadge plan={contraparte?.plan} rol={esProveedor ? 'CLIENTE' : 'PROVEEDOR'} oscuro={tema.esOscuro} />
                      </View>
                    )}
                  </View>
                  <View style={styles.pedidoRight}>
                    <EstadoBadge estado={item.estado} oscuro={tema.esOscuro} />
                    {tienChat && (
                      <View style={styles.contraparteFila}>
                        <Icono nombre="chatbubble-ellipses-outline" tamano={12} color={Colors.primary} />
                        <Text style={styles.chatHint}>Chat</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Acciones rápidas para proveedor */}
                {esProveedor && item.estado === 'PENDIENTE' && (
                  <View style={styles.accionesRow}>
                    <PressScale haptico
                      style={styles.btnAceptar}
                      onPress={() => router.push('/proveedor-panel/pedidos')}
                    >
                      <Icono nombre="checkmark-circle-outline" tamano={16} color="white" />
                      <Text style={styles.btnAceptarText}>Gestionar pedido</Text>
                    </PressScale>
                  </View>
                )}

                {/* Pagar (solo cliente, pedido aceptado todavia sin pagar) */}
                {!esProveedor && item.estado === 'ACEPTADO' && !item.pago && (
                  <View style={styles.accionesRow}>
                    {completando === item.id ? (
                      <ActivityIndicator color={Colors.primary} style={{ flex:1 }} />
                    ) : (
                      <PressScale haptico
                        style={styles.btnAceptar}
                        onPress={() => pagarPedido(item.id, item.servicio?.nombre, item.montoTotal)}
                      >
                        <Icono nombre="card-outline" tamano={16} color="white" />
                        <Text style={styles.btnAceptarText}>Pagar ${item.montoTotal?.toLocaleString('es-AR')}</Text>
                      </PressScale>
                    )}
                  </View>
                )}

                <ProgresoPedido estado={item.estado} pagado={!!item.pago} />

                {/* Estado del pago */}
                {item.pago && (
                  <View style={styles.pagoFila}>
                    <Icono nombre={PAGO_ESTADO[item.pago.estado]?.icono ?? 'card-outline'} tamano={13} color={colorPago(item.pago.estado)} />
                    <Text style={[styles.pagoEstado, { color: colorPago(item.pago.estado) }]}>
                      {PAGO_ESTADO[item.pago.estado]?.texto}
                    </Text>
                  </View>
                )}

                {/* Confirmar completado (solo cliente, pedido en curso) */}
                {!esProveedor && item.estado === 'EN_CURSO' && (
                  <View style={styles.accionesRow}>
                    {completando === item.id ? (
                      <ActivityIndicator color={Colors.primary} style={{ flex:1 }} />
                    ) : (
                      <PressScale haptico
                        style={styles.btnAceptar}
                        onPress={() => confirmarCompletado(item.id, item.servicio?.nombre)}
                      >
                        <Icono nombre="checkmark-done" tamano={16} color="white" />
                        <Text style={styles.btnAceptarText}>Confirmar trabajo completado</Text>
                      </PressScale>
                    )}
                  </View>
                )}

                <View style={styles.pedidoBottom}>
                  <View style={styles.contraparteFila}>
                    <Icono nombre="calendar-outline" tamano={12} color={tema.subTexto} />
                    <Text style={styles.pedidoFecha}>{formatFecha(item.fecha)}</Text>
                  </View>
                  <Text style={styles.pedidoMonto}>${item.montoTotal?.toLocaleString('es-AR')}</Text>
                </View>

                {/* Acciones en su propia fila: junto a la fecha y el precio no entraban y el
                    precio quedaba cortado */}
                {!esProveedor && item.estado !== 'EN_CURSO' && completando !== item.id && (
                  <View style={styles.accionesPie}>
                    {['PENDIENTE', 'ACEPTADO'].includes(item.estado) && completando !== item.id && (
                      <PressScale
                        style={styles.cancelarBtn}
                        onPress={() => cancelarPedido(item.id, item.servicio?.nombre, !!item.pago)}
                        accessibilityLabel="Cancelar pedido"
                      >
                        <Icono nombre="close" tamano={13} color={tema.peligro} />
                        <Text style={[styles.cancelarBtnText, { color: tema.peligro }]}>Cancelar</Text>
                      </PressScale>
                    )}
                    {item.estado === 'COMPLETADO' && !esProveedor && item.resena && (
                      <View style={styles.calificadoBadge} accessibilityLabel={`Calificaste con ${item.resena.puntaje} estrellas`}>
                        <Icono nombre="star" tamano={12} color={tema.dorado} />
                        <Text style={styles.calificarBtnText}>{item.resena.puntaje} · Calificado</Text>
                      </View>
                    )}
                    {item.estado === 'COMPLETADO' && !esProveedor && !item.resena && (
                      <PressScale haptico
                        style={styles.calificarBtn}
                        onPress={() => router.push({
                          pathname: '/resena/nueva',
                          params: {
                            pedidoId:        item.id,
                            proveedorNombre: item.proveedor?.nombre,
                            proveedorAvatar: item.proveedor?.avatar ?? '',
                            servicioNombre:  item.servicio?.nombre,
                          }
                        })}
                      >
                        <Icono nombre="star" tamano={12} color={tema.dorado} />
                        <Text style={styles.calificarBtnText}>Calificar</Text>
                      </PressScale>
                    )}
                    {!esProveedor && ['COMPLETADO', 'CANCELADO'].includes(item.estado) && (
                      <PressScale
                        style={styles.repetirBtn}
                        onPress={() => repetirPedido(item)}
                        accessibilityLabel="Repetir pedido"
                      >
                        <Icono nombre="repeat" tamano={13} color={tema.esOscuro ? Colors.primaryLight : '#137A47'} />
                        <Text style={styles.repetirBtnText}>Repetir</Text>
                        {nivel < 1 && <Icono nombre="sparkles" tamano={11} color="#2F80ED" />}
                      </PressScale>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        />
      )}
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:          { flex:1, backgroundColor:tema.bg },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:60, paddingBottom:12 },
  title:              { fontSize:26, fontFamily: F.extrabold, color:tema.texto },
  subtitle:           { fontFamily: F.regular, fontSize:12, color:tema.subTexto, marginTop:2 },
  panelBtn:           { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:tema.seleccion, paddingHorizontal:14, paddingVertical:8, borderRadius:100 },
  panelBtnText:       { color:'white', fontSize:12, fontFamily: F.bold },
  statsRow:           { flexDirection:'row', gap:10, paddingHorizontal:22, marginBottom:16 },
  statChip:           { flex:1, backgroundColor:tema.card, borderRadius:14, padding:12, alignItems:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  statNum:            { fontSize:22, fontFamily: F.extrabold, color:tema.texto, marginBottom:2 },
  statLabel:          { fontSize:10, color:tema.subTexto, fontFamily: F.medium },
  // Sin flexGrow/flexShrink 0 la lista de pedidos le robaba altura y los chips quedaban cortados
  filtrosList:        { flexGrow:0, flexShrink:0, marginBottom:14 },
  // alignItems:center: cada chip toma su altura natural en vez de estirarse al alto de la lista
  filtrosContainer:   { paddingHorizontal:22, gap:8, alignItems:'center' },
  filtroBtn:          { paddingHorizontal:16, paddingVertical:8, borderRadius:100, backgroundColor:tema.card, borderWidth:1.5, borderColor:tema.border },
  filtroBtnActive:    { backgroundColor:tema.seleccion, borderColor:tema.seleccion },
  filtroBtnText:      { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  filtroBtnTextActive:{ color:'white' },
  listContainer:      { paddingHorizontal:22, gap:12, paddingBottom:100 },
  pedidoCard:         { backgroundColor:tema.card, borderRadius:18, padding:16, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  pedidoTop:          { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  pedidoIco:          { width:44, height:44, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  pedidoInfo:         { flex:1 },
  pedidoServicio:     { fontSize:14, fontFamily: F.bold, color:tema.texto, marginBottom:2 },
  pedidoContraparte:  { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  pedidoRight:        { alignItems:'flex-end', gap:4 },
  chatHint:           { fontSize:10, color:Colors.primary, fontFamily: F.semibold },
  contraparteFila:    { flexDirection:'row', alignItems:'center', gap:4 },
  accionesRow:        { flexDirection:'row', gap:8, marginBottom:12 },
  pagoFila:           { flexDirection:'row', alignItems:'center', gap:6, marginBottom:10 },
  pagoEstado:         { fontSize:11, fontFamily: F.bold, flexShrink:1 },
  btnRechazar:        { flex:1, paddingVertical:10, borderRadius:12, borderWidth:1.5, borderColor:tema.border, alignItems:'center' },
  btnRechazarText:    { color:tema.texto, fontFamily: F.semibold, fontSize:13 },
  btnAceptar:         { flex:2, flexDirection:'row', justifyContent:'center', gap:7, paddingVertical:11, borderRadius:12, backgroundColor:Colors.primary, alignItems:'center' },
  btnAceptarText:     { color:'white', fontFamily: F.bold, fontSize:13 },
  pedidoBottom:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderTopWidth:1, borderTopColor:tema.border, paddingTop:10 },
  accionesPie:        { flexDirection:'row', flexWrap:'wrap', justifyContent:'flex-end', gap:8, marginTop:10 },
  pedidoFecha:        { fontFamily: F.regular, fontSize:11, color:tema.subTexto },
  pedidoMonto:        { fontSize:16, fontFamily: F.extrabold, color:tema.texto },
  calificarBtn:       { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,210,63,.18)', paddingHorizontal:12, paddingVertical:6, borderRadius:100 },
  calificarBtnText:   { fontSize:11, fontFamily: F.bold, color:tema.dorado },
  calificadoBadge:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:4, paddingVertical:6 },
  cancelarBtn:        { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(192,57,43,.08)', paddingHorizontal:12, paddingVertical:6, borderRadius:100 },
  cancelarBtnText:    { fontSize:11, fontFamily: F.bold },
  repetirBtn:         { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(26,158,92,.1)', paddingHorizontal:12, paddingVertical:6, borderRadius:100 },
  repetirBtnText:     { fontSize:11, fontFamily: F.bold, color: tema.esOscuro ? Colors.primaryLight : '#137A47' },
  badgesRow:          { flexDirection:'row', alignItems:'center', gap:6, marginTop:5 },
  urgenteBadge:       { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(255,210,63,.25)', paddingHorizontal:8, paddingVertical:2, borderRadius:100 },
  urgenteText:        { fontSize:9, fontFamily: F.extrabold, color:tema.dorado },
  empty:              { alignItems:'center', paddingTop:60 },
  emptyIco:           { marginBottom:12, opacity:.5 },
  emptyText:          { fontSize:16, fontFamily: F.bold, color:tema.subTexto },
  emptySub:           { fontFamily: F.regular, fontSize:13, color:tema.subTexto, marginTop:4, textAlign:'center', paddingHorizontal:32 },
})
