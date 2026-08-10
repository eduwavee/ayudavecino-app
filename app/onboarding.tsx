import { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '../constants/colors'
import { ONBOARDING_KEY } from '../constants/config'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '🏘️',
    titulo: 'Bienvenido a AyudaVecino',
    texto: 'Conectamos vecinos con profesionales de confianza para resolver cualquier trabajo en tu casa.',
    bg: Colors.primary,
  },
  {
    emoji: '🗺️',
    titulo: 'Encontrá ayuda cerca tuyo',
    texto: 'Mapa en vivo con proveedores cercanos, filtrados por categoría y con tu distancia real a cada uno.',
    bg: '#74B9FF',
  },
  {
    emoji: '💬',
    titulo: 'Coordiná todo por chat',
    texto: 'Mensajes en tiempo real con el proveedor para acordar horarios y detalles, sin salir de la app.',
    bg: '#FFD23F',
  },
  {
    emoji: '⭐',
    titulo: 'Elegí con confianza',
    texto: 'Mirá reseñas reales de otros vecinos antes de contratar, para saber con quién estás trabajando.',
    bg: Colors.primaryLight,
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [indice, setIndice] = useState(0)
  const listRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const esUltima = indice === SLIDES.length - 1

  async function finalizarOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    router.replace('/(auth)/welcome')
  }

  function irASiguiente() {
    if (esUltima) {
      finalizarOnboarding()
      return
    }
    listRef.current?.scrollToOffset({ offset: (indice + 1) * width, animated: true })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.skipBtn} onPress={finalizarOnboarding}>
        <Text style={styles.skipText}>Saltar</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setIndice(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconRing, { backgroundColor: item.bg + '22' }]}>
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.texto}>{item.texto}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
            const dotWidth = scrollX.interpolate({
              inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp',
            })
            const dotOpacity = scrollX.interpolate({
              inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
            })
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            )
          })}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={irASiguiente} activeOpacity={.85}>
          <Text style={styles.nextText}>{esUltima ? 'Empezar →' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:'white' },
  skipBtn:     { position:'absolute', top:56, right:22, zIndex:10, padding:8 },
  skipText:    { fontSize:14, fontWeight:'700', color:Colors.gray },
  slide:       { alignItems:'center', justifyContent:'center', paddingHorizontal:36, paddingTop:80 },
  iconRing:    { width:200, height:200, borderRadius:100, alignItems:'center', justifyContent:'center', marginBottom:40 },
  iconCircle:  { width:120, height:120, borderRadius:36, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.15, shadowRadius:16, elevation:8 },
  emoji:       { fontSize:56 },
  titulo:      { fontSize:24, fontWeight:'900', color:Colors.dark, textAlign:'center', marginBottom:14 },
  texto:       { fontSize:14, color:Colors.gray, textAlign:'center', lineHeight:21, paddingHorizontal:8 },
  bottom:      { paddingHorizontal:28, paddingBottom:48, paddingTop:12, gap:24 },
  dots:        { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6 },
  dot:         { height:8, borderRadius:4, backgroundColor:Colors.primary },
  nextBtn:     { backgroundColor:Colors.primary, borderRadius:18, paddingVertical:17, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:6}, shadowOpacity:.35, shadowRadius:12, elevation:6 },
  nextText:    { color:'white', fontSize:16, fontWeight:'800', letterSpacing:.3 },
})
