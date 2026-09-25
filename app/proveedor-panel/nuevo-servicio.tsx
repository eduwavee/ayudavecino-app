import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import { CATEGORIAS as CATEGORIAS_SERVICIO, categoriaInfo } from '../../constants/categorias'
import { serviciosService } from '../../services/servicios.service'
import { archivoUrl } from '../../constants/config'
import { FUENTES as F } from '../../constants/diseno'
import { alertaError } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'
import { usePlan } from '../../hooks/usePlan'

const MAX_FOTOS = 6

const CATEGORIAS = CATEGORIAS_SERVICIO.map(c => ({ value: c.value, label: `${c.ico} ${c.nombre}` }))

export default function NuevoServicioScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<any>()
  const esEdicion = !!params.id
  const { pedirMejora } = usePlan()

  const [nombre, setNombre]           = useState(params.nombre ?? '')
  const [descripcion, setDescripcion] = useState(params.descripcion ?? '')
  const [precio, setPrecio]           = useState(params.precio ?? '')
  const [categoria, setCategoria]     = useState(params.categoria ?? '')
  const [loading, setLoading]         = useState(false)
  const [focused, setFocused]         = useState<string|null>(null)
  // Edicion: fotos ya guardadas en el backend. Alta: fotos elegidas que se suben al publicar.
  const [fotosGuardadas, setFotosGuardadas]   = useState<string[]>([])
  const [fotosPendientes, setFotosPendientes] = useState<string[]>([])
  const [subiendoFoto, setSubiendoFoto]       = useState(false)

  useEffect(() => {
    if (esEdicion) {
      serviciosService.obtenerServicio(params.id).then(s => setFotosGuardadas(s.fotos ?? [])).catch(() => {})
    }
  }, [])

  const cantidadFotos = fotosGuardadas.length + fotosPendientes.length

  async function agregarFoto() {
    if (cantidadFotos >= MAX_FOTOS) return Alert.alert('Límite de fotos', `Podés subir hasta ${MAX_FOTOS} fotos por servicio`)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Activá el permiso de galería para elegir fotos')

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })
    if (resultado.canceled || !resultado.assets?.[0]) return
    const uri = resultado.assets[0].uri

    if (!esEdicion) return setFotosPendientes(prev => [...prev, uri])

    setSubiendoFoto(true)
    try {
      setFotosGuardadas(await serviciosService.subirFoto(params.id, uri))
    } catch (err: any) {
      alertaError(err.response?.data?.mensaje || 'No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  function quitarFoto(indice: number, guardada: boolean) {
    if (!guardada) return setFotosPendientes(prev => prev.filter((_, i) => i !== indice))
    Alert.alert('¿Borrar esta foto?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        try {
          setFotosGuardadas(await serviciosService.eliminarFoto(params.id, indice))
        } catch (err: any) {
          alertaError(err.response?.data?.mensaje || 'No se pudo borrar la foto')
        }
      } },
    ])
  }

  async function handleGuardar() {
    if (!nombre.trim()) return alertaError('El nombre es requerido')
    if (!descripcion.trim()) return alertaError('La descripción es requerida')
    if (!precio || isNaN(Number(precio))) return alertaError('El precio debe ser un número')
    if (!categoria) return alertaError('Seleccioná una categoría')

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      categoria,
    }

    setLoading(true)
    try {
      if (esEdicion) {
        await serviciosService.editarServicio(params.id, datos)
        router.back()
        return
      }
      const creado = await serviciosService.crearServicio(datos)
      let fallidas = 0
      for (const uri of fotosPendientes) {
        try { await serviciosService.subirFoto(creado.id, uri) } catch { fallidas++ }
      }
      if (fallidas > 0) Alert.alert('Servicio publicado', `No se pudieron subir ${fallidas} foto(s). Podés agregarlas desde Editar.`)
      router.replace({
        pathname: '/proveedor-panel/servicio-publicado',
        params: { nombre: nombre.trim(), precio, categoria }
      })
    } catch (err: any) {
      // Llegó al límite de servicios de su plan: se le ofrece mejorar en vez de un error seco
      const data = err.response?.data
      if (data?.codigo === 'PLAN_REQUERIDO') pedirMejora(data.mensaje)
      else alertaError(data?.mensaje || 'No se pudo guardar el servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </PressScale>
          <Text style={styles.title}>{esEdicion ? 'Editar servicio' : 'Nuevo servicio'}</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>

          <Text style={styles.label}>NOMBRE DEL SERVICIO</Text>
          <View style={[styles.inputWrap, focused === 'nombre' && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              placeholder="ej: Reparación de caños"
              placeholderTextColor="#767676"
              value={nombre}
              onChangeText={setNombre}
              onFocus={() => setFocused('nombre')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Text style={styles.label}>DESCRIPCIÓN</Text>
          <View style={[styles.inputWrap, styles.textareaWrap, focused === 'desc' && styles.inputFocused]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describí qué incluye tu servicio..."
              placeholderTextColor="#767676"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setFocused('desc')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Text style={styles.label}>PRECIO BASE ($)</Text>
          <View style={[styles.inputWrap, focused === 'precio' && styles.inputFocused]}>
            <Text style={styles.pesoSign}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#767676"
              value={String(precio)}
              onChangeText={setPrecio}
              keyboardType="numeric"
              onFocus={() => setFocused('precio')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Text style={styles.label}>CATEGORÍA</Text>
          <View style={styles.catsGrid}>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catBtn, categoria === cat.value && styles.catBtnActive]}
                onPress={() => setCategoria(cat.value)}
              >
                <Text style={[styles.catBtnText, categoria === cat.value && styles.catBtnTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>FOTOS DE TRABAJOS ({cantidadFotos}/{MAX_FOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
            {fotosGuardadas.map((ruta, i) => (
              <TouchableOpacity key={ruta} onPress={() => quitarFoto(i, true)}>
                <Image source={{ uri: archivoUrl(ruta)! }} style={styles.foto} />
                <View style={styles.fotoQuitar}><Text style={styles.fotoQuitarText}>✕</Text></View>
              </TouchableOpacity>
            ))}
            {fotosPendientes.map((uri, i) => (
              <TouchableOpacity key={uri} onPress={() => quitarFoto(i, false)}>
                <Image source={{ uri }} style={styles.foto} />
                <View style={styles.fotoQuitar}><Text style={styles.fotoQuitarText}>✕</Text></View>
              </TouchableOpacity>
            ))}
            {cantidadFotos < MAX_FOTOS && (
              <TouchableOpacity style={styles.fotoAgregar} onPress={agregarFoto} disabled={subiendoFoto}>
                {subiendoFoto
                  ? <ActivityIndicator color={Colors.primary} />
                  : <><Text style={styles.fotoAgregarIco}>📷</Text><Text style={styles.fotoAgregarText}>Agregar</Text></>}
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.fotosAyuda}>Mostrá trabajos que hiciste: ayuda a que te elijan.</Text>

          {/* Preview */}
          {nombre && precio && categoria && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Vista previa</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewLeft}>
                  <View style={styles.previewIco}>
                    <Text style={{ fontFamily: F.regular, fontSize:22}}>{categoriaInfo(categoria).ico}</Text>
                  </View>
                  <View>
                    <Text style={styles.previewNombre}>{nombre}</Text>
                    <Text style={styles.previewCat}>{categoriaInfo(categoria).nombre}</Text>
                  </View>
                </View>
                <Text style={styles.previewPrecio}>${Number(precio).toLocaleString()}</Text>
              </View>
            </View>
          )}

          <View style={{ height:120 }} />
        </View>
      </ScrollView>

      {/* Botón guardar */}
      <View style={styles.bottomBar}>
        <PressScale haptico
          style={[styles.guardarBtn, loading && { opacity:.7 }]}
          onPress={handleGuardar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.guardarBtnText}>
                {esEdicion ? '✓ Guardar cambios' : '🚀 Publicar servicio'}
              </Text>
          }
        </PressScale>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fotosRow:          { gap:10, paddingBottom:4 },
  foto:              { width:96, height:72, borderRadius:12, backgroundColor:'#eee' },
  fotoQuitar:        { position:'absolute', top:4, right:4, width:22, height:22, borderRadius:11, backgroundColor:'rgba(0,0,0,.6)', alignItems:'center', justifyContent:'center' },
  fotoQuitarText:    { color:'white', fontSize:11, fontFamily: F.extrabold },
  fotoAgregar:       { width:96, height:72, borderRadius:12, borderWidth:1.5, borderStyle:'dashed', borderColor:Colors.primary, alignItems:'center', justifyContent:'center', backgroundColor:'#F0FDF4' },
  fotoAgregarIco:    { fontFamily: F.regular, fontSize:20 },
  fotoAgregarText:   { fontSize:11, fontFamily: F.bold, color:Colors.primary, marginTop:2 },
  fotosAyuda:        { fontFamily: F.regular, fontSize:11, color:'#6B6B6B', marginTop:6, marginBottom:20 },
  container:         { flex:1, backgroundColor:Colors.cream },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:20 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:          { fontFamily: F.regular, fontSize:16, color:Colors.dark },
  title:             { fontSize:22, fontFamily: F.extrabold, color:Colors.dark },
  form:              { paddingHorizontal:22 },
  label:             { fontSize:11, fontFamily: F.bold, color:'#6B6B6B', letterSpacing:1.5, marginBottom:10 },
  inputWrap:         { backgroundColor:'white', borderRadius:16, paddingHorizontal:16, marginBottom:20, borderWidth:1.5, borderColor:'transparent', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  inputFocused:      { borderColor:Colors.primary },
  textareaWrap:      { paddingVertical:4 },
  input:             { fontFamily: F.regular, fontSize:14, color:Colors.dark, paddingVertical:14 },
  textarea:          { minHeight:100 },
  pesoSign:          { position:'absolute', left:16, top:14, fontSize:16, color:Colors.dark, fontFamily: F.bold },
  catsGrid:          { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:24 },
  catBtn:            { paddingHorizontal:16, paddingVertical:10, borderRadius:100, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  catBtnActive:      { backgroundColor:Colors.dark, borderColor:Colors.dark },
  catBtnText:        { fontSize:13, fontFamily: F.semibold, color:'#555' },
  catBtnTextActive:  { color:'white' },
  preview:           { marginBottom:20 },
  previewTitle:      { fontSize:11, fontFamily: F.bold, color:'#6B6B6B', letterSpacing:1.5, marginBottom:10 },
  previewCard:       { backgroundColor:'white', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1.5, borderColor:Colors.primary },
  previewLeft:       { flexDirection:'row', alignItems:'center', gap:12 },
  previewIco:        { width:44, height:44, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  previewNombre:     { fontSize:14, fontFamily: F.bold, color:Colors.dark },
  previewCat:        { fontFamily: F.regular, fontSize:11, color:'#6B6B6B' },
  previewPrecio:     { fontSize:18, fontFamily: F.extrabold, color:Colors.dark },
  bottomBar:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.cream, padding:16, paddingBottom:32 },
  guardarBtn:        { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.3, shadowRadius:10, elevation:5 },
  guardarBtnText:    { color:'white', fontSize:15, fontFamily: F.bold },
})
