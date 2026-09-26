import * as Device from 'expo-device'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

type ModuloNotificaciones = typeof import('expo-notifications')

// Desde el SDK 53, Expo Go para Android lanza un error apenas se importa
// expo-notifications. Lo cargamos solo donde funciona (development build, build
// de release o iOS) para que la app no se caiga al abrirla en Expo Go.
const enExpoGoAndroid =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

let Notifications: ModuloNotificaciones | null = null
if (!enExpoGoAndroid) {
  try {
    Notifications = require('expo-notifications') as ModuloNotificaciones
  } catch {
    Notifications = null
  }
}

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
})

export const notificacionesService = {

  async registrarDispositivo() {
    if (!Notifications) {
      console.log('Notificaciones no disponibles en Expo Go para Android; usá un development build')
      return null
    }
    if (!Device.isDevice) {
      console.log('Solo funciona en dispositivo real')
      return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Permisos denegados')
      return null
    }

    // Sin projectId — solo notificaciones locales por ahora
    console.log('Permisos de notificación concedidos')

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AyudaVecino',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A9E5C',
        sound: 'default',
      })
    }

    return 'local-only'
  },

  async enviarTokenAlBackend(token: string) {
    // Solo para notificaciones remotas, lo dejamos para el deploy
    console.log('Token:', token)
  },

  async mostrarLocal(titulo: string, cuerpo: string, datos?: any) {
    if (!Notifications) return
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body:  cuerpo,
        data:  datos ?? {},
        sound: 'default',
      },
      trigger: null,
    })
  },

  agregarListeners(
    onRecibida: (notif: any) => void,
    onTocada:   (response: any) => void
  ) {
    if (!Notifications) return () => {}
    const sub1 = Notifications.addNotificationReceivedListener(onRecibida)
    const sub2 = Notifications.addNotificationResponseReceivedListener(onTocada)
    return () => { sub1.remove(); sub2.remove() }
  },

  async limpiarBadge() {
    if (!Notifications) return
    await Notifications.setBadgeCountAsync(0)
  },
}
