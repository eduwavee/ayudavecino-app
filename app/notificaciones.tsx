import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useNotifStore, Notificacion } from '../store/notificacionesStore'
import { notificacionesService } from '../services/notificaciones.service'
import { FUENTES as F } from '../constants/diseno'

const TIPO_CONFIG: Record<string, { ico: string; color: string; bg: string }> = {
  pedido:  { ico:'📋', color:Colors.primary,  bg:'rgba(26,158,92,.1)' },
  pago:    { ico:'💳', color:'#FFD23F',        bg:'rgba(255,210,63,.1)' },
  mensaje: { ico:'💬', color:'#74B9FF',        bg:'rgba(116,185,255,.1)' },
  resena:  { ico:'⭐', color:'#FFD23F',        bg:'rgba(255,210,63,.1)' },
  sistema: { ico:'🏘️', color:'#888',           bg:'rgba(0,0,0,.05)' },
}

function tiempoRelativo(fecha: string) {
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
  const router = useRouter()
  const { notificaciones, noLeidas, cargar, marcarLeida, marcarTodas } = useNotifStore()
  const [refrescando, setRefrescando] = useState(false)

  useEffect(() => {
    notificacionesService.limpiarBadge()
    cargar()
  }, [])

  async function alRefrescar() {
    setRefrescando(true)
    await cargar()
    setRefrescando(false)
  }

  function abrir(n: Notificacion) {
    if (!n.leida) marcarLeida(n.id)
    if (n.ruta) router.push(n.ruta as any)
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      {/* Badge no leídas */}
      {noLeidas > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>🔴 {noLeidas} sin leer</Text>
          <TouchableOpacity onPress={marcarTodas}>
            <Text style={styles.marcarBtn}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notificaciones}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor={Colors.primary} colors={[Colors.primary]} />}
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
              onPress={() => abrir(n)}
            >
              {!n.leida && <View style={styles.unreadDot} />}
              <View style={[styles.notifIco, { backgroundColor: cfg.bg }]}>
                <Text style={styles.notifIcoText}>{cfg.ico}</Text>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitulo}>{n.titulo}</Text>
                <Text style={styles.notifCuerpo} numberOfLines={2}>{n.cuerpo}</Text>
                <Text style={styles.notifFecha}>{tiempoRelativo(n.creadoEn)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:Colors.cream },
  header:          { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:         { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:        { fontFamily: F.regular, fontSize:16, color:Colors.dark },
  title:           { flex:1, fontSize:22, fontFamily: F.extrabold, color:Colors.dark },
  clearBtn:        { fontSize:13, color:'#FF7675', fontFamily: F.semibold },
  unreadBanner:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'rgba(26,158,92,.08)', marginHorizontal:22, borderRadius:14, padding:12, marginBottom:8 },
  unreadText:      { fontSize:13, fontFamily: F.bold, color:Colors.primary },
  marcarBtn:       { fontSize:12, color:Colors.primary, fontFamily: F.semibold },
  list:            { paddingHorizontal:22, gap:10, paddingBottom:120 },
  notifCard:       { backgroundColor:'white', borderRadius:18, padding:16, flexDirection:'row', alignItems:'flex-start', gap:14, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2, position:'relative' },
  notifCardUnread: { backgroundColor:'#F0FDF4', borderWidth:1.5, borderColor:'rgba(26,158,92,.15)' },
  unreadDot:       { position:'absolute', top:16, left:6, width:6, height:6, borderRadius:3, backgroundColor:Colors.primary },
  notifIco:        { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  notifIcoText:    { fontFamily: F.regular, fontSize:22 },
  notifContent:    { flex:1, gap:3 },
  notifTitulo:     { fontSize:14, fontFamily: F.extrabold, color:Colors.dark },
  notifCuerpo:     { fontFamily: F.regular, fontSize:13, color:'#666', lineHeight:18 },
  notifFecha:      { fontFamily: F.regular, fontSize:11, color:'#bbb', marginTop:2 },
  empty:           { alignItems:'center', paddingTop:80 },
  emptyIco:        { fontFamily: F.regular, fontSize:56, marginBottom:16, opacity:.3 },
  emptyTitle:      { fontSize:18, fontFamily: F.extrabold, color:Colors.dark, marginBottom:6 },
  emptySub:        { fontFamily: F.regular, fontSize:13, color:'#6B6B6B', textAlign:'center' },
  testWrap:        { position:'absolute', bottom:32, left:22, right:22 },
  testBtn:         { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:14, alignItems:'center' },
  testBtnText:     { color:'white', fontSize:14, fontFamily: F.bold },
})
