import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { EMAIL_REGEX, USERNAME_REGEX, PASSWORD_REGEX, MENSAJE_USERNAME, MENSAJE_PASSWORD } from '../../utils/validaciones'
import { FUENTES as F } from '../../constants/diseno'

const PASOS = ['Rol', 'Datos', 'Listo']

export default function RegistroScreen() {
  const router     = useRouter()
  const setUsuario = useAuthStore(s => s.setUsuario)
  const [paso, setPaso]         = useState(0)
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [rol, setRol]           = useState<'CLIENTE'|'PROVEEDOR'>('CLIENTE')
  const [loading, setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState<string|null>(null)

  const fadeAnim    = useRef(new Animated.Value(0)).current
  const slideAnim   = useRef(new Animated.Value(30)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start()
  }, [])

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (paso + 1) / PASOS.length,
      duration: 400,
      useNativeDriver: false,
    }).start()
  }, [paso])

  function siguientePaso() {
    if (paso === 0) {
      setPaso(1)
    } else if (paso === 1) {
      if (!email || !username || !password || !confirmarPassword) return Alert.alert('Error', 'Completá todos los campos')
      if (!EMAIL_REGEX.test(email.trim())) return Alert.alert('Error', 'Ingresá un email válido')
      if (!USERNAME_REGEX.test(username.trim().toLowerCase())) return Alert.alert('Error', MENSAJE_USERNAME)
      if (!PASSWORD_REGEX.test(password)) return Alert.alert('Error', MENSAJE_PASSWORD)
      if (password !== confirmarPassword) return Alert.alert('Error', 'Las contraseñas no coinciden')
      handleRegistro()
    }
  }

  async function handleRegistro() {
    setLoading(true)
    try {
      const data = await authService.registro(email.trim(), username.trim().toLowerCase(), password, confirmarPassword, rol)
      setUsuario(data.usuario, data.token)
      router.replace('/(tabs)')
    } catch (err: any) {
      const msg = err.response?.data?.mensaje
        || err.response?.data?.errores?.[0]?.msg
        || err.message
        || 'Error al registrarse'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HEADER verde */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => paso > 0 ? setPaso(paso-1) : router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <View style={styles.headerContent}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Paso {paso + 1} de {PASOS.length - 1}</Text>
            </View>
            <Text style={styles.headerEmoji}>
              {paso === 0 ? '🏘️' : '✍️'}
            </Text>
            <Text style={styles.headerTitle}>
              {paso === 0 ? 'Unite al\nvecindario' : 'Tus\ndatos'}
            </Text>
            <Text style={styles.headerSub}>
              {paso === 0
                ? '¿Cómo vas a usar AyudaVecino?'
                : 'Casi listo, completá tu perfil'
              }
            </Text>
          </View>
        </Animated.View>

        {/* FORM */}
        <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* PASO 0 — Elegir rol */}
          {paso === 0 && (
            <View>
              <TouchableOpacity
                style={[styles.rolCard, rol === 'CLIENTE' && styles.rolCardActive]}
                onPress={() => setRol('CLIENTE')}
              >
                <View style={styles.rolCardLeft}>
                  <View style={[styles.rolIco, { backgroundColor: rol === 'CLIENTE' ? '#C8F5D0' : '#f5f5f5' }]}>
                    <Text style={{ fontFamily: F.regular, fontSize:28 }}>🙋</Text>
                  </View>
                  <View style={styles.rolInfo}>
                    <Text style={[styles.rolTitle, rol === 'CLIENTE' && styles.rolTitleActive]}>Busco servicios</Text>
                    <Text style={styles.rolDesc}>Contratá profesionales cerca tuyo</Text>
                  </View>
                </View>
                <View style={[styles.rolCheck, rol === 'CLIENTE' && styles.rolCheckActive]}>
                  {rol === 'CLIENTE' && <Text style={styles.rolCheckMark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rolCard, rol === 'PROVEEDOR' && styles.rolCardActive]}
                onPress={() => setRol('PROVEEDOR')}
              >
                <View style={styles.rolCardLeft}>
                  <View style={[styles.rolIco, { backgroundColor: rol === 'PROVEEDOR' ? '#C8F5D0' : '#f5f5f5' }]}>
                    <Text style={{ fontFamily: F.regular, fontSize:28 }}>🔨</Text>
                  </View>
                  <View style={styles.rolInfo}>
                    <Text style={[styles.rolTitle, rol === 'PROVEEDOR' && styles.rolTitleActive]}>Ofrezco servicios</Text>
                    <Text style={styles.rolDesc}>Publicá tus servicios y conseguí clientes</Text>
                  </View>
                </View>
                <View style={[styles.rolCheck, rol === 'PROVEEDOR' && styles.rolCheckActive]}>
                  {rol === 'PROVEEDOR' && <Text style={styles.rolCheckMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 1 — Datos */}
          {paso === 1 && (
            <View>
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#767676"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, focusedField === 'usuario' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Usuario (6 a 20 caracteres)"
                  placeholderTextColor="#767676"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('usuario')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (mín. 8, letras y números)"
                  placeholderTextColor="#767676"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, focusedField === 'confirmar' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#767676"
                  value={confirmarPassword}
                  onChangeText={setConfirmarPassword}
                  secureTextEntry
                  onFocus={() => setFocusedField('confirmar')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => Alert.alert('Próximamente', 'El ingreso con Google va a estar disponible en una próxima versión de la app.')}
          >
                <Text style={styles.googleIco}>🇬</Text>
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón siguiente */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity:.7 }]}
            onPress={siguientePaso}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>{paso === 0 ? 'Continuar →' : 'Crear cuenta 🚀'}</Text>
            }
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Iniciá sesión</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#F7F3EE' },
  scroll:          { flexGrow:1 },
  header:          { backgroundColor:Colors.primary, padding:24, paddingTop:0, overflow:'hidden' },
  backBtn:         { marginTop:52, marginBottom:16, width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,.2)', alignItems:'center', justifyContent:'center' },
  backText:        { fontFamily: F.regular, color:'white', fontSize:18 },
  progressTrack:   { height:4, backgroundColor:'rgba(255,255,255,.2)', borderRadius:2, marginBottom:20 },
  progressFill:    { height:4, backgroundColor:'white', borderRadius:2 },
  headerContent:   { paddingBottom:32 },
  stepBadge:       { backgroundColor:'rgba(255,255,255,.2)', alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:100, marginBottom:12 },
  stepBadgeText:   { color:'white', fontSize:11, fontFamily: F.bold },
  headerEmoji:     { fontFamily: F.regular, fontSize:44, marginBottom:8 },
  headerTitle:     { fontSize:30, fontFamily: F.extrabold, color:'white', lineHeight:36, marginBottom:6 },
  headerSub:       { fontFamily: F.regular, fontSize:13, color:'rgba(255,255,255,.7)' },
  formSection:     { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  rolCard:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#f7f7f7', borderRadius:18, padding:16, marginBottom:12, borderWidth:2, borderColor:'transparent' },
  rolCardActive:   { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  rolCardLeft:     { flexDirection:'row', alignItems:'center', gap:14, flex:1 },
  rolIco:          { width:52, height:52, borderRadius:14, alignItems:'center', justifyContent:'center' },
  rolInfo:         { flex:1 },
  rolTitle:        { fontSize:15, fontFamily: F.bold, color:'#6B6B6B', marginBottom:3 },
  rolTitleActive:  { color:'#1a1a1a' },
  rolDesc:         { fontFamily: F.regular, fontSize:12, color:'#aaa' },
  rolCheck:        { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:'#ddd', alignItems:'center', justifyContent:'center' },
  rolCheckActive:  { backgroundColor:Colors.primary, borderColor:Colors.primary },
  rolCheckMark:    { color:'white', fontSize:12, fontFamily: F.extrabold },
  inputWrap:       { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused:{ borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:        { fontFamily: F.regular, fontSize:16, marginRight:10 },
  input:           { fontFamily: F.regular, flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  divider:         { flexDirection:'row', alignItems:'center', gap:12, marginBottom:14, marginTop:4 },
  dividerLine:     { flex:1, height:1, backgroundColor:'#eee' },
  dividerText:     { fontFamily: F.regular, fontSize:12, color:'#aaa' },
  googleBtn:       { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#f7f7f7', borderRadius:14, paddingVertical:14, marginBottom:20, borderWidth:1.5, borderColor:'#eee' },
  googleIco:       { fontFamily: F.regular, fontSize:18 },
  googleText:      { fontSize:14, fontFamily: F.semibold, color:'#1a1a1a' },
  btn:             { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:20 },
  btnText:         { color:'white', fontSize:15, fontFamily: F.bold, letterSpacing:.3 },
  loginRow:        { flexDirection:'row', justifyContent:'center' },
  loginText:       { fontFamily: F.regular, fontSize:13, color:'#6B6B6B' },
  loginLink:       { fontSize:13, color:Colors.primary, fontFamily: F.bold },
})
