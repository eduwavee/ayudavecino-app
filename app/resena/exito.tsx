import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function ResenaExitoScreen() {
  const router = useRouter()
  const { puntaje, proveedorNombre } = useLocalSearchParams<any>()
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue:1, tension:50, friction:5, useNativeDriver:true }),
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
    ]).start()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View style={[styles.checkWrap, { transform:[{ scale: scaleAnim }] }]}>
        <View style={styles.checkRing2} />
        <View style={styles.checkRing1} />
        <View style={styles.checkCircle}>
          <Text style={styles.checkEmoji}>⭐</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: fadeAnim }]}>
        <Text style={styles.title}>¡Gracias por{'\n'}tu reseña!</Text>
        <Text style={styles.subtitle}>
          Tu opinión ayuda a otros vecinos a elegir mejor a {proveedorNombre}
        </Text>

        <View style={styles.starsRow}>
          {Array.from({ length: parseInt(puntaje ?? '5') }).map((_, i) => (
            <Text key={i} style={styles.star}>⭐</Text>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            🏆 Tu reseña ya está visible en el perfil del proveedor
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnPrimaryText}>Volver al inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.replace('/(tabs)/pedidos')}
        >
          <Text style={styles.btnSecondaryText}>Ver mis pedidos</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#FFD23F', alignItems:'center', justifyContent:'center', padding:32, overflow:'hidden' },
  bgCircle1:    { position:'absolute', width:300, height:300, borderRadius:150, backgroundColor:'rgba(255,255,255,.12)', top:-80, right:-80 },
  bgCircle2:    { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,.08)', bottom:80, left:-60 },
  checkWrap:    { alignItems:'center', justifyContent:'center', marginBottom:32, position:'relative' },
  checkRing2:   { position:'absolute', width:140, height:140, borderRadius:70, backgroundColor:'rgba(255,255,255,.15)' },
  checkRing1:   { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'rgba(255,255,255,.2)' },
  checkCircle:  { width:80, height:80, borderRadius:40, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.2, shadowRadius:16, elevation:8 },
  checkEmoji:   { fontSize:38 },
  textWrap:     { alignItems:'center', marginBottom:40 },
  title:        { fontSize:34, fontWeight:'900', color:'#1a1a1a', textAlign:'center', lineHeight:40, marginBottom:12 },
  subtitle:     { fontSize:14, color:'rgba(0,0,0,.6)', textAlign:'center', lineHeight:21, marginBottom:20 },
  starsRow:     { flexDirection:'row', gap:4, marginBottom:20 },
  star:         { fontSize:28 },
  infoCard:     { backgroundColor:'rgba(255,255,255,.3)', borderRadius:14, padding:14, paddingHorizontal:20 },
  infoText:     { fontSize:13, color:'#1a1a1a', fontWeight:'600', textAlign:'center' },
  buttons:      { width:'100%', gap:10 },
  btnPrimary:   { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center' },
  btnPrimaryText:{ color:'white', fontSize:15, fontWeight:'800' },
  btnSecondary: { borderRadius:16, paddingVertical:14, alignItems:'center' },
  btnSecondaryText:{ color:'rgba(0,0,0,.6)', fontSize:14, fontWeight:'600' },
})
