import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
  Animated, ScrollView
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://192.168.1.37:3000/api'

const TAGS = [
  '✓ Puntual', '✓ Prolijo', '💰 Precio justo',
  '⚡ Rápido', '💬 Buen trato', '🔧 Muy profesional',
]

const LABELS = ['', 'Muy malo 😞', 'Malo 😕', 'Regular 😐', 'Bueno 😊', 'Excelente 🤩']

export default function NuevaResenaScreen() {
  const router = useRouter()
  const { pedidoId, proveedorNombre, servicioNombre } = useLocalSearchParams<any>()

  const [puntaje, setPuntaje]       = useState(0)
  const [comentario, setComentario] = useState('')
  const [tagsSelected, setTagsSelected] = useState<string[]>([])
  const [loading, setLoading]       = useState(false)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const scaleAnims = [1,2,3,4,5].map(() => useRef(new Animated.Value(1)).current)

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start()
  }, [])

  function seleccionarEstrella(n: number) {
    setPuntaje(n)
    Animated.sequence([
      Animated.timing(scaleAnims[n-1], { toValue:1.4, duration:150, useNativeDriver:true }),
      Animated.spring(scaleAnims[n-1], { toValue:1, tension:60, friction:5, useNativeDriver:true }),
    ]).start()
  }

  function toggleTag(tag: string) {
    setTagsSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function enviarResena() {
    if (puntaje === 0) return Alert.alert('Error', 'Seleccioná una calificación')
    if (comentario.length < 10) return Alert.alert('Error', 'Escribí al menos 10 caracteres')

    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const textoFinal = tagsSelected.length > 0
        ? `${tagsSelected.join(', ')}. ${comentario}`
        : comentario

      await axios.post(`${API_URL}/resenas`, {
        pedidoId,
        puntaje,
        comentario: textoFinal,
      }, { headers: { Authorization: `Bearer ${token}` } })

      router.replace({
        pathname: '/resena/exito',
        params: { puntaje, proveedorNombre }
      })
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo enviar la reseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Calificar servicio</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Proveedor */}
        <View style={styles.provCard}>
          <View style={styles.provAvatar}>
            <Text style={styles.provAvatarText}>
              {proveedorNombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.provInfo}>
            <Text style={styles.provNombre}>{proveedorNombre}</Text>
            <Text style={styles.provServicio}>{servicioNombre}</Text>
          </View>
          <Text style={styles.provIco}>🔧</Text>
        </View>

        {/* Estrellas */}
        <View style={styles.starsSection}>
          <Text style={styles.starsTitle}>¿Cómo fue tu experiencia?</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => seleccionarEstrella(n)} activeOpacity={.7}>
                <Animated.Text style={[
                  styles.star,
                  { transform:[{ scale: scaleAnims[n-1] }] },
                  n <= puntaje && styles.starActive
                ]}>
                  ⭐
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </View>
          {puntaje > 0 && (
            <Text style={styles.starLabel}>{LABELS[puntaje]}</Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>¿Qué destacás? (opcional)</Text>
          <View style={styles.tagsWrap}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagBtn, tagsSelected.includes(tag) && styles.tagBtnActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, tagsSelected.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comentario */}
        <View style={styles.comentarioSection}>
          <Text style={styles.comentarioTitle}>Tu comentario</Text>
          <TextInput
            style={styles.comentarioInput}
            placeholder="Contá tu experiencia... ¿qué fue lo que más te gustó?"
            placeholderTextColor="#bbb"
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.charCount}>{comentario.length}/300</Text>
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.enviarBtn, (puntaje === 0 || loading) && styles.enviarBtnDisabled]}
          onPress={enviarResena}
          disabled={puntaje === 0 || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.enviarBtnText}>Publicar reseña ⭐</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.cream },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:20 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:          { fontSize:16, color:Colors.dark },
  title:             { fontSize:20, fontWeight:'900', color:Colors.dark },
  content:           { paddingHorizontal:22 },
  provCard:          { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'white', borderRadius:18, padding:16, marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  provAvatar:        { width:50, height:50, borderRadius:16, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  provAvatarText:    { color:'white', fontSize:20, fontWeight:'900' },
  provInfo:          { flex:1 },
  provNombre:        { fontSize:16, fontWeight:'800', color:Colors.dark, marginBottom:3 },
  provServicio:      { fontSize:12, color:Colors.gray },
  provIco:           { fontSize:24 },
  starsSection:      { backgroundColor:'white', borderRadius:18, padding:20, marginBottom:16, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  starsTitle:        { fontSize:15, fontWeight:'700', color:Colors.dark, marginBottom:16 },
  starsRow:          { flexDirection:'row', gap:8, marginBottom:10 },
  star:              { fontSize:40, opacity:.3 },
  starActive:        { opacity:1 },
  starLabel:         { fontSize:16, fontWeight:'900', color:Colors.dark, marginTop:4 },
  tagsSection:       { backgroundColor:'white', borderRadius:18, padding:16, marginBottom:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  tagsTitle:         { fontSize:13, fontWeight:'700', color:Colors.dark, marginBottom:12 },
  tagsWrap:          { flexDirection:'row', flexWrap:'wrap', gap:8 },
  tagBtn:            { paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:Colors.cream, borderWidth:1.5, borderColor:'#eee' },
  tagBtnActive:      { backgroundColor:'#F0FDF4', borderColor:Colors.primary },
  tagText:           { fontSize:12, fontWeight:'600', color:'#555' },
  tagTextActive:     { color:Colors.primary },
  comentarioSection: { backgroundColor:'white', borderRadius:18, padding:16, marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  comentarioTitle:   { fontSize:13, fontWeight:'700', color:Colors.dark, marginBottom:10 },
  comentarioInput:   { backgroundColor:Colors.cream, borderRadius:14, padding:14, fontSize:13, color:Colors.dark, minHeight:100, borderWidth:1.5, borderColor:'#eee' },
  charCount:         { textAlign:'right', fontSize:10, color:'#bbb', marginTop:6 },
  enviarBtn:         { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.3, shadowRadius:10, elevation:5 },
  enviarBtnDisabled: { backgroundColor:'#ccc', shadowOpacity:0, elevation:0 },
  enviarBtnText:     { color:'white', fontSize:15, fontWeight:'800' },
})
