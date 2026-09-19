import * as Haptics from 'expo-haptics'

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
