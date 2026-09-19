import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { authService } from '../../services/auth.service'
import { EMAIL_REGEX, PASSWORD_REGEX, MENSAJE_PASSWORD } from '../../utils/validaciones'
import { FUENTES as F } from '../../constants/diseno'
import { alertaError } from '../../utils/haptica'

type Paso = 'email' | 'codigo' | 'listo'

const CABECERA: Record<Paso, { emoji: string; chip: string }> = {
  email:  { emoji:'🔑', chip:'Recuperar acceso' },
  codigo: { emoji:'📬', chip:'✓ Revisá tu correo' },
  listo:  { emoji:'✅', chip:'Contraseña actualizada' },
}

// Recuperacion de contraseña en dos pasos: pedir un codigo por email y usarlo
// para crear una contraseña nueva (POST /auth/recuperar y /auth/restablecer).
export default function RecuperarScreen() {
  const router = useRouter()
  const [paso, setPaso]         = useState<Paso>('email')
  const [email, setEmail]       = useState('')
  const [codigo, setCodigo]     = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    fadeAnim.setValue(0)
    slideAnim.setValue(40)
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start()
  }, [paso])

  function mensajeDeError(err: any, porDefecto: string) {
    return err.response?.data?.mensaje || err.response?.data?.errores?.[0]?.msg || porDefecto
  }

  async function handleEnviarCodigo() {
    if (!EMAIL_REGEX.test(email.trim())) return alertaError('Ingresá un email válido')
    setLoading(true)
    try {
      await authService.solicitarRecuperacion(email.trim())
      setPaso('codigo')
    } catch (err: any) {
      alertaError(mensajeDeError(err, 'No se pudo enviar el código'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRestablecer() {
    if (!/^\d{6}$/.test(codigo.trim())) return alertaError('El código tiene 6 números')
    if (!PASSWORD_REGEX.test(password)) return alertaError(MENSAJE_PASSWORD)
    if (password !== confirmar) return alertaError('Las contraseñas no coinciden')
    setLoading(true)
    try {
      await authService.restablecerPassword(email.trim(), codigo.trim(), password, confirmar)
      setPaso('listo')
    } catch (err: any) {
      alertaError(mensajeDeError(err, 'No se pudo cambiar la contraseña'))
    } finally {
      setLoading(false)
    }
  }

  function campo(key: string, ico: string, props: React.ComponentProps<typeof TextInput>) {
    return (
      <View style={[styles.inputWrap, focused === key && styles.inputWrapFocused]}>
        <Text style={styles.inputIco}>{ico}</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="#767676"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          {...props}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.bigCircle} />
          <View style={styles.smallCircle} />
          <Text style={styles.mainEmoji}>{CABECERA[paso].emoji}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{CABECERA[paso].chip}</Text>
          </View>
        </View>

        <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {paso === 'email' && (
            <>
              <Text style={styles.title}>¿Olvidaste tu{'\n'}contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresá el email de tu cuenta y te mandamos un código para crear una contraseña nueva.
              </Text>

              {campo('email', '✉️', { placeholder:'Email', value:email, onChangeText:setEmail, keyboardType:'email-address' })}

              <TouchableOpacity style={[styles.btn, loading && { opacity:.7 }]} onPress={handleEnviarCodigo} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Enviar código →</Text>}
              </TouchableOpacity>
            </>
          )}

          {paso === 'codigo' && (
            <>
              <Text style={styles.title}>Ingresá el{'\n'}código</Text>
              <Text style={styles.subtitle}>
                Si <Text style={styles.emailDestacado}>{email.trim()}</Text> está registrado, te enviamos un código
                de 6 números. Vence en 15 minutos.
              </Text>

              {campo('codigo', '🔢', { placeholder:'Código de 6 números', value:codigo, onChangeText:setCodigo, keyboardType:'number-pad', maxLength:6 })}
              {campo('pass', '🔒', { placeholder:'Contraseña nueva (mín. 8, letras y números)', value:password, onChangeText:setPassword, secureTextEntry:true })}
              {campo('confirmar', '🔒', { placeholder:'Confirmar contraseña nueva', value:confirmar, onChangeText:setConfirmar, secureTextEntry:true })}

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 Si no lo ves, revisá la carpeta de spam o correo no deseado.</Text>
              </View>

              <TouchableOpacity style={[styles.btn, loading && { opacity:.7 }]} onPress={handleRestablecer} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Cambiar contraseña</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={handleEnviarCodigo} disabled={loading}>
                <Text style={styles.linkText}>Reenviar código</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => { setPaso('email'); setCodigo('') }}>
                <Text style={styles.linkText}>Usar otro email</Text>
              </TouchableOpacity>
            </>
          )}

          {paso === 'listo' && (
            <>
              <Text style={styles.title}>¡Listo!</Text>
              <Text style={styles.subtitle}>Tu contraseña se cambió. Ya podés iniciar sesión con la nueva.</Text>
              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.btnText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#F7F3EE' },
  scroll:           { flexGrow:1 },
  topSection:       { height:240, backgroundColor:'#1a1a1a', overflow:'hidden', justifyContent:'flex-end', padding:24, paddingBottom:44 },
  backBtn:          { position:'absolute', top:52, left:20, width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,.1)', alignItems:'center', justifyContent:'center', zIndex:10 },
  backText:         { fontFamily: F.regular, color:'white', fontSize:18 },
  bigCircle:        { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#1A9E5C', opacity:.2, top:-40, right:-40 },
  smallCircle:      { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'#FFD23F', opacity:.15, bottom:60, right:60 },
  mainEmoji:        { fontFamily: F.regular, fontSize:52, marginBottom:10 },
  chip:             { backgroundColor:'rgba(26,158,92,.2)', borderRadius:100, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(26,158,92,.3)', alignSelf:'flex-start' },
  chipText:         { color:'#3DD68C', fontSize:12, fontFamily: F.bold },
  formSection:      { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  title:            { fontSize:30, fontFamily: F.extrabold, color:'#1a1a1a', lineHeight:36, marginBottom:8 },
  subtitle:         { fontFamily: F.regular, fontSize:13, color:'#6B6B6B', lineHeight:20, marginBottom:24 },
  emailDestacado:   { color:'#1a1a1a', fontFamily: F.bold },
  inputWrap:        { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused: { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:         { fontFamily: F.regular, fontSize:16, marginRight:10 },
  input:            { fontFamily: F.regular, flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  tipBox:           { backgroundColor:'#F0FDF4', borderRadius:14, padding:14, marginBottom:20, marginTop:8 },
  tipText:          { fontFamily: F.regular, fontSize:12, color:'#555', lineHeight:18 },
  btn:              { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:16, marginTop:8 },
  btnText:          { color:'white', fontSize:15, fontFamily: F.bold, letterSpacing:.3 },
  linkBtn:          { alignSelf:'center', padding:6 },
  linkText:         { fontSize:13, color:Colors.primary, fontFamily: F.bold },
})
