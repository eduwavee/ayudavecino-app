import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { notificacionesService } from '../services/notificaciones.service'
import { useNotifStore } from '../store/notificacionesStore'

export default function RootLayout() {
  const agregarNotif = useNotifStore(s => s.agregarNotif)

  useEffect(() => {
    inicializarNotificaciones()
  }, [])

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

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
