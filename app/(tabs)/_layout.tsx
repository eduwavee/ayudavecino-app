import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { FUENTES as F, RESORTE, DURACION, CURVA } from '../../constants/diseno'
import { useTema, useTemaStore } from '../../store/temaStore'
import { haptica } from '../../utils/haptica'

// Ícono de pestaña: al activarse, una pastilla verde crece detrás y el emoji sube un
// poco de tamaño (resorte firme, sin rebote). Inactivo queda atenuado pero legible.
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
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
  const icono = useAnimatedStyle(() => ({
    opacity: 0.5 + activo.value * 0.5,
    transform: [{ scale: 1 + activo.value * 0.12 }],
  }))

  return (
    <View style={styles.iconWrap}>
      <Animated.View style={[styles.pastilla, { backgroundColor: oscuro ? 'rgba(61,214,140,.18)' : Colors.greenLight }, pastilla]} />
      <Animated.Text style={[styles.emoji, icono]}>{emoji}</Animated.Text>
    </View>
  )
}

export default function TabsLayout() {
  const tema = useTema()
  const insets = useSafeAreaInsets()
  const ALTO_BARRA = 60

  return (
    <Tabs
      screenListeners={{ tabPress: () => haptica.seleccion() }}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
          tabBarAccessibilityLabel: 'Buscar servicios',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarAccessibilityLabel: 'Mis pedidos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Mapa de proveedores',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Mi perfil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
  pastilla: { ...StyleSheet.absoluteFill, borderRadius: 15 },
  emoji:    { fontFamily: F.regular, fontSize: 19 },
})
