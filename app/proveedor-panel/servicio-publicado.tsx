import { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

const { width } = Dimensions.get('window')

const COLOR = '#6C63FF'
const COLOR_LIGHT = '#8B85FF'

export default function ServicioPublicadoScreen() {
  const router = useRouter()
  const { nombre, precio, categoria } = useLocalSearchParams<any>()

  const scaleCheck  = useRef(new Animated.Value(0)).current
  const fadeContent = useRef(new Animated.Value(0)).current
  const slideUp     = useRef(new Animated.Value(60)).current
  const ripple      = useRef(new Animated.Value(0)).current
  const rotateAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(ripple, { toValue:1, duration:900, useNativeDriver:true }).start()

    Animated.sequence([
      Animated.delay(300),
      Animated.spring(scaleCheck, { toValue:1, tension:50, friction:5, useNativeDriver:true }),
    ]).start()

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(rotateAnim, { toValue:1, duration:600, useNativeDriver:true }),
    ]).start()

    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(fadeContent, { toValue:1, duration:500, useNativeDriver:true }),
        Animated.timing(slideUp,     { toValue:0, duration:500, useNativeDriver:true }),
      ]),
    ]).start()
  }, [])

  const rippleScale = ripple.interpolate({ inputRange:[0,1], outputRange:[0.3,2.2] })
  const rippleOpacity = ripple.interpolate({ inputRange:[0,1], outputRange:[0.5,0] })
  const rotate = rotateAnim.interpolate({ inputRange:[0,1], outputRange:['-30deg','0deg'] })

  const CAT_ICOS: Record<string,string> = {
    plomeria:'🔧', electricidad:'⚡', albanileria:'🏗️',
    carpinteria:'🪟', jardin:'🌿', limpieza:'🧹', pintura:'🎨',
  }

  return (
    <View style={styles.container}>

      {/* Fondo animado */}
      <View style={styles.bgWrap}>
        <Animated.View style={[styles.ripple, {
          transform:[{ scale: rippleScale }],
          opacity: rippleOpacity,
        }]} />
        <Animated.View style={[styles.ripple2, {
          transform:[{ scale: rippleScale }],
          opacity: rippleOpacity,
        }]} />
        {/* Partículas decorativas */}
        <View style={[styles.particle, { top:'15%', left:'10%' }]}><Text style={styles.particleText}>✦</Text></View>
        <View style={[styles.particle, { top:'20%', right:'12%' }]}><Text style={styles.particleText}>✦</Text></View>
        <View style={[styles.particle, { top:'35%', left:'5%' }]}><Text style={styles.particleText}>·</Text></View>
        <View style={[styles.particle, { top:'30%', right:'8%' }]}><Text style={styles.particleText}>✦</Text></View>
      </View>

      {/* TOP — check animado */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.checkWrap, { transform:[{ scale: scaleCheck }] }]}>
          <View style={styles.checkRing3} />
          <View style={styles.checkRing2} />
          <View style={styles.checkRing1} />
          <View style={styles.checkCircle}>
            <Animated.Text style={[styles.checkMark, { transform:[{ rotate }] }]}>🚀</Animated.Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.topTexts, { opacity:fadeContent, transform:[{translateY:slideUp}] }]}>
          <Text style={styles.exitoTitle}>¡Servicio{'\n'}publicado!</Text>
          <Text style={styles.exitoSub}>Ya está visible para los clientes de tu zona</Text>
        </Animated.View>
      </View>

      {/* CARD preview del servicio */}
      <Animated.View style={[styles.card, { opacity:fadeContent, transform:[{translateY:slideUp}] }]}>

        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Tu nuevo servicio</Text>
        </View>

        <View style={styles.servicePreview}>
          <View style={styles.serviceIco}>
            <Text style={styles.serviceIcoText}>{CAT_ICOS[categoria] ?? '🔧'}</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{nombre}</Text>
            <Text style={styles.serviceCat}>{categoria}</Text>
          </View>
          <Text style={styles.servicePrice}>${Number(precio).toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        {/* Stats del servicio */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>● Activo</Text>
            </View>
            <Text style={styles.statLabel}>Estado</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips para conseguir más clientes</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipIco}>📸</Text>
            <Text style={styles.tipText}>Agregá fotos de trabajos anteriores</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIco}>⚡</Text>
            <Text style={styles.tipText}>Respondé rápido para subir tu rating</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIco}>💰</Text>
            <Text style={styles.tipText}>Ofrecé un precio competitivo al inicio</Text>
          </View>
        </View>

      </Animated.View>

      {/* Botones */}
      <Animated.View style={[styles.buttons, { opacity:fadeContent }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.replace('/proveedor-panel/servicios')}
        >
          <Text style={styles.btnPrimaryText}>Ver mis servicios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.replace('/proveedor-panel')}
        >
          <Text style={styles.btnSecondaryText}>Ir al dashboard</Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:COLOR },
  bgWrap:          { position:'absolute', inset:0, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  ripple:          { position:'absolute', width:width, height:width, borderRadius:width/2, backgroundColor:'rgba(255,255,255,.12)' },
  ripple2:         { position:'absolute', width:width*1.6, height:width*1.6, borderRadius:width, backgroundColor:'rgba(255,255,255,.06)' },
  particle:        { position:'absolute' },
  particleText:    { color:'rgba(255,255,255,.3)', fontSize:20 },
  topSection:      { alignItems:'center', paddingTop:72, paddingBottom:28 },
  checkWrap:       { alignItems:'center', justifyContent:'center', marginBottom:24, position:'relative' },
  checkRing3:      { position:'absolute', width:160, height:160, borderRadius:80, backgroundColor:'rgba(255,255,255,.08)' },
  checkRing2:      { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(255,255,255,.12)' },
  checkRing1:      { position:'absolute', width:90, height:90, borderRadius:45, backgroundColor:'rgba(255,255,255,.18)' },
  checkCircle:     { width:72, height:72, borderRadius:36, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.2, shadowRadius:16, elevation:8 },
  checkMark:       { fontSize:34 },
  topTexts:        { alignItems:'center' },
  exitoTitle:      { fontSize:36, fontWeight:'900', color:'white', textAlign:'center', lineHeight:42, marginBottom:8 },
  exitoSub:        { fontSize:14, color:'rgba(255,255,255,.7)', textAlign:'center', paddingHorizontal:32 },
  card:            { backgroundColor:'white', marginHorizontal:20, borderRadius:24, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.15, shadowRadius:24, elevation:8 },
  cardHeader:      { backgroundColor:COLOR, paddingHorizontal:20, paddingVertical:12 },
  cardHeaderText:  { fontSize:12, fontWeight:'700', color:'rgba(255,255,255,.8)', letterSpacing:1 },
  servicePreview:  { flexDirection:'row', alignItems:'center', gap:14, padding:20 },
  serviceIco:      { width:50, height:50, borderRadius:15, backgroundColor:'rgba(108,99,255,.1)', alignItems:'center', justifyContent:'center' },
  serviceIcoText:  { fontSize:24 },
  serviceInfo:     { flex:1 },
  serviceName:     { fontSize:16, fontWeight:'800', color:'#1a1a1a', marginBottom:3 },
  serviceCat:      { fontSize:12, color:'#888' },
  servicePrice:    { fontSize:20, fontWeight:'900', color:'#1a1a1a' },
  divider:         { height:1, backgroundColor:'#f0f0f0', marginHorizontal:20 },
  statsRow:        { flexDirection:'row', padding:16 },
  statItem:        { flex:1, alignItems:'center', gap:4 },
  statDivider:     { width:1, backgroundColor:'#f0f0f0' },
  statNum:         { fontSize:20, fontWeight:'900', color:'#1a1a1a' },
  statLabel:       { fontSize:10, color:'#888', fontWeight:'500' },
  activeBadge:     { backgroundColor:'rgba(108,99,255,.1)', paddingHorizontal:10, paddingVertical:3, borderRadius:100 },
  activeBadgeText: { fontSize:11, fontWeight:'700', color:COLOR },
  tipsSection:     { padding:20, gap:10 },
  tipsTitle:       { fontSize:13, fontWeight:'800', color:'#1a1a1a', marginBottom:4 },
  tipRow:          { flexDirection:'row', alignItems:'center', gap:10 },
  tipIco:          { fontSize:16, width:24 },
  tipText:         { fontSize:12, color:'#666', flex:1 },
  buttons:         { padding:20, gap:10 },
  btnPrimary:      { backgroundColor:'white', borderRadius:16, paddingVertical:16, alignItems:'center' },
  btnPrimaryText:  { color:COLOR, fontSize:15, fontWeight:'800' },
  btnSecondary:    { borderRadius:16, paddingVertical:14, alignItems:'center' },
  btnSecondaryText:{ color:'rgba(255,255,255,.7)', fontSize:14, fontWeight:'600' },
})
