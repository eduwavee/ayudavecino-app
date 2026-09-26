import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '../../store/authStore'
import { useTema } from '../../store/temaStore'

// Todo el panel es solo para proveedores: un cliente podía llegar por un link o una
// notificación y ver acciones de proveedor ("Marcar en curso") sobre sus propios pedidos.
export default function PanelProveedorLayout() {
  const usuario = useAuthStore(s => s.usuario)
  const tema = useTema()

  if (usuario && usuario.rol !== 'PROVEEDOR') return <Redirect href="/(tabs)" />

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        contentStyle: { backgroundColor: tema.bg },
      }}
    >
      {/* El éxito de publicar sube desde abajo, como un momento aparte */}
      <Stack.Screen name="servicio-publicado" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
    </Stack>
  )
}
