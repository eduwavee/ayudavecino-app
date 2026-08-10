import { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'

const { width } = Dimensions.get('window')

export default function PedidoExitoScreen() {
  const router = useRouter()
  const { monto, servicio, proveedor } = useLocalSearchParams<any>()

  // Animaciones
  const scaleCheck  = useRef(new Animated.Value(0)).current
  const fadeContent = useRef(new Animated.Value(0)).current
  const slideUp     = useRef(new Animated.Value(60)).current
  const ripple      = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1. Ripple de fondo
    Animated.timing(ripple, {
      toValue: 1, duration: 800,
      useNativeDriver: true,
    }).start()

    // 2. Check aparece con bounce
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(scaleCheck, {
        toValue: 1, tension: 50, friction: 5,
        useNativeDriver: true,
      }),
    ]).start()

    // 3. Contenido sube
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(fadeContent, { toValue:1, duration:500, useNativeDriver:true }),
        Animated.timing(slideUp,     { toValue:0, duration:500, useNativeDriver:true }),
      ]),
    ]).start()
  }, [])

  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 2],
  })

  return (
    <View style={styles.container}>

      {/* Fondo verde animado */}
      <View style={styles.greenBg}>
        <Animated.View style={[styles.rippleCircle, {
          transform: [{ scale: rippleScale }],
          opacity: ripple.interpolate({ inputRange:[0,1], outputRange:[0.4, 0] })
        }]} />
        <Animated.View style={[styles.rippleCircle2, {
          transform: [{ scale: rippleScale }],
          opacity: ripple.interpolate({ inputRange:[0,1], outputRange:[0.2, 0] })
        }]} />
      </View>

      {/* CHECK animado */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: scaleCheck }] }]}>
          <View style={styles.checkRing3} />
          <View style={styles.checkRing2} />
          <View style={styles.checkRing1} />
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.topTexts, { opacity: fadeContent, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.exitoTitle}>¡Pedido{'\n'}enviado!</Text>
          <Text style={styles.exitoSub}>Carlos tiene 30 minutos para aceptarlo</Text>
        </Animated.View>
      </View>

      {/* CARD con detalles */}
      <Animated.View style={[styles.card, { opacity: fadeContent, transform: [{ translateY: slideUp }] }]}>

        {/* Número de pedido */}
        <View style={styles.orderIdRow}>
          <Text style={styles.orderIdLabel}>Número de pedido</Text>
          <Text style={styles.orderId}>#AV-{Math.floor(Math.random() * 90000) + 10000}</Text>
        </View>

        <View style={styles.divider} />

        {/* Detalles */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Servicio</Text>
          <Text style={styles.detailValue}>{servicio ?? 'Reparación de caño'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Proveedor</Text>
          <Text style={styles.detailValue}>{proveedor ?? 'Carlos Méndez'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, styles.detailMonto]}>${Number(monto ?? 0).toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        {/* Tracker */}
        <View style={styles.tracker}>
          <View style={styles.trackStep}>
            <View style={[styles.trackDot, styles.trackDotDone]}><Text style={styles.trackDotText}>✓</Text></View>
            <View style={styles.trackLine} />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Pedido enviado</Text>
              <Text style={styles.trackDesc}>Ahora mismo</Text>
            </View>
          </View>
          <View style={styles.trackStep}>
            <View style={[styles.trackDot, styles.trackDotActive]} />
            <View style={[styles.trackLine, { backgroundColor:'#eee' }]} />
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color:Colors.primary }]}>Esperando confirmación</Text>
              <Text style={styles.trackDesc}>Carlos tiene 30 min para aceptar</Text>
            </View>
          </View>
          <View style={styles.trackStep}>
            <View style={[styles.trackDot, { backgroundColor:'#eee' }]} />
            <View style={[styles.trackLine, { backgroundColor:'transparent' }]} />
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color:'#bbb' }]}>Trabajo en curso</Text>
              <Text style={styles.trackDesc}>Próximamente</Text>
            </View>
          </View>
        </View>

      </Animated.View>

      {/* Botones */}
      <Animated.View style={[styles.buttons, { opacity: fadeContent }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.replace('/(tabs)/pedidos')}
        >
          <Text style={styles.btnPrimaryText}>Ver mis pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnSecondaryText}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:Colors.primary },
  greenBg:         { position:'absolute', inset:0, alignItems:'center', justifyContent:'center' },
  rippleCircle:    { position:'absolute', width:width, height:width, borderRadius:width/2, backgroundColor:'rgba(255,255,255,.15)' },
  rippleCircle2:   { position:'absolute', width:width*1.5, height:width*1.5, borderRadius:width, backgroundColor:'rgba(255,255,255,.08)' },
  topSection:      { alignItems:'center', paddingTop:80, paddingBottom:32 },
  checkWrap:       { alignItems:'center', justifyContent:'center', marginBottom:24, position:'relative' },
  checkRing3:      { position:'absolute', width:160, height:160, borderRadius:80, backgroundColor:'rgba(255,255,255,.08)' },
  checkRing2:      { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(255,255,255,.12)' },
  checkRing1:      { position:'absolute', width:90, height:90, borderRadius:45, backgroundColor:'rgba(255,255,255,.18)' },
  checkCircle:     { width:72, height:72, borderRadius:36, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.2, shadowRadius:16, elevation:8 },
  checkMark:       { fontSize:32, color:Colors.primary, fontWeight:'900' },
  topTexts:        { alignItems:'center' },
  exitoTitle:      { fontSize:36, fontWeight:'900', color:'white', textAlign:'center', lineHeight:42, marginBottom:8 },
  exitoSub:        { fontSize:14, color:'rgba(255,255,255,.7)', textAlign:'center' },
  card:            { backgroundColor:'white', marginHorizontal:20, borderRadius:24, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.15, shadowRadius:24, elevation:8 },
  orderIdRow:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  orderIdLabel:    { fontSize:12, color:'#888' },
  orderId:         { fontSize:14, fontWeight:'900', color:Colors.primary, fontVariant:['tabular-nums'] },
  divider:         { height:1, backgroundColor:'#f0f0f0', marginVertical:14 },
  detailRow:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  detailLabel:     { fontSize:13, color:'#888' },
  detailValue:     { fontSize:13, fontWeight:'600', color:'#1a1a1a' },
  detailMonto:     { fontSize:18, fontWeight:'900', color:'#1a1a1a' },
  tracker:         { gap:0 },
  trackStep:       { flexDirection:'row', gap:12, alignItems:'flex-start' },
  trackDot:        { width:26, height:26, borderRadius:13, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 },
  trackDotDone:    { backgroundColor:Colors.primary },
  trackDotActive:  { backgroundColor:Colors.primary, shadowColor:Colors.primary, shadowOffset:{width:0,height:0}, shadowOpacity:.5, shadowRadius:6, elevation:4 },
  trackDotText:    { color:'white', fontSize:12, fontWeight:'900' },
  trackLine:       { position:'absolute', left:12, top:28, width:2, height:36, backgroundColor:Colors.primary, marginLeft:0 },
  trackInfo:       { flex:1, paddingBottom:24 },
  trackTitle:      { fontSize:13, fontWeight:'700', color:'#1a1a1a', marginBottom:2 },
  trackDesc:       { fontSize:11, color:'#aaa' },
  buttons:         { padding:20, gap:10 },
  btnPrimary:      { backgroundColor:'white', borderRadius:16, paddingVertical:16, alignItems:'center' },
  btnPrimaryText:  { color:Colors.primary, fontSize:15, fontWeight:'800' },
  btnSecondary:    { borderRadius:16, paddingVertical:14, alignItems:'center' },
  btnSecondaryText:{ color:'rgba(255,255,255,.7)', fontSize:14, fontWeight:'600' },
})
