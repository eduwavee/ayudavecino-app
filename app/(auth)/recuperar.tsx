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
import { PressScale } from '../../components/ui/PressScale'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { mensajeDeError } from '../../utils/errores'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import Reanimated, { Easing, Keyframe, ReduceMotion } from 'react-native-reanimated'

type Paso = 'email' | 'codigo' | 'listo'

const CABECERA: Record<Paso, { icono: NombreIcono; chip: string }> = {
  email:  { icono:'key',              chip:'Recuperar acceso' },
  codigo: { icono:'mail-unread',      chip:'Revisá tu correo' },
  listo:  { icono:'checkmark-circle', chip:'Contraseña actualizada' },
}

// El icono de la cabecera cambia con cada paso: entra con un pequeño asentamiento
// para marcar que el proceso avanzó.
const ENTRADA_ICONO = new Keyframe({
  0:   { opacity: 0, transform: [{ scale: 0.8 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.bezier(0.23, 1, 0.32, 1) },
}).duration(280).reduceMotion(ReduceMotion.System)

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

  function campo(key: string, ico: NombreIcono, props: React.ComponentProps<typeof TextInput>) {
    return (
      <View style={[styles.inputWrap, focused === key && styles.inputWrapFocused]}>
        <Icono nombre={ico} tamano={18} color={focused === key ? Colors.primary : '#767676'} style={styles.inputIco} />
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.topSection}>
          <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
            <Icono nombre="arrow-back" tamano={20} color="white" />
          </PressScale>
          <View style={styles.bigCircle} />
          <View style={styles.smallCircle} />
          <Reanimated.View key={paso} entering={ENTRADA_ICONO} style={styles.mainIco}>
            <Icono nombre={CABECERA[paso].icono} tamano={46} color="#3DD68C" />
          </Reanimated.View>
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

              {campo('email', 'mail-outline', { placeholder:'Email', value:email, onChangeText:setEmail, keyboardType:'email-address' })}

              <PressScale haptico style={[styles.btn, loading && { opacity:.7 }]} onPress={handleEnviarCodigo} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <View style={styles.btnFila}><Text style={styles.btnText}>Enviar código</Text><Icono nombre="arrow-forward" tamano={18} color="white" /></View>}
              </PressScale>
            </>
          )}

          {paso === 'codigo' && (
            <>
              <Text style={styles.title}>Ingresá el{'\n'}código</Text>
              <Text style={styles.subtitle}>
                Si <Text style={styles.emailDestacado}>{email.trim()}</Text> está registrado, te enviamos un código
                de 6 números. Vence en 15 minutos.
              </Text>

              {campo('codigo', 'keypad-outline', { placeholder:'Código de 6 números', value:codigo, onChangeText:setCodigo, keyboardType:'number-pad', maxLength:6 })}
              {campo('pass', 'lock-closed-outline', { placeholder:'Contraseña nueva (mín. 8, letras y números)', value:password, onChangeText:setPassword, secureTextEntry:true })}
              {campo('confirmar', 'lock-closed-outline', { placeholder:'Confirmar contraseña nueva', value:confirmar, onChangeText:setConfirmar, secureTextEntry:true })}

              <View style={styles.tipBox}>
                <Icono nombre="bulb-outline" tamano={16} color="#137A47" />
                <Text style={styles.tipText}>Si no lo ves, revisá la carpeta de spam o correo no deseado.</Text>
              </View>

              <PressScale haptico style={[styles.btn, loading && { opacity:.7 }]} onPress={handleRestablecer} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Cambiar contraseña</Text>}
              </PressScale>

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
              <PressScale haptico style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.btnText}>Iniciar sesión</Text>
              </PressScale>
            </>
          )}
        </Animated.View>
      </ScrollView>
      <FondoBarraEstado color="#1a1a1a" />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#F7F3EE' },
  scroll:           { flexGrow:1 },
  topSection:       { height:240, backgroundColor:'#1a1a1a', overflow:'hidden', justifyContent:'flex-end', padding:24, paddingBottom:44 },
  backBtn:          { position:'absolute', top:52, left:20, width:38, height:38, borderRadius:12, backgroundColor:'rgba(255,255,255,.1)', alignItems:'center', justifyContent:'center', zIndex:10 },
  bigCircle:        { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#1A9E5C', opacity:.2, top:-40, right:-40 },
  smallCircle:      { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'#FFD23F', opacity:.15, bottom:60, right:60 },
  mainIco:          { marginBottom:10, alignSelf:'flex-start' },
  chip:             { backgroundColor:'rgba(26,158,92,.2)', borderRadius:100, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(26,158,92,.3)', alignSelf:'flex-start' },
  chipText:         { color:'#3DD68C', fontSize:12, fontFamily: F.bold },
  formSection:      { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  title:            { fontSize:30, fontFamily: F.extrabold, color:'#1a1a1a', lineHeight:36, marginBottom:8 },
  subtitle:         { fontFamily: F.regular, fontSize:13, color:'#6B6B6B', lineHeight:20, marginBottom:24 },
  emailDestacado:   { color:'#1a1a1a', fontFamily: F.bold },
  inputWrap:        { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:12, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused: { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:         { marginRight:10 },
  input:            { fontFamily: F.regular, flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  tipBox:           { flexDirection:'row', gap:8, backgroundColor:'#F0FDF4', borderRadius:14, padding:14, marginBottom:20, marginTop:8 },
  tipText:          { flex:1, fontFamily: F.regular, fontSize:12, color:'#555', lineHeight:18 },
  btnFila:          { flexDirection:'row', alignItems:'center', gap:8 },
  btn:              { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:16, marginTop:8 },
  btnText:          { color:'white', fontSize:15, fontFamily: F.bold, letterSpacing:.3 },
  linkBtn:          { alignSelf:'center', padding:6 },
  linkText:         { fontSize:13, color:Colors.primary, fontFamily: F.bold },
})
