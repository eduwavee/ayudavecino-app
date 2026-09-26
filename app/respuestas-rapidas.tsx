import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useAuthStore } from '../store/authStore'
import { useTema, TemaTokens } from '../store/temaStore'
import { usePlan } from '../hooks/usePlan'
import { FUENTES as F } from '../constants/diseno'
import { Icono } from '../components/ui/Icono'
import {
  leerRespuestas, guardarRespuestas, MAX_RESPUESTAS, MAX_LARGO_RESPUESTA,
} from '../utils/respuestasRapidas'

const SUGERENCIAS = [
  'Voy mañana a las 10, ¿te queda bien?',
  '¿Me mandás una foto del problema?',
  'Ya estoy en camino 🚗',
  'El presupuesto incluye materiales',
]

export default function RespuestasRapidasScreen() {
  const router = useRouter()
  const tema = useTema()
  const styles = getStyles(tema)
  const usuario = useAuthStore(s => s.usuario)
  const { esPremium } = usePlan()
  const [respuestas, setRespuestas] = useState<string[]>([])
  const [nueva, setNueva] = useState('')

  useEffect(() => {
    if (usuario?.id) leerRespuestas(usuario.id).then(setRespuestas)
  }, [usuario?.id])

  async function actualizar(lista: string[]) {
    setRespuestas(lista)
    if (usuario?.id) await guardarRespuestas(usuario.id, lista)
  }

  function agregar(texto: string) {
    const limpio = texto.trim()
    if (!limpio) return
    if (respuestas.includes(limpio)) return Alert.alert('Ya existe', 'Esa respuesta ya está en tu lista')
    if (respuestas.length >= MAX_RESPUESTAS) return Alert.alert('Límite alcanzado', `Podés guardar hasta ${MAX_RESPUESTAS} respuestas`)
    actualizar([...respuestas, limpio])
    setNueva('')
  }

  function quitar(texto: string) {
    actualizar(respuestas.filter(r => r !== texto))
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={[styles.header, { paddingTop: 56 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
        </TouchableOpacity>
        <Text style={styles.title}>Respuestas rápidas</Text>
      </View>

      {!esPremium ? (
        <View style={styles.bloqueado}>
          <View style={styles.bloqueadoIco}><Icono nombre="chatbubbles" tamano={34} color={Colors.primary} /></View>
          <Text style={styles.bloqueadoTitulo}>Contestá con un toque</Text>
          <Text style={styles.bloqueadoSub}>
            Guardá tus mensajes de siempre ("Voy mañana a las 10", "¿Me mandás una foto?") y mandalos desde el chat sin escribirlos.
          </Text>
          <TouchableOpacity style={styles.bloqueadoBtn} onPress={() => router.push('/planes')}>
            <Icono nombre="diamond" tamano={16} color={Colors.dark} />
            <Text style={styles.bloqueadoBtnText}>Disponible en Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <Text style={styles.ayuda}>
            Aparecen primero en la barra de respuestas de cada chat. Tocá una para mandarla.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribí una respuesta..."
              placeholderTextColor={tema.subTexto}
              value={nueva}
              onChangeText={setNueva}
              maxLength={MAX_LARGO_RESPUESTA}
              onSubmitEditing={() => agregar(nueva)}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addBtn, !nueva.trim() && { opacity: .4 }]}
              onPress={() => agregar(nueva)}
              disabled={!nueva.trim()}
              accessibilityRole="button"
              accessibilityLabel="Agregar respuesta"
            >
              <Icono nombre="add" tamano={26} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.contador}>{respuestas.length} / {MAX_RESPUESTAS}</Text>

          {respuestas.length === 0 && (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Todavía no guardaste ninguna</Text>
              <Text style={styles.vacioSub}>Probá con alguna de estas:</Text>
            </View>
          )}

          {respuestas.map(r => (
            <View key={r} style={styles.item}>
              <Text style={styles.itemText}>{r}</Text>
              <TouchableOpacity onPress={() => quitar(r)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar "${r}"`}>
                <Icono nombre="close-circle" tamano={20} color="#C0392B" />
              </TouchableOpacity>
            </View>
          ))}

          {respuestas.length === 0 && SUGERENCIAS.map(s => (
            <TouchableOpacity key={s} style={styles.sugerencia} onPress={() => agregar(s)}>
              <Text style={styles.sugerenciaText}>+ {s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: tema.bg },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: tema.overlay, alignItems: 'center', justifyContent: 'center' },
  title:            { fontSize: 22, fontFamily: F.extrabold, color: tema.texto },
  contenido:        { paddingHorizontal: 22, paddingBottom: 60 },
  ayuda:            { fontFamily: F.regular, fontSize: 13, color: tema.subTexto, lineHeight: 19, marginBottom: 16 },
  inputRow:         { flexDirection: 'row', gap: 10 },
  input:            { fontFamily: F.regular, flex: 1, backgroundColor: tema.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: tema.texto, borderWidth: 1.5, borderColor: tema.border },
  addBtn:           { width: 50, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  contador:         { fontFamily: F.regular, fontSize: 11, color: tema.subTexto, textAlign: 'right', marginTop: 6, marginBottom: 14 },
  item:             { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tema.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: tema.border },
  itemText:         { fontFamily: F.regular, flex: 1, fontSize: 14, color: tema.texto },
  vacio:            { alignItems: 'center', paddingVertical: 16 },
  vacioTitulo:      { fontSize: 15, fontFamily: F.extrabold, color: tema.texto },
  vacioSub:         { fontFamily: F.regular, fontSize: 12, color: tema.subTexto, marginTop: 4 },
  sugerencia:       { borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: tema.border, borderStyle: 'dashed' },
  sugerenciaText:   { fontSize: 13, color: Colors.primary, fontFamily: F.semibold },
  bloqueado:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bloqueadoIco:     { width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(26,158,92,.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  bloqueadoTitulo:  { fontSize: 20, fontFamily: F.extrabold, color: tema.texto, marginBottom: 8 },
  bloqueadoSub:     { fontFamily: F.regular, fontSize: 13, color: tema.subTexto, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  bloqueadoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFD23F', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  bloqueadoBtnText: { fontSize: 14, fontFamily: F.extrabold, color: Colors.dark },
})
