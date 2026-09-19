import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { EMAIL_REGEX } from '../../utils/validaciones'

// Landing de recuperacion de contraseña. Todavia no hay endpoint en el backend:
// simula el envio y muestra la confirmacion.
export default function RecuperarScreen() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [enviado, setEnviado]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(false)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    fadeAnim.setValue(0)
    slideAnim.setValue(40)
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start()
  }, [enviado])

  function handleEnviar() {
    if (!EMAIL_REGEX.test(email.trim())) return Alert.alert('Error', 'Ingresá un email válido')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setEnviado(true)
    }, 900)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.bigCircle} />
          <View style={styles.smallCircle} />
          <Text style={styles.mainEmoji}>{enviado ? '📬' : '🔑'}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{enviado ? '✓ Revisá tu correo' : 'Recuperar acceso'}</Text>
          </View>
        </View>

        <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {!enviado ? (
            <>
              <Text style={styles.title}>¿Olvidaste tu{'\n'}contraseña?</Text>
              <Text style={styles.subtitle}>
                Ingresá el email de tu cuenta y te mandamos un enlace para crear una contraseña nueva.
              </Text>

              <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
                <Text style={styles.inputIco}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity:.7 }]}
                onPress={handleEnviar}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.btnText}>Enviar enlace →</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>¡Listo!</Text>
              <Text style={styles.subtitle}>
                Si <Text style={styles.emailDestacado}>{email.trim()}</Text> está registrado, en unos minutos
                vas a recibir un email con los pasos para restablecer tu contraseña.
              </Text>

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 Si no lo ves, revisá la carpeta de spam o correo no deseado.</Text>
              </View>

              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.btnText}>Volver a iniciar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={() => setEnviado(false)}>
                <Text style={styles.linkText}>Usar otro email</Text>
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
  backText:         { color:'white', fontSize:18 },
  bigCircle:        { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#1A9E5C', opacity:.2, top:-40, right:-40 },
  smallCircle:      { position:'absolute', width:100, height:100, borderRadius:50, backgroundColor:'#FFD23F', opacity:.15, bottom:60, right:60 },
  mainEmoji:        { fontSize:52, marginBottom:10 },
  chip:             { backgroundColor:'rgba(26,158,92,.2)', borderRadius:100, paddingHorizontal:14, paddingVertical:6, borderWidth:1, borderColor:'rgba(26,158,92,.3)', alignSelf:'flex-start' },
  chipText:         { color:'#3DD68C', fontSize:12, fontWeight:'700' },
  formSection:      { flex:1, backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, marginTop:-20, padding:28, paddingTop:32 },
  title:            { fontSize:30, fontWeight:'900', color:'#1a1a1a', lineHeight:36, marginBottom:8 },
  subtitle:         { fontSize:13, color:'#888', lineHeight:20, marginBottom:24 },
  emailDestacado:   { color:'#1a1a1a', fontWeight:'700' },
  inputWrap:        { flexDirection:'row', alignItems:'center', backgroundColor:'#f7f7f7', borderRadius:14, paddingHorizontal:14, marginBottom:20, borderWidth:1.5, borderColor:'transparent' },
  inputWrapFocused: { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  inputIco:         { fontSize:16, marginRight:10 },
  input:            { flex:1, paddingVertical:14, fontSize:14, color:'#1a1a1a' },
  tipBox:           { backgroundColor:'#F0FDF4', borderRadius:14, padding:14, marginBottom:20 },
  tipText:          { fontSize:12, color:'#555', lineHeight:18 },
  btn:              { backgroundColor:'#1a1a1a', borderRadius:16, paddingVertical:16, alignItems:'center', marginBottom:16 },
  btnText:          { color:'white', fontSize:15, fontWeight:'700', letterSpacing:.3 },
  linkBtn:          { alignSelf:'center', padding:6 },
  linkText:         { fontSize:13, color:Colors.primary, fontWeight:'700' },
})
