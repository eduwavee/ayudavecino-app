import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Animated
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import { useAuthStore } from '../store/authStore'
import { usuariosService } from '../services/usuarios.service'

export default function CambiarPasswordScreen() {
  const router = useRouter()
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
      return Alert.alert('Error', 'Completá los tres campos')
    }
    if (passwordNueva.length < 6) {
      return Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres')
    }
    if (passwordNueva !== passwordConfirmar) {
      return Alert.alert('Error', 'La confirmación no coincide con la nueva contraseña')
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
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const hayCambios = passwordActual.length > 0 && passwordNueva.length > 0 && passwordConfirmar.length > 0

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Cambiar contraseña</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionLabel}>SEGURIDAD</Text>

          <View style={styles.fieldGroup}>
            <View style={[styles.fieldWrap, focused === 'actual' && styles.fieldFocused]}>
              <Text style={styles.fieldIco}>🔑</Text>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Contraseña actual</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordActual}
                  onChangeText={setPasswordActual}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  onFocus={() => setFocused('actual')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={[styles.fieldWrap, focused === 'nueva' && styles.fieldFocused]}>
              <Text style={styles.fieldIco}>🔒</Text>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Nueva contraseña</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordNueva}
                  onChangeText={setPasswordNueva}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  onFocus={() => setFocused('nueva')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={[styles.fieldWrap, focused === 'confirmar' && styles.fieldFocused]}>
              <Text style={styles.fieldIco}>🔒</Text>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Confirmar nueva contraseña</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={passwordConfirmar}
                  onChangeText={setPasswordConfirmar}
                  placeholder="Repetí la nueva contraseña"
                  placeholderTextColor="#bbb"
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

      <View style={styles.bottomBar}>
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.successToast, { opacity: successAnim, transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.successToastText}>✅ Contraseña actualizada</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.cream },
  header:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 56, paddingBottom: 20 },
  backBtn:            { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.06)', alignItems: 'center', justifyContent: 'center' },
  backText:           { fontSize: 16, color: Colors.dark },
  title:              { fontSize: 20, fontWeight: '900', color: Colors.dark },
  content:            { paddingHorizontal: 22 },
  sectionLabel:       { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1.5, marginBottom: 10 },
  fieldGroup:         { backgroundColor: 'white', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: .05, shadowRadius: 8, elevation: 2 },
  fieldWrap:          { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 18 },
  fieldFocused:       { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  fieldIco:           { fontSize: 22, width: 28, textAlign: 'center' },
  fieldContent:       { flex: 1 },
  fieldLabel:         { fontSize: 10, fontWeight: '700', color: '#aaa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 },
  fieldInput:         { fontSize: 15, color: Colors.dark, fontWeight: '500' },
  fieldDivider:       { height: 1, backgroundColor: '#f5f5f5', marginLeft: 56 },
  hint:               { fontSize: 11, color: '#bbb', marginTop: 10, paddingHorizontal: 4 },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.cream, padding: 16, paddingBottom: 32 },
  guardarBtn:         { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .3, shadowRadius: 10, elevation: 5 },
  guardarBtnDisabled: { backgroundColor: '#ddd', shadowOpacity: 0, elevation: 0 },
  guardarBtnText:     { color: 'white', fontSize: 15, fontWeight: '700' },
  successToast:       { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100 },
  successToastText:   { color: 'white', fontSize: 14, fontWeight: '700' },
})
