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
import { FUENTES as F } from '../../constants/diseno'
import { alertaError, haptica } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'

export default function LoginScreen() {
  const router     = useRouter()
  const setUsuario = useAuthStore(s => s.setUsuario)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol]           = useState<'CLIENTE'|'PROVEEDOR'>('CLIENTE')
  const [loading, setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState<string|null>(null)

  // Animaciones
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:600, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:600, useNativeDriver:true }),
      Animated.spring(scaleAnim, { toValue:1, tension:60, friction:8, useNativeDriver:true }),
    ]).start()
  }, [])

  async function handleLogin() {
    if (!username || !password) return alertaError('Completá todos los campos')
    setLoading(true)
    try {
      const data = await authService.login(username.trim(), password, rol)
      setUsuario(data.usuario, data.token)
      haptica.exito()
      router.replace('/(tabs)')
    } catch (err: any) {
      // 401 = usuario/contraseña incorrectos o cuenta del otro rol; recordamos el tab elegido
      const msg = err.response?.status === 401
        ? `Usuario o contraseña incorrectos para una cuenta de ${rol === 'CLIENTE' ? 'cliente' : 'proveedor'}`
        : err.response?.data?.mensaje || err.response?.data?.errores?.[0]?.msg || err.message || 'Error al iniciar sesión'
      alertaError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* TOP — ilustración */}
        <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </PressScale>
          <View style={styles.illustrationWrap}>
            <View style={styles.bigCircle} />
            <View style={styles.smallCircle} />
            <Text style={styles.mainEmoji}>🏘️</Text>
            <View style={styles.welcomeChip}>
              <Text style={styles.welcomeChipText}>👋 Bienvenido de vuelta</Text>
            </View>
          </View>
        </Animated.View>

        {/* FORM */}
        <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>

          <Text style={styles.title}>Hola de{'\n'}nuevo 👋</Text>
          <Text style={styles.subtitle}>Ingresá a tu cuenta para continuar</Text>

          {/* Tabs de rol */}
          <View style={styles.rolTabs}>
            <TouchableOpacity
              style={[styles.rolTab, rol === 'CLIENTE' && styles.rolTabActive]}
              onPress={() => setRol('CLIENTE')}
            >
              <Text style={[styles.rolTabText, rol === 'CLIENTE' && styles.rolTabTextActive]}>🙋 Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rolTab, rol === 'PROVEEDOR' && styles.rolTabActive]}
              onPress={() => setRol('PROVEEDOR')}
            >
              <Text style={[styles.rolTabText, rol === 'PROVEEDOR' && styles.rolTabTextActive]}>🔨 Proveedor</Text>
            </TouchableOpacity>
          </View>

          {/* Usuario */}
          <View style={[styles.inputWrap, focusedField === 'usuario' && styles.inputWrapFocused]}>
            <Text style={styles.inputIco}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#767676"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('usuario')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}>
            <Text style={styles.inputIco}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#767676"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/recuperar')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <PressScale haptico
            style={[styles.btn, loading && { opacity:.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>Ingresar →</Text>
            }
          </PressScale>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <PressScale haptico
            style={styles.googleBtn}
            onPress={() => Alert.alert('Próximamente', 'El ingreso con Google va a estar disponible en una próxima versión de la app.')}
          >
            <Text style={styles.googleIco}>🇬</Text>
            <Text style={styles.googleText}>Continuar con Google</Text>
          </PressScale>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tenés cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/registro')}>
              <Text style={styles.registerLink}>Registrate</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#F7F3EE' },
  scroll:           { flexGrow:1 },
  topSection:       { height:240, backgroundColor:'#1a1a1a', overflow:'hidden', justifyContent:'flex-end', padding:24 },
  backBtn:          { position:'absolute', top:52, left:20, width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,.1)', alignItems:'center', justifyContent:'center', zIndex:10 },
  backText:         { fontFamily: F.regular, color:'white', fontSize:18 },
  illustrationWrap: { position:'relative', alignItems:'flex-start' },
  bigCircle:        { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#1A9E5C', opacity:.2, top:-80, right:-40 },
  smallCircle:      { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'#FFD23F', opacity:.15, bottom:20, right:40 },
  mainEmoji:        { fontFamily: F.regular, fontSize:52, marginBottom:10 },
  welcomeChip:      { backgroundColor:'rgba(26,158,92,.2)', borderRadius:100, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(26,158,92,.3)', alignSelf:'flex-start' },
  welcomeChipText:  { color:'#3DD68C', fontSize:12, fontFamily: F.bold },
  formSection:      { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  title:            { fontSize:30, fontFamily: F.extrabold, color:'#1a1a1a', lineHeight:36, marginBottom:6 },
  subtitle:         { fontFamily: F.regular, fontSize:13, color:'#6B6B6B', marginBottom:24 },
  rolTabs:          { flexDirection:'row', backgroundColor:'#f5f5f5', borderRadius:14, padding:4, marginBottom:20, gap:6 },
  rolTab:           { flex:1, paddingVertical:9, borderRadius:10, alignItems:'center' },
  rolTabActive:     { backgroundColor:'#1a1a1a' },
  rolTabText:       { fontSize:13, fontFamily: F.semibold, color:'#6B6B6B' },
  rolTabTextActive: { color:'white' },
  inputWrap:        { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused: { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:         { fontFamily: F.regular, fontSize:16, marginRight:10 },
  input:            { fontFamily: F.regular, flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  forgotBtn:        { alignSelf:'flex-end', marginBottom:20 },
  forgotText:       { fontSize:12, color:Colors.primary, fontFamily: F.semibold },
  btn:              { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:20 },
  btnText:          { color:'white', fontSize:15, fontFamily: F.bold, letterSpacing:.3 },
  divider:          { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  dividerLine:      { flex:1, height:1, backgroundColor:'#eee' },
  dividerText:      { fontFamily: F.regular, fontSize:12, color:'#aaa' },
  googleBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#f7f7f7', borderRadius:14, paddingVertical:14, marginBottom:24, borderWidth:1.5, borderColor:'#eee' },
  googleIco:        { fontFamily: F.regular, fontSize:18 },
  googleText:       { fontSize:14, fontFamily: F.semibold, color:'#1a1a1a' },
  registerRow:      { flexDirection:'row', justifyContent:'center' },
  registerText:     { fontFamily: F.regular, fontSize:13, color:'#6B6B6B' },
  registerLink:     { fontSize:13, color:Colors.primary, fontFamily: F.bold },
})
