// Arma el FormData para subir una imagen elegida con expo-image-picker (avatar, fotos
// de chat, etc). La extensión se saca del nombre de archivo cuando hay una; si el
// último segmento de la uri no tiene punto (pasa con algunas content:// de Android),
// usamos jpg por default en vez de mandar un content-type inventado como "image/1234".
export function armarFormDataImagen(campo: string, imagenUri: string): FormData {
  const nombreArchivo = imagenUri.split('/').pop() ?? 'foto.jpg'
  const tieneExtension = nombreArchivo.includes('.')
  const extension = (tieneExtension ? nombreArchivo.split('.').pop()! : 'jpg').toLowerCase()
  const tipo = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`

  const formData = new FormData()
  formData.append(campo, {
    uri: imagenUri,
    name: tieneExtension ? nombreArchivo : `foto.${extension}`,
    type: tipo,
  } as any)
  return formData
}
