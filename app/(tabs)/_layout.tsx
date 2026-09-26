import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { FUENTES as F, RESORTE, DURACION, CURVA } from '../../constants/diseno'
import { useTema, useTemaStore } from '../../store/temaStore'
import { haptica } from '../../utils/haptica'
import { Icono, NombreIcono } from '../../components/ui/Icono'

// Ícono de pestaña: al activarse, una pastilla verde crece detrás, el ícono pasa de la
// versión de contorno a la rellena y sube un poco de tamaño (resorte firme, sin rebote).
function TabIcon({ icono, focused, color }: { icono: NombreIcono; focused: boolean; color: string }) {
  const oscuro = useTemaStore(s => s.oscuro)
  const activo = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    activo.value = focused
      ? withSpring(1, RESORTE.natural)
      : withTiming(0, { duration: DURACION.rapida, easing: CURVA.salida })
  }, [focused])

  const pastilla = useAnimatedStyle(() => ({
    opacity: activo.value,
    transform: [{ scaleX: 0.6 + activo.value * 0.4 }, { scaleY: 0.8 + activo.value * 0.2 }],
  }))
  const escala = useAnimatedStyle(() => ({ transform: [{ scale: 1 + activo.value * 0.08 }] }))

  // "home" → "home-outline" en reposo, "home" relleno cuando está activa
  const nombre = (focused ? icono : `${icono}-outline`) as NombreIcono

  return (
    <View style={styles.iconWrap}>
      <Animated.View style={[styles.pastilla, { backgroundColor: oscuro ? 'rgba(61,214,140,.18)' : Colors.greenLight }, pastilla]} />
      <Animated.View style={escala}>
        <Icono nombre={nombre} tamano={22} color={color} />
      </Animated.View>
    </View>
  )
}

const PESTANAS: { name: string; title: string; label: string; icono: NombreIcono }[] = [
  { name: 'index',   title: 'Inicio',  label: 'Inicio',              icono: 'home' },
  { name: 'buscar',  title: 'Buscar',  label: 'Buscar servicios',    icono: 'search' },
  { name: 'pedidos', title: 'Pedidos', label: 'Mis pedidos',         icono: 'receipt' },
  { name: 'mapa',    title: 'Mapa',    label: 'Mapa de proveedores', icono: 'map' },
  { name: 'perfil',  title: 'Perfil',  label: 'Mi perfil',           icono: 'person' },
]

export default function TabsLayout() {
  const tema = useTema()
  const insets = useSafeAreaInsets()
  const ALTO_BARRA = 60

  return (
    <Tabs
      screenListeners={{ tabPress: () => haptica.seleccion() }}
      screenOptions={{
        headerShown: false,
        // Las pestañas son pares, no una jerarquía: se cambian sin deslizar (se usan
        // decenas de veces por sesión y el desplazamiento sugiere una profundidad que no hay)
        animation: 'none',
        tabBarStyle: {
          backgroundColor: tema.card,
          borderTopColor: tema.border,
          // respeta la barra de gestos / home indicator del teléfono
          height: ALTO_BARRA + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: tema.subTexto,
        tabBarLabelStyle: { fontSize: 10, fontFamily: F.semibold, letterSpacing: 0.3, marginTop: 2 },
      }}
    >
      {PESTANAS.map(p => (
        <Tabs.Screen
          key={p.name}
          name={p.name}
          options={{
            title: p.title,
            tabBarAccessibilityLabel: p.label,
            tabBarIcon: ({ focused, color }) => <TabIcon icono={p.icono} focused={focused} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
  pastilla: { ...StyleSheet.absoluteFill, borderRadius: 15 },
})
