import { useEffect, useRef, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { notificacionesService } from '../services/notificaciones.service'
import { authService } from '../services/auth.service'
import { usuariosService } from '../services/usuarios.service'
import { useAuthStore } from '../store/authStore'
import { useNotifStore } from '../store/notificacionesStore'
import { useTema, useTemaStore } from '../store/temaStore'
import { Colors } from '../constants/colors'
import { ONBOARDING_KEY } from '../constants/config'

export default function RootLayout() {
  const router = useRouter()
  const agregarNotif = useNotifStore(s => s.agregarNotif)
  const setUsuario    = useAuthStore(s => s.setUsuario)
  const tema = useTema()
  const oscuro = useTemaStore(s => s.oscuro)
  const [listo, setListo] = useState(false)
  const [necesitaOnboarding, setNecesitaOnboarding] = useState(false)
  const redirigidoOnboarding = useRef(false)

  useEffect(() => {
    inicializar()
    inicializarNotificaciones()
  }, [])

  async function inicializar() {
    await restaurarSesion()

    let visto = true
    try {
      visto = !!(await AsyncStorage.getItem(ONBOARDING_KEY))
    } catch {
      // Si falla la lectura, no bloqueamos el arranque de la app
    }
    setNecesitaOnboarding(!visto)
    setListo(true)
  }

  // Al abrir la app en frío, el store de auth arranca vacío (es solo en memoria).
  // El token sigue en AsyncStorage, así que lo usamos para recuperar el usuario logueado.
  async function restaurarSesion() {
    try {
      const token = await authService.getToken()
      if (!token) return
      const payload = authService.decodificarToken(token)
      if (!payload?.id) return
      const perfil = await usuariosService.obtenerPerfil(payload.id)
      setUsuario(perfil, token)
    } catch {
      // Token vencido/inválido o backend no disponible: se resuelve al loguear de nuevo
    }
  }

  async function inicializarNotificaciones() {
    const pushToken = await notificacionesService.registrarDispositivo()
    if (pushToken) {
      await notificacionesService.enviarTokenAlBackend(pushToken)
    }

    notificacionesService.agregarListeners(
      (notif) => {
        agregarNotif({
          titulo: notif.request.content.title ?? 'AyudaVecino',
          cuerpo: notif.request.content.body  ?? '',
          tipo:   notif.request.content.data?.tipo ?? 'sistema',
          datos:  notif.request.content.data,
        })
      },
      (response) => {
        console.log('Notificación tocada:', response.notification.request.content.data)
      }
    )
  }

  // Recién una vez que el Stack ya está montado disparamos la redirección al onboarding,
  // una sola vez (nunca antes de que el navegador raíz esté listo).
  useEffect(() => {
    if (listo && necesitaOnboarding && !redirigidoOnboarding.current) {
      redirigidoOnboarding.current = true
      router.replace('/onboarding')
    }
  }, [listo, necesitaOnboarding])

  if (!listo) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:tema.bg }}>
        <StatusBar style={oscuro ? 'light' : 'dark'} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={oscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </>
  )
}
