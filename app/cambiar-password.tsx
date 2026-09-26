import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Animated, KeyboardAvoidingView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useAuthStore } from '../store/authStore'
import { usuariosService } from '../services/usuarios.service'
import { PASSWORD_REGEX, MENSAJE_PASSWORD } from '../utils/validaciones'
import { FUENTES as F } from '../constants/diseno'
import { alertaError } from '../utils/haptica'
import { PressScale } from '../components/ui/PressScale'
import { Icono } from '../components/ui/Icono'
import { FondoBarraEstado } from '../components/ui/FondoBarraEstado'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTema, TemaTokens } from '../store/temaStore'

export default function CambiarPasswordScreen() {
  const router = useRouter()
  const tema   = useTema()
  const styles = getStyles(tema)
  // El botón fijo de abajo respeta la barra de navegación del sistema (gestos o 3 botones)
  const insets = useSafeAreaInsets()
  const { usuario } = useAuthStore()

  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva]   = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(20)).current
  const successAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start()
  }, [])

  async function handleGuardar() {
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      return alertaError('Completá los tres campos')
    }
    if (!PASSWORD_REGEX.test(passwordNueva)) {
      return alertaError(MENSAJE_PASSWORD)
    }
    if (passwordNueva !== passwordConfirmar) {
      return alertaError('La confirmación no coincide con la nueva contraseña')
    }
    if (!usuario?.id) return

    setLoading(true)
    try {
      await usuariosService.cambiarPassword(usuario.id, passwordActual, passwordNueva)

      setGuardado(true)
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setGuardado(false)
        router.back()
      })
    } catch (err: any) {
      alertaError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const hayCambios = passwordActual.length > 0 && passwordNueva.length > 0 && passwordConfirmar.length > 0

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Icono nombre="arrow-back" tamano={20} color={tema.texto} />
          </PressScale>
          <Text style={styles.title}>Cambiar contraseña</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionLabel}>SEGURIDAD</Text>

          <View style={styles.fieldGroup}>
            <View style={[styles.fieldWrap, focused === 'actual' && styles.fieldFocused]}>
              <Icono nombre="key-outline" tamano={20} color={focused === 'actual' ? Colors.primary : tema.subTexto} style={styles.fieldIco} />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Contraseña actual</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordActual}
                  onChangeText={setPasswordActual}
                  placeholder="••••••••"
                  placeholderTextColor={tema.subTexto}
                  secureTextEntry
                  onFocus={() => setFocused('actual')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={[styles.fieldWrap, focused === 'nueva' && styles.fieldFocused]}>
              <Icono nombre="lock-closed-outline" tamano={20} color={focused === 'nueva' ? Colors.primary : tema.subTexto} style={styles.fieldIco} />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Nueva contraseña</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordNueva}
                  onChangeText={setPasswordNueva}
                  placeholder="Mínimo 8, letras y números"
                  placeholderTextColor={tema.subTexto}
                  secureTextEntry
                  onFocus={() => setFocused('nueva')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={[styles.fieldWrap, focused === 'confirmar' && styles.fieldFocused]}>
              <Icono nombre="lock-closed-outline" tamano={20} color={focused === 'confirmar' ? Colors.primary : tema.subTexto} style={styles.fieldIco} />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Confirmar nueva contraseña</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordConfirmar}
                  onChangeText={setPasswordConfirmar}
                  placeholder="Repetí la nueva contraseña"
                  placeholderTextColor={tema.subTexto}
                  secureTextEntry
                  onFocus={() => setFocused('confirmar')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          </View>

          <Text style={styles.hint}>
            Vas a seguir con la sesión iniciada en este dispositivo después de cambiarla.
          </Text>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 16 + Math.max(insets.bottom, 16) }]}>
        <PressScale haptico
          style={[
            styles.guardarBtn,
            !hayCambios && styles.guardarBtnDisabled,
            loading && { opacity: .7 }
          ]}
          onPress={handleGuardar}
          disabled={!hayCambios || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.guardarBtnText}>Actualizar contraseña</Text>
          }
        </PressScale>
      </View>

      <Animated.View style={[styles.successToast, { opacity: successAnim, transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Icono nombre="checkmark-circle" tamano={18} color={Colors.primaryLight} />
        <Text style={styles.successToastText}>Contraseña actualizada</Text>
      </Animated.View>
      <FondoBarraEstado color={tema.bg} />
    </KeyboardAvoidingView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: tema.bg },
  header:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 56, paddingBottom: 20 },
  backBtn:            { width: 38, height: 38, borderRadius: 12, backgroundColor:tema.overlay, alignItems: 'center', justifyContent: 'center' },
  title:              { fontSize: 20, fontFamily: F.extrabold, color:tema.texto },
  content:            { paddingHorizontal: 22 },
  sectionLabel:       { fontSize: 11, fontFamily: F.bold, color:tema.subTexto, letterSpacing: 1.5, marginBottom: 10 },
  fieldGroup:         { backgroundColor:tema.card, borderRadius: 18, overflow: 'hidden', shadowColor:tema.sombra, shadowOffset: { width: 0, height: 2 }, shadowOpacity: .05, shadowRadius: 8, elevation: 2 },
  fieldWrap:          { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 18 },
  fieldFocused:       { borderColor: Colors.primary, backgroundColor: tema.esOscuro ? 'rgba(26,158,92,.12)' : '#F0FDF4' },
  fieldIco:           { width:28, textAlign:'center' },
  fieldContent:       { flex: 1 },
  fieldLabel:         { fontSize: 10, fontFamily: F.bold, color:tema.subTexto, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 },
  // paddingHorizontal:0 alinea el texto con la etiqueta (Android le pone relleno por defecto)
  fieldInput:         { fontSize: 15, color:tema.texto, fontFamily: F.medium, paddingHorizontal: 0 },
  fieldDivider:       { height: 1, backgroundColor:tema.border, marginLeft: 56 },
  hint:               { fontFamily: F.regular, fontSize: 11, color:tema.subTexto, marginTop: 10, paddingHorizontal: 4 },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: tema.bg, padding: 16, paddingBottom: 32 },
  guardarBtn:         { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .3, shadowRadius: 10, elevation: 5 },
  guardarBtnDisabled: { backgroundColor: tema.esOscuro ? '#333333' : '#dddddd', shadowOpacity: 0, elevation: 0 },
  guardarBtnText:     { color: 'white', fontSize: 15, fontFamily: F.bold },
  successToast:       { flexDirection:'row', alignItems:'center', gap:8, position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: tema.esOscuro ? '#2A2A2A' : '#1a1a1a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100 },
  successToastText:   { color: 'white', fontSize: 14, fontFamily: F.bold },
})
