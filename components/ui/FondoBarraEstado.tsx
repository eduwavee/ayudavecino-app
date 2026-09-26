import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

// Luminancia aproximada de un color #rgb / #rrggbb (0 = negro, 1 = blanco)
function esClaro(color: string) {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex.slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return false
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

// La app dibuja a pantalla completa (edge-to-edge), así que la barra de estado es
// transparente: al scrollear, el contenido pasaba por debajo de la hora y los íconos
// del sistema. Este fondo fijo tapa esa franja con el color de la parte de arriba de
// la pantalla y, mientras la pantalla está enfocada, pone los íconos del sistema en
// oscuro o en claro según ese color. El <StatusBar> se monta solo con la pantalla
// enfocada: React Native aplica siempre el último montado, así que al volver atrás
// se restaura solo el de la pantalla anterior. Va como último hijo del contenedor raíz.
export function FondoBarraEstado({ color }: { color: string }) {
  const { top } = useSafeAreaInsets()
  const [enfocada, setEnfocada] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setEnfocada(true)
      return () => setEnfocada(false)
    }, [])
  )

  return (
    <>
      {enfocada && <StatusBar style={esClaro(color) ? 'dark' : 'light'} />}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top, backgroundColor: color, zIndex: 10 }}
      />
    </>
  )
}
