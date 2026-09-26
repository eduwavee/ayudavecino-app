import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
  Animated, ScrollView, KeyboardAvoidingView
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/colors'
import { API_URL } from '../../constants/config'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FUENTES as F } from '../../constants/diseno'
import { haptica } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import { useReducedMotion } from 'react-native-reanimated'
import { useTema, TemaTokens } from '../../store/temaStore'

const TAGS: { icono: NombreIcono; texto: string }[] = [
  { icono: 'time-outline',       texto: 'Puntual' },
  { icono: 'sparkles-outline',   texto: 'Prolijo' },
  { icono: 'pricetag-outline',   texto: 'Precio justo' },
  { icono: 'flash-outline',      texto: 'Rápido' },
  { icono: 'happy-outline',      texto: 'Buen trato' },
  { icono: 'ribbon-outline',     texto: 'Muy profesional' },
]

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
const COLOR_ESTRELLA = '#F5B301'

export default function NuevaResenaScreen() {
  const router = useRouter()
  const tema   = useTema()
  const styles = getStyles(tema)
  const { pedidoId, proveedorNombre, proveedorAvatar, servicioNombre } = useLocalSearchParams<any>()

  const [puntaje, setPuntaje]       = useState(0)
  const [comentario, setComentario] = useState('')
  const [tagsSelected, setTagsSelected] = useState<string[]>([])
  const [loading, setLoading]       = useState(false)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const scaleAnims = [1,2,3,4,5].map(() => useRef(new Animated.Value(1)).current)
  const reducido = useReducedMotion()

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start()
  }, [])

  function seleccionarEstrella(n: number) {
    haptica.seleccion()
    setPuntaje(n)
    if (reducido) return
    Animated.sequence([
      Animated.timing(scaleAnims[n-1], { toValue:1.25, duration:120, useNativeDriver:true }),
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

      haptica.exito()
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
          <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
        </PressScale>
        <Text style={styles.title}>Calificar servicio</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Proveedor */}
        <View style={styles.provCard}>
          <View style={styles.provAvatar}>
            <FotoPerfil ruta={proveedorAvatar || null} nombre={proveedorNombre} radio={16} estiloTexto={styles.provAvatarText} />
          </View>
          <View style={styles.provInfo}>
            <Text style={styles.provNombre}>{proveedorNombre}</Text>
            <Text style={styles.provServicio}>{servicioNombre}</Text>
          </View>
          <Icono nombre="construct-outline" tamano={22} color={Colors.primary} />
        </View>

        {/* Estrellas */}
        <View style={styles.starsSection}>
          <Text style={styles.starsTitle}>¿Cómo fue tu experiencia?</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => seleccionarEstrella(n)}
                activeOpacity={.7}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                accessibilityState={{ selected: n === puntaje }}
              >
                <Animated.View style={{ transform:[{ scale: scaleAnims[n-1] }] }}>
                  <Icono
                    nombre={n <= puntaje ? 'star' : 'star-outline'}
                    tamano={40}
                    color={n <= puntaje ? COLOR_ESTRELLA : '#9A9A9A'}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
          {/* Siempre ocupa su lugar: si aparecía recién al elegir, empujaba las etiquetas
              de abajo y el siguiente toque caía en otra */}
          <Text style={[styles.starLabel, puntaje === 0 && styles.starLabelVacio]}>
            {puntaje > 0 ? LABELS[puntaje] : 'Tocá una estrella'}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>¿Qué destacás? (opcional)</Text>
          <View style={styles.tagsWrap}>
            {TAGS.map(({ icono, texto }) => {
              const activo = tagsSelected.includes(texto)
              return (
                <TouchableOpacity
                  key={texto}
                  style={[styles.tagBtn, activo && styles.tagBtnActive]}
                  onPress={() => toggleTag(texto)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                >
                  <Icono nombre={activo ? 'checkmark' : icono} tamano={14} color={activo ? Colors.primary : tema.subTexto} />
                  <Text style={[styles.tagText, activo && styles.tagTextActive]}>{texto}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Comentario */}
        <View style={styles.comentarioSection}>
          <Text style={styles.comentarioTitle}>Tu comentario</Text>
          <TextInput
            style={styles.comentarioInput}
            placeholder="Contá tu experiencia... ¿qué fue lo que más te gustó?"
            placeholderTextColor={tema.subTexto}
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
        <PressScale haptico
          style={[styles.enviarBtn, (puntaje === 0 || loading) && styles.enviarBtnDisabled]}
          onPress={enviarResena}
          disabled={puntaje === 0 || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.enviarBtnText}>Publicar reseña</Text>
          }
        </PressScale>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
    <FondoBarraEstado color={tema.bg} />
    </KeyboardAvoidingView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:         { flex:1, backgroundColor:tema.bg },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:20 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:tema.overlay, alignItems:'center', justifyContent:'center' },
  title:             { fontSize:20, fontFamily: F.extrabold, color:tema.texto },
  content:           { paddingHorizontal:22 },
  provCard:          { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:tema.card, borderRadius:18, padding:16, marginBottom:24, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  provAvatar:        { width:50, height:50, borderRadius:16, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  provAvatarText:    { color:'white', fontSize:20, fontFamily: F.extrabold },
  provInfo:          { flex:1 },
  provNombre:        { fontSize:16, fontFamily: F.extrabold, color:tema.texto, marginBottom:3 },
  provServicio:      { fontFamily: F.regular, fontSize:12, color:tema.subTexto },
  starsSection:      { backgroundColor:tema.card, borderRadius:18, padding:20, marginBottom:16, alignItems:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  starsTitle:        { fontSize:15, fontFamily: F.bold, color:tema.texto, marginBottom:16 },
  starsRow:          { flexDirection:'row', gap:8, marginBottom:10 },
  starLabel:         { fontSize:16, fontFamily: F.extrabold, color:tema.texto, marginTop:4 },
  starLabelVacio:    { fontFamily: F.medium, color:tema.subTexto },
  tagsSection:       { backgroundColor:tema.card, borderRadius:18, padding:16, marginBottom:16, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  tagsTitle:         { fontSize:13, fontFamily: F.bold, color:tema.texto, marginBottom:12 },
  tagsWrap:          { flexDirection:'row', flexWrap:'wrap', gap:8 },
  tagBtn:            { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:tema.bg, borderWidth:1.5, borderColor:tema.border },
  tagBtnActive:      { backgroundColor:tema.esOscuro ? 'rgba(26,158,92,.15)' : '#F0FDF4', borderColor:Colors.primary },
  tagText:           { fontSize:12, fontFamily: F.semibold, color:tema.subTexto },
  tagTextActive:     { color:Colors.primary },
  comentarioSection: { backgroundColor:tema.card, borderRadius:18, padding:16, marginBottom:24, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  comentarioTitle:   { fontSize:13, fontFamily: F.bold, color:tema.texto, marginBottom:10 },
  comentarioInput:   { fontFamily: F.regular, backgroundColor:tema.bg, borderRadius:14, padding:14, fontSize:13, color:tema.texto, minHeight:100, borderWidth:1.5, borderColor:tema.border },
  charCount:         { fontFamily: F.regular, textAlign:'right', fontSize:10, color:tema.subTexto, marginTop:6 },
  enviarBtn:         { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.3, shadowRadius:10, elevation:5 },
  enviarBtnDisabled: { backgroundColor:tema.esOscuro ? '#333333' : '#cccccc', shadowOpacity:0, elevation:0 },
  enviarBtnText:     { color:'white', fontSize:15, fontFamily: F.extrabold },
})
