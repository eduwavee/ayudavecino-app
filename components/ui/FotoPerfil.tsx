import { Image, StyleSheet, Text, StyleProp, TextStyle } from 'react-native'
import { archivoUrl } from '../../constants/config'

// Contenido de un avatar: la foto de perfil si la persona subió una, o la inicial de
// su nombre si no. Va DENTRO del contenedor de cada pantalla (que define tamaño, color
// de fondo y los puntitos de "en línea"), así la foto aparece en todos lados y no
// solo en el perfil propio. `radio` tiene que ser el borderRadius del contenedor.
export function FotoPerfil({ ruta, nombre, radio, estiloTexto }: {
  ruta?: string | null
  nombre?: string | null
  radio: number
  estiloTexto?: StyleProp<TextStyle>
}) {
  const uri = archivoUrl(ruta)
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { borderRadius: radio }]}
        accessibilityIgnoresInvertColors
      />
    )
  }
  return <Text style={estiloTexto}>{nombre?.trim().charAt(0).toUpperCase() || '?'}</Text>
}
