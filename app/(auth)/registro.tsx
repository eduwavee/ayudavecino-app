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

const PASOS = ['Rol', 'Datos', 'Listo']

export default function RegistroScreen() {
  const router     = useRouter()
  const setUsuario = useAuthStore(s => s.setUsuario)
  const [paso, setPaso]         = useState(0)
  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
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
      if (!nombre || !email || !password) return Alert.alert('Error', 'Completá todos los campos')
      if (password.length < 6) return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      handleRegistro()
    }
  }

  async function handleRegistro() {
    setLoading(true)
    try {
      const data = await authService.registro(nombre, email, password, rol)
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
                    <Text style={{ fontSize:28 }}>🙋</Text>
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
                    <Text style={{ fontSize:28 }}>🔨</Text>
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
              <View style={[styles.inputWrap, focusedField === 'nombre' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#aaa"
                  value={nombre}
                  onChangeText={setNombre}
                  onFocus={() => setFocusedField('nombre')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn}>
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
  backText:        { color:'white', fontSize:18 },
  progressTrack:   { height:4, backgroundColor:'rgba(255,255,255,.2)', borderRadius:2, marginBottom:20 },
  progressFill:    { height:4, backgroundColor:'white', borderRadius:2 },
  headerContent:   { paddingBottom:32 },
  stepBadge:       { backgroundColor:'rgba(255,255,255,.2)', alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:100, marginBottom:12 },
  stepBadgeText:   { color:'white', fontSize:11, fontWeight:'700' },
  headerEmoji:     { fontSize:44, marginBottom:8 },
  headerTitle:     { fontSize:30, fontWeight:'900', color:'white', lineHeight:36, marginBottom:6 },
  headerSub:       { fontSize:13, color:'rgba(255,255,255,.7)' },
  formSection:     { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  rolCard:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#f7f7f7', borderRadius:18, padding:16, marginBottom:12, borderWidth:2, borderColor:'transparent' },
  rolCardActive:   { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  rolCardLeft:     { flexDirection:'row', alignItems:'center', gap:14, flex:1 },
  rolIco:          { width:52, height:52, borderRadius:14, alignItems:'center', justifyContent:'center' },
  rolInfo:         { flex:1 },
  rolTitle:        { fontSize:15, fontWeight:'700', color:'#888', marginBottom:3 },
  rolTitleActive:  { color:'#1a1a1a' },
  rolDesc:         { fontSize:12, color:'#aaa' },
  rolCheck:        { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:'#ddd', alignItems:'center', justifyContent:'center' },
  rolCheckActive:  { backgroundColor:Colors.primary, borderColor:Colors.primary },
  rolCheckMark:    { color:'white', fontSize:12, fontWeight:'900' },
  inputWrap:       { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused:{ borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:        { fontSize:16, marginRight:10 },
  input:           { flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  divider:         { flexDirection:'row', alignItems:'center', gap:12, marginBottom:14, marginTop:4 },
  dividerLine:     { flex:1, height:1, backgroundColor:'#eee' },
  dividerText:     { fontSize:12, color:'#aaa' },
  googleBtn:       { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:'#f7f7f7', borderRadius:14, paddingVertical:14, marginBottom:20, borderWidth:1.5, borderColor:'#eee' },
  googleIco:       { fontSize:18 },
  googleText:      { fontSize:14, fontWeight:'600', color:'#1a1a1a' },
  btn:             { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:20 },
  btnText:         { color:'white', fontSize:15, fontWeight:'700', letterSpacing:.3 },
  loginRow:        { flexDirection:'row', justifyContent:'center' },
  loginText:       { fontSize:13, color:'#888' },
  loginLink:       { fontSize:13, color:Colors.primary, fontWeight:'700' },
})
