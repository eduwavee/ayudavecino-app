import * as Haptics from 'expo-haptics'
import { Alert } from 'react-native'

// Vibraciones cortas para confirmar acciones. Nunca tiran: si el dispositivo no
// tiene motor háptico (o está desactivado) simplemente no pasa nada.
export const haptica = {
  // toque liviano: tabs, chips, selección
  seleccion: () => { Haptics.selectionAsync().catch(() => {}) },
  // botón principal presionado
  toque:     () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}) },
  // algo salió bien: pago, pedido enviado, reseña publicada
  exito:     () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}) },
  // error de validación o acción rechazada
  error:     () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}) },
}

// Alerta de error con vibración de error (validaciones y acciones rechazadas)
export function alertaError(mensaje: string) {
  haptica.error()
  Alert.alert('Error', mensaje)
}
