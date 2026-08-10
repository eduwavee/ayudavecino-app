import { useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'

const { width, height } = Dimensions.get('window')

const FEATURES = [
  { ico:'⚡', text:'Respuesta en minutos' },
  { ico:'🔒', text:'Pagos seguros con escrow' },
  { ico:'⭐', text:'Profesionales verificados' },
]

const CHIPS = [
  { ico:'🔧', label:'Plomero',      top:120, left:20,  delay:0 },
  { ico:'⚡', label:'Electricista', top:80,  right:20, delay:100 },
  { ico:'🏗️', label:'Albañil',      top:200, left:40,  delay:200 },
  { ico:'🎨', label:'Pintor',       top:170, right:30, delay:150 },
  { ico:'🌿', label:'Jardinero',    top:280, left:10,  delay:250 },
]

export default function WelcomeScreen() {
  const router = useRouter()

  // Animaciones
  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(30)).current
  const scaleAnim   = useRef(new Animated.Value(0.9)).current
  const chipAnims   = CHIPS.map(() => useRef(new Animated.Value(0)).current)
  const floatAnim   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Entrada principal
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:700, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:700, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, tension:50, friction:8, useNativeDriver:true }),
    ]).start()

    // Chips uno por uno
    chipAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(400 + CHIPS[i].delay),
        Animated.spring(anim, { toValue:1, tension:60, friction:7, useNativeDriver:true }),
      ]).start()
    })

    // Flotación continua del emoji central
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue:1, duration:2000, useNativeDriver:true }),
        Animated.timing(floatAnim, { toValue:0, duration:2000, useNativeDriver:true }),
      ])
    ).start()
  }, [])

  const floatY = floatAnim.interpolate({ inputRange:[0,1], outputRange:[0,-12] })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── FONDO decorativo ── */}
      <View style={styles.bgDecor}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>

      {/* ── TOP: ilustración ── */}
      <View style={styles.topSection}>

        {/* Chips flotantes */}
        {CHIPS.map((chip, i) => (
          <Animated.View
            key={i}
            style={[
              styles.chip,
              chip.left !== undefined ? { left: chip.left } : { right: chip.right },
              { top: chip.top },
              {
                opacity: chipAnims[i],
                transform: [{ scale: chipAnims[i].interpolate({ inputRange:[0,1], outputRange:[0.5,1] }) }]
              }
            ]}
          >
            <Text style={styles.chipIco}>{chip.ico}</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </Animated.View>
        ))}

        {/* Emoji central animado */}
        <Animated.View style={[styles.centralWrap, { transform:[{ translateY: floatY }] }]}>
          <View style={styles.centralRing3} />
          <View style={styles.centralRing2} />
          <View style={styles.centralRing1} />
          <View style={styles.centralCircle}>
            <Text style={styles.centralEmoji}>🏘️</Text>
          </View>
        </Animated.View>

        {/* Badge "En vivo" */}
        <Animated.View style={[styles.liveBadge, { opacity: fadeAnim }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>+2.400 vecinos activos</Text>
        </Animated.View>

      </View>

      {/* ── BOTTOM: contenido ── */}
      <Animated.View style={[
        styles.bottomSection,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}>

        {/* Título */}
        <View style={styles.titleWrap}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>🏆 #1 en Tucumán</Text>
          </View>
          <Text style={styles.title}>
            Tu barrio,{'\n'}
            <Text style={styles.titleGreen}>más conectado</Text>
          </Text>
          <Text style={styles.subtitle}>
            Encontrá profesionales de confianza cerca tuyo o publicá tus servicios al vecindario.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIcoWrap}>
                <Text style={styles.featureIco}>{f.ico}</Text>
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/(auth)/registro')}
            activeOpacity={.85}
          >
            <Text style={styles.btnPrimaryText}>Comenzar gratis →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={.85}
          >
            <Text style={styles.btnSecondaryText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          Al continuar aceptás nuestros{' '}
          <Text style={styles.termsLink}>Términos</Text>
          {' '}y{' '}
          <Text style={styles.termsLink}>Política de privacidad</Text>
        </Text>

      </Animated.View>

    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:'white' },

  // Fondo decorativo
  bgDecor:        { position:'absolute', inset:0 },
  circle1:        { position:'absolute', width:320, height:320, borderRadius:160, backgroundColor:Colors.primary, opacity:.06, top:-80, right:-80 },
  circle2:        { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#FFD23F', opacity:.08, top:100, left:-60 },
  circle3:        { position:'absolute', width:150, height:150, borderRadius:75, backgroundColor:Colors.primaryLight, opacity:.06, top:280, right:-30 },
  line1:          { position:'absolute', width:1, height:200, backgroundColor:Colors.primary, opacity:.06, top:0, left:width*0.3, transform:[{rotate:'15deg'}] },
  line2:          { position:'absolute', width:1, height:200, backgroundColor:Colors.primary, opacity:.06, top:0, right:width*0.25, transform:[{rotate:'-15deg'}] },

  // Top
  topSection:     { height:height*0.42, position:'relative', alignItems:'center', justifyContent:'center' },

  // Chips
  chip:           { position:'absolute', flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'white', borderRadius:100, paddingHorizontal:12, paddingVertical:7, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.1, shadowRadius:10, elevation:4 },
  chipIco:        { fontSize:14 },
  chipLabel:      { fontSize:11, fontWeight:'700', color:Colors.dark },

  // Central
  centralWrap:    { alignItems:'center', justifyContent:'center', position:'relative' },
  centralRing3:   { position:'absolute', width:160, height:160, borderRadius:80, backgroundColor:Colors.primary, opacity:.05 },
  centralRing2:   { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:Colors.primary, opacity:.08 },
  centralRing1:   { position:'absolute', width:88, height:88, borderRadius:44, backgroundColor:Colors.primary, opacity:.12 },
  centralCircle:  { width:80, height:80, borderRadius:26, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:8}, shadowOpacity:.35, shadowRadius:16, elevation:8 },
  centralEmoji:   { fontSize:38 },

  // Live badge
  liveBadge:      { position:'absolute', bottom:16, flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'white', borderRadius:100, paddingHorizontal:14, paddingVertical:8, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.1, shadowRadius:12, elevation:4, borderWidth:1, borderColor:'#f0f0f0' },
  liveDot:        { width:8, height:8, borderRadius:4, backgroundColor:Colors.primary },
  liveText:       { fontSize:12, fontWeight:'700', color:Colors.dark },

  // Bottom
  bottomSection:  { flex:1, backgroundColor:'white', borderTopLeftRadius:32, borderTopRightRadius:32, padding:28, paddingTop:24, shadowColor:'#000', shadowOffset:{width:0,height:-4}, shadowOpacity:.06, shadowRadius:16, elevation:8 },

  // Título
  titleWrap:      { marginBottom:20 },
  titleBadge:     { alignSelf:'flex-start', backgroundColor:Colors.greenLight, paddingHorizontal:12, paddingVertical:5, borderRadius:100, marginBottom:12 },
  titleBadgeText: { fontSize:11, fontWeight:'800', color:Colors.primary },
  title:          { fontSize:32, fontWeight:'900', color:Colors.dark, lineHeight:38, marginBottom:8 },
  titleGreen:     { color:Colors.primary },
  subtitle:       { fontSize:14, color:Colors.gray, lineHeight:21 },

  // Features
  features:       { flexDirection:'row', justifyContent:'space-between', marginBottom:24, backgroundColor:Colors.cream, borderRadius:18, padding:14 },
  featureItem:    { alignItems:'center', gap:6, flex:1 },
  featureIcoWrap: { width:36, height:36, borderRadius:11, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:4, elevation:2 },
  featureIco:     { fontSize:16 },
  featureText:    { fontSize:9, fontWeight:'700', color:Colors.dark, textAlign:'center', lineHeight:13 },

  // Botones
  buttons:        { gap:10, marginBottom:16 },
  btnPrimary:     { backgroundColor:Colors.primary, borderRadius:18, paddingVertical:17, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:6}, shadowOpacity:.35, shadowRadius:12, elevation:6 },
  btnPrimaryText: { color:'white', fontSize:16, fontWeight:'800', letterSpacing:.3 },
  btnSecondary:   { borderRadius:18, paddingVertical:15, alignItems:'center', backgroundColor:Colors.cream },
  btnSecondaryText:{ color:Colors.dark, fontSize:15, fontWeight:'600' },

  // Terms
  terms:          { textAlign:'center', fontSize:10, color:'#bbb', lineHeight:16 },
  termsLink:      { color:Colors.primary, fontWeight:'600' },
})
