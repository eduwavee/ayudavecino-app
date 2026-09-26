import type { ComponentProps } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

// Íconos de la app: una sola familia (Ionicons), trazo uniforme. Por convención se usa
// la variante "-outline" en reposo y la rellena para lo activo o seleccionado.
// Son decorativos para el lector de pantalla: el texto o el accessibilityLabel del
// tocable que los contiene es el que describe la acción.
export type NombreIcono = ComponentProps<typeof Ionicons>['name']

export function Icono({
  nombre,
  tamano = 20,
  color,
  style,
}: {
  nombre: NombreIcono
  tamano?: number
  color: string
  style?: StyleProp<TextStyle>
}) {
  return (
    <Ionicons
      name={nombre}
      size={tamano}
      color={color}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}

// Fuente de los íconos, para precargarla junto con Poppins (así no aparecen en blanco
// el primer frame)
export const FUENTE_ICONOS = Ionicons.font
