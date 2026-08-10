import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import { serviciosService } from '../../services/servicios.service'

const CATEGORIAS = [
  { value:'plomeria',      label:'🔧 Plomería' },
  { value:'electricidad',  label:'⚡ Electricidad' },
  { value:'albanileria',   label:'🏗️ Albañilería' },
  { value:'carpinteria',   label:'🪟 Carpintería' },
  { value:'jardin',        label:'🌿 Jardín' },
  { value:'limpieza',      label:'🧹 Limpieza' },
  { value:'pintura',       label:'🎨 Pintura' },
]

export default function NuevoServicioScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<any>()
  const esEdicion = !!params.id

  const [nombre, setNombre]           = useState(params.nombre ?? '')
  const [descripcion, setDescripcion] = useState(params.descripcion ?? '')
  const [precio, setPrecio]           = useState(params.precio ?? '')
  const [categoria, setCategoria]     = useState(params.categoria ?? '')
  const [loading, setLoading]         = useState(false)
  const [focused, setFocused]         = useState<string|null>(null)

  async function handleGuardar() {
    if (!nombre.trim()) return Alert.alert('Error', 'El nombre es requerido')
    if (!descripcion.trim()) return Alert.alert('Error', 'La descripción es requerida')
    if (!precio || isNaN(Number(precio))) return Alert.alert('Error', 'El precio debe ser un número')
    if (!categoria) return Alert.alert('Error', 'Seleccioná una categoría')

    setLoading(true)
    try {
      await serviciosService.crearServicio({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: Number(precio),
        categoria,
      })
      router.replace({
  pathname: '/proveedor-panel/servicio-publicado',
  params: { nombre: nombre.trim(), precio, categoria }
})
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo guardar el servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{esEdicion ? 'Editar servicio' : 'Nuevo servicio'}</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>

          <Text style={styles.label}>NOMBRE DEL SERVICIO</Text>
          <View style={[styles.inputWrap, focused === 'nombre' && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              placeholder="ej: Reparación de caños"
              placeholderTextColor="#bbb"
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
              placeholderTextColor="#bbb"
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
              placeholderTextColor="#bbb"
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

          {/* Preview */}
          {nombre && precio && categoria && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Vista previa</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewLeft}>
                  <View style={styles.previewIco}>
                    <Text style={{fontSize:22}}>{CATEGORIAS.find(c => c.value === categoria)?.label.split(' ')[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.previewNombre}>{nombre}</Text>
                    <Text style={styles.previewCat}>{categoria}</Text>
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
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.cream },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:20 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:          { fontSize:16, color:Colors.dark },
  title:             { fontSize:22, fontWeight:'900', color:Colors.dark },
  form:              { paddingHorizontal:22 },
  label:             { fontSize:11, fontWeight:'700', color:'#999', letterSpacing:1.5, marginBottom:10 },
  inputWrap:         { backgroundColor:'white', borderRadius:16, paddingHorizontal:16, marginBottom:20, borderWidth:1.5, borderColor:'transparent', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:6, elevation:2 },
  inputFocused:      { borderColor:Colors.primary },
  textareaWrap:      { paddingVertical:4 },
  input:             { fontSize:14, color:Colors.dark, paddingVertical:14 },
  textarea:          { minHeight:100 },
  pesoSign:          { position:'absolute', left:16, top:14, fontSize:16, color:Colors.dark, fontWeight:'700' },
  catsGrid:          { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:24 },
  catBtn:            { paddingHorizontal:16, paddingVertical:10, borderRadius:100, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  catBtnActive:      { backgroundColor:Colors.dark, borderColor:Colors.dark },
  catBtnText:        { fontSize:13, fontWeight:'600', color:'#555' },
  catBtnTextActive:  { color:'white' },
  preview:           { marginBottom:20 },
  previewTitle:      { fontSize:11, fontWeight:'700', color:'#999', letterSpacing:1.5, marginBottom:10 },
  previewCard:       { backgroundColor:'white', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1.5, borderColor:Colors.primary },
  previewLeft:       { flexDirection:'row', alignItems:'center', gap:12 },
  previewIco:        { width:44, height:44, borderRadius:12, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  previewNombre:     { fontSize:14, fontWeight:'700', color:Colors.dark },
  previewCat:        { fontSize:11, color:Colors.gray },
  previewPrecio:     { fontSize:18, fontWeight:'900', color:Colors.dark },
  bottomBar:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.cream, padding:16, paddingBottom:32 },
  guardarBtn:        { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.3, shadowRadius:10, elevation:5 },
  guardarBtnText:    { color:'white', fontSize:15, fontWeight:'700' },
})
