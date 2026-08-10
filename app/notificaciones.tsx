import { useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Animated
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useNotifStore } from '../store/notificacionesStore'
import { notificacionesService } from '../services/notificaciones.service'

const TIPO_CONFIG: Record<string, { ico: string; color: string; bg: string }> = {
  pedido:  { ico:'📋', color:Colors.primary,  bg:'rgba(26,158,92,.1)' },
  pago:    { ico:'💳', color:'#FFD23F',        bg:'rgba(255,210,63,.1)' },
  mensaje: { ico:'💬', color:'#74B9FF',        bg:'rgba(116,185,255,.1)' },
  sistema: { ico:'🏘️', color:'#888',           bg:'rgba(0,0,0,.05)' },
}

function tiempoRelativo(fecha: Date) {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  const hs   = Math.floor(diff / 3600000)
  const dias = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  if (hs < 24)   return `Hace ${hs} hs`
  return `Hace ${dias} días`
}

export default function NotificacionesScreen() {
  const router         = useRouter()
  const { notificaciones, noLeidas, marcarLeidas, limpiarTodo } = useNotifStore()

  useEffect(() => {
    notificacionesService.limpiarBadge()
    marcarLeidas()
  }, [])

  // Notificaciones de ejemplo si está vacío
  const EJEMPLOS = [
    { id:'1', titulo:'Pedido aceptado', cuerpo:'Carlos Méndez aceptó tu pedido de reparación de caño', tipo:'pedido', leida:false, fecha:new Date(Date.now()-300000) },
    { id:'2', titulo:'Pago retenido',   cuerpo:'Tu pago de $9.350 está retenido en escrow', tipo:'pago', leida:true, fecha:new Date(Date.now()-600000) },
    { id:'3', titulo:'Nuevo mensaje',   cuerpo:'Carlos: "Llego en 10 minutos"', tipo:'mensaje', leida:true, fecha:new Date(Date.now()-900000) },
    { id:'4', titulo:'¡Bienvenido!',    cuerpo:'Gracias por unirte a AyudaVecino 🏘️', tipo:'sistema', leida:true, fecha:new Date(Date.now()-86400000) },
  ]

  const data = notificaciones.length > 0 ? notificaciones : EJEMPLOS

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {data.length > 0 && (
          <TouchableOpacity onPress={limpiarTodo}>
            <Text style={styles.clearBtn}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Badge no leídas */}
      {noLeidas > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>🔴 {noLeidas} sin leer</Text>
          <TouchableOpacity onPress={marcarLeidas}>
            <Text style={styles.marcarBtn}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIco}>🔔</Text>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySub}>Te avisaremos cuando haya novedades</Text>
          </View>
        }
        renderItem={({ item: n }) => {
          const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema
          return (
            <TouchableOpacity
              style={[styles.notifCard, !n.leida && styles.notifCardUnread]}
              activeOpacity={.8}
            >
              {!n.leida && <View style={styles.unreadDot} />}
              <View style={[styles.notifIco, { backgroundColor: cfg.bg }]}>
                <Text style={styles.notifIcoText}>{cfg.ico}</Text>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitulo}>{n.titulo}</Text>
                <Text style={styles.notifCuerpo} numberOfLines={2}>{n.cuerpo}</Text>
                <Text style={styles.notifFecha}>{tiempoRelativo(n.fecha)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Botón de prueba */}
      <View style={styles.testWrap}>
        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => notificacionesService.mostrarLocal(
            '🔧 Pedido aceptado',
            'Carlos Méndez aceptó tu pedido',
            { tipo:'pedido', ruta:'/(tabs)/pedidos' }
          )}
        >
          <Text style={styles.testBtnText}>🧪 Probar notificación</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:Colors.cream },
  header:          { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:         { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:        { fontSize:16, color:Colors.dark },
  title:           { flex:1, fontSize:22, fontWeight:'900', color:Colors.dark },
  clearBtn:        { fontSize:13, color:'#FF7675', fontWeight:'600' },
  unreadBanner:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'rgba(26,158,92,.08)', marginHorizontal:22, borderRadius:14, padding:12, marginBottom:8 },
  unreadText:      { fontSize:13, fontWeight:'700', color:Colors.primary },
  marcarBtn:       { fontSize:12, color:Colors.primary, fontWeight:'600' },
  list:            { paddingHorizontal:22, gap:10, paddingBottom:120 },
  notifCard:       { backgroundColor:'white', borderRadius:18, padding:16, flexDirection:'row', alignItems:'flex-start', gap:14, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2, position:'relative' },
  notifCardUnread: { backgroundColor:'#F0FDF4', borderWidth:1.5, borderColor:'rgba(26,158,92,.15)' },
  unreadDot:       { position:'absolute', top:16, left:6, width:6, height:6, borderRadius:3, backgroundColor:Colors.primary },
  notifIco:        { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  notifIcoText:    { fontSize:22 },
  notifContent:    { flex:1, gap:3 },
  notifTitulo:     { fontSize:14, fontWeight:'800', color:Colors.dark },
  notifCuerpo:     { fontSize:13, color:'#666', lineHeight:18 },
  notifFecha:      { fontSize:11, color:'#bbb', marginTop:2 },
  empty:           { alignItems:'center', paddingTop:80 },
  emptyIco:        { fontSize:56, marginBottom:16, opacity:.3 },
  emptyTitle:      { fontSize:18, fontWeight:'800', color:Colors.dark, marginBottom:6 },
  emptySub:        { fontSize:13, color:Colors.gray, textAlign:'center' },
  testWrap:        { position:'absolute', bottom:32, left:22, right:22 },
  testBtn:         { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:14, alignItems:'center' },
  testBtnText:     { color:'white', fontSize:14, fontWeight:'700' },
})
