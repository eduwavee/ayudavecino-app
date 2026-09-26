import { View, Text, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated, { Easing, FadeIn, Keyframe, ReduceMotion } from 'react-native-reanimated'
import { FUENTES as F } from '../../constants/diseno'
import { PressScale } from '../../components/ui/PressScale'
import { Icono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)

// Momento de cierre (poco frecuente): el sello entra con un leve asentamiento y
// después las estrellas se "marcan" de a una, repitiendo la calificación que dio.
const ENTRADA_SELLO = new Keyframe({
  0:   { opacity: 0, transform: [{ scale: 0.7 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
}).duration(420).reduceMotion(ReduceMotion.System)

const entradaEstrella = (i: number) => new Keyframe({
  0:   { opacity: 0, transform: [{ scale: 0.6 }, { rotate: '-20deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }], easing: EASE_OUT },
}).duration(300).delay(520 + i * 80).reduceMotion(ReduceMotion.System)

const APARECER = FadeIn.duration(360).delay(300).reduceMotion(ReduceMotion.System)

export default function ResenaExitoScreen() {
  const router = useRouter()
  const { puntaje, proveedorNombre } = useLocalSearchParams<any>()
  const estrellas = Math.min(5, Math.max(1, parseInt(puntaje ?? '5') || 5))

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View entering={ENTRADA_SELLO} style={styles.checkWrap}>
        <View style={styles.checkRing2} />
        <View style={styles.checkRing1} />
        <View style={styles.checkCircle}>
          <Icono nombre="star" tamano={40} color="#F5B301" />
        </View>
      </Animated.View>

      <View style={styles.textWrap}>
        <Animated.Text entering={APARECER} style={styles.title}>¡Gracias por{'\n'}tu reseña!</Animated.Text>
        <Animated.Text entering={APARECER} style={styles.subtitle}>
          Tu opinión ayuda a otros vecinos a elegir mejor a {proveedorNombre}
        </Animated.Text>

        <View
          style={styles.starsRow}
          accessible
          accessibilityLabel={`Calificaste con ${estrellas} ${estrellas === 1 ? 'estrella' : 'estrellas'}`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Animated.View key={i} entering={entradaEstrella(i)}>
              <Icono
                nombre={i < estrellas ? 'star' : 'star-outline'}
                tamano={30}
                color={i < estrellas ? '#1a1a1a' : 'rgba(0,0,0,.35)'}
              />
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={APARECER} style={styles.infoCard}>
          <Icono nombre="trophy" tamano={18} color="#1a1a1a" />
          <Text style={styles.infoText}>Tu reseña ya está visible en el perfil del proveedor</Text>
        </Animated.View>
      </View>

      <Animated.View entering={APARECER} style={styles.buttons}>
        <PressScale haptico
          style={styles.btnPrimary}
          onPress={() => router.dismissTo('/(tabs)')}
        >
          <Text style={styles.btnPrimaryText}>Volver al inicio</Text>
        </PressScale>
        <PressScale haptico
          style={styles.btnSecondary}
          onPress={() => router.dismissTo('/(tabs)/pedidos')}
        >
          <Text style={styles.btnSecondaryText}>Ver mis pedidos</Text>
        </PressScale>
      </Animated.View>
      <FondoBarraEstado color="#FFD23F" />
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
  textWrap:     { alignItems:'center', marginBottom:40 },
  title:        { fontSize:34, fontFamily: F.extrabold, color:'#1a1a1a', textAlign:'center', lineHeight:40, marginBottom:12 },
  subtitle:     { fontFamily: F.regular, fontSize:14, color:'rgba(0,0,0,.7)', textAlign:'center', lineHeight:21, marginBottom:20 },
  starsRow:     { flexDirection:'row', gap:6, marginBottom:20 },
  infoCard:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(255,255,255,.3)', borderRadius:14, padding:14, paddingHorizontal:18 },
  infoText:     { flexShrink:1, fontSize:13, color:'#1a1a1a', fontFamily: F.semibold },
  buttons:      { width:'100%', gap:10 },
  btnPrimary:   { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center' },
  btnPrimaryText:{ color:'white', fontSize:15, fontFamily: F.extrabold },
  btnSecondary: { borderRadius:16, paddingVertical:14, alignItems:'center' },
  btnSecondaryText:{ color:'rgba(0,0,0,.7)', fontSize:14, fontFamily: F.semibold },
})
