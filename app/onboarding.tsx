import { useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, FlatList,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation, SharedValue,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '../constants/colors'
import { ONBOARDING_KEY } from '../constants/config'
import { FUENTES as F } from '../constants/diseno'
import { PressScale } from '../components/ui/PressScale'

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

const DOT = 8, GAP = 6, PILDORA = DOT

// Slide con parallax por capas: el ícono se desplaza más rápido que el texto y se achica
// al salir; el texto se desvanece. Todo depende del scroll (hilo de UI).
function Slide({ item, indice, scrollX }: { item: typeof SLIDES[number]; indice: number; scrollX: SharedValue<number> }) {
  const rango = [(indice - 1) * width, indice * width, (indice + 1) * width]
  const icono = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.value, rango, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, rango, [0.6, 1, 0.6], Extrapolation.CLAMP) },
      { rotate: `${interpolate(scrollX.value, rango, [-12, 0, 12], Extrapolation.CLAMP)}deg` },
    ],
  }))
  const aro = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, rango, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scrollX.value, rango, [0.4, 1, 0.4], Extrapolation.CLAMP) }],
  }))
  const texto = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, rango, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollX.value, rango, [16, 0, 16], Extrapolation.CLAMP) }],
  }))

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconZona}>
        <Animated.View style={[styles.iconRing, { backgroundColor: item.bg + '22' }, aro]} />
        <Animated.View style={[styles.iconCircle, { backgroundColor: item.bg }, icono]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </Animated.View>
      </View>
      <Animated.View style={texto}>
        <Text style={styles.titulo} accessibilityRole="header">{item.titulo}</Text>
        <Text style={styles.texto}>{item.texto}</Text>
      </Animated.View>
    </View>
  )
}

// Indicador de página: puntos fijos y una píldora que se desliza sobre ellos
function Indicador({ scrollX }: { scrollX: SharedValue<number> }) {
  const pildora = useAnimatedStyle(() => ({
    transform: [{ translateX: (scrollX.value / width) * (DOT + GAP) }],
  }))
  return (
    <View style={styles.dots}>
      {SLIDES.map((_, i) => <View key={i} style={styles.dot} />)}
      <Animated.View style={[styles.pildora, pildora]} />
    </View>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const [indice, setIndice] = useState(0)
  const listRef = useRef<FlatList>(null)
  const scrollX = useSharedValue(0)
  const alScrollear = useAnimatedScrollHandler(e => { scrollX.value = e.contentOffset.x })

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
        onScroll={alScrollear}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setIndice(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item, index }) => <Slide item={item} indice={index} scrollX={scrollX} />}
      />

      <View style={styles.bottom}>
        <Indicador scrollX={scrollX} />

        <PressScale haptico style={styles.nextBtn} onPress={irASiguiente}>
          <Text style={styles.nextText}>{esUltima ? 'Empezar →' : 'Siguiente'}</Text>
        </PressScale>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:'white' },
  skipBtn:     { position:'absolute', top:56, right:22, zIndex:10, padding:8 },
  skipText:    { fontSize:14, fontFamily: F.bold, color:'#6B6B6B' },
  slide:       { alignItems:'center', justifyContent:'center', paddingHorizontal:36, paddingTop:80 },
  iconRing:    { position:'absolute', width:200, height:200, borderRadius:100 },
  iconCircle:  { width:120, height:120, borderRadius:36, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:.15, shadowRadius:16, elevation:8 },
  emoji:       { fontFamily: F.regular, fontSize:56 },
  titulo:      { fontSize:24, fontFamily: F.extrabold, color:Colors.dark, textAlign:'center', marginBottom:14 },
  texto:       { fontFamily: F.regular, fontSize:14, color:'#6B6B6B', textAlign:'center', lineHeight:21, paddingHorizontal:8 },
  bottom:      { paddingHorizontal:28, paddingBottom:48, paddingTop:12, gap:24 },
  dots:        { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6 },
  dot:         { width:DOT, height:DOT, borderRadius:DOT/2, backgroundColor:Colors.primary, opacity:.25 },
  pildora:     { position:'absolute', left:0, width:PILDORA, height:DOT, borderRadius:DOT/2, backgroundColor:Colors.primary },
  iconZona:    { width:200, height:200, alignItems:'center', justifyContent:'center', marginBottom:40 },
  nextBtn:     { backgroundColor:Colors.primary, borderRadius:18, paddingVertical:17, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:6}, shadowOpacity:.35, shadowRadius:12, elevation:6 },
  nextText:    { color:'white', fontSize:16, fontFamily: F.extrabold, letterSpacing:.3 },
})
