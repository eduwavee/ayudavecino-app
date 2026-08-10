import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { API_URL } from '../constants/config'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
})

export const notificacionesService = {

  async registrarDispositivo() {
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
    console.log('✅ Permisos de notificación concedidos')

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
    const sub1 = Notifications.addNotificationReceivedListener(onRecibida)
    const sub2 = Notifications.addNotificationResponseReceivedListener(onTocada)
    return () => { sub1.remove(); sub2.remove() }
  },

  async limpiarBadge() {
    await Notifications.setBadgeCountAsync(0)
  },
}
