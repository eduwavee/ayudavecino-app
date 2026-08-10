import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Animated, Image
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import MapView, { Marker } from 'react-native-maps'
import { Colors } from '../constants/colors'
import { API_URL, avatarUrl } from '../constants/config'
import { useAuthStore } from '../store/authStore'
import { usuariosService } from '../services/usuarios.service'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function EditarPerfilScreen() {
  const router  = useRouter()
  const { usuario, setUsuario } = useAuthStore()

  const esProveedor = usuario?.rol === 'PROVEEDOR'

  const [nombre, setNombre]     = useState(usuario?.nombre ?? '')
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '')
  const [latitud, setLatitud]   = useState<number | null>(usuario?.latitud ?? null)
  const [longitud, setLongitud] = useState<number | null>(usuario?.longitud ?? null)
  const [ubicando, setUbicando] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string|null>(null)
  const [guardado, setGuardado] = useState(false)
  const [subiendoAvatar, setSubiendoAvatar] = useState(false)

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const successAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start()
  }, [])

  async function handleCambiarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Activá el permiso de galería para elegir una foto de perfil')
      return
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (resultado.canceled || !resultado.assets?.[0] || !usuario?.id) return

    setSubiendoAvatar(true)
    try {
      const usuarioActualizado = await usuariosService.subirAvatar(usuario.id, resultado.assets[0].uri)
      const token = await AsyncStorage.getItem('token')
      setUsuario(usuarioActualizado, token!)
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo subir la foto')
    } finally {
      setSubiendoAvatar(false)
    }
  }

  async function handleUsarUbicacionActual() {
    setUbicando(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Activá el permiso de ubicación para que los clientes te encuentren en el mapa')
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      setLatitud(pos.coords.latitude)
      setLongitud(pos.coords.longitude)
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación')
    } finally {
      setUbicando(false)
    }
  }

  async function handleGuardar() {
    if (!nombre.trim()) return Alert.alert('Error', 'El nombre no puede estar vacío')
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const { data } = await axios.put(
        `${API_URL}/usuarios/${usuario?.id}`,
        {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          ...(latitud  != null && { latitud }),
          ...(longitud != null && { longitud }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Actualizar store
      setUsuario(data.usuario, token!)

      // Animación de éxito
      setGuardado(true)
      Animated.sequence([
        Animated.timing(successAnim, { toValue:1, duration:300, useNativeDriver:true }),
        Animated.delay(1500),
        Animated.timing(successAnim, { toValue:0, duration:300, useNativeDriver:true }),
      ]).start(() => {
        setGuardado(false)
        router.back()
      })
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  const hayCambios = nombre !== usuario?.nombre
    || telefono !== (usuario?.telefono ?? '')
    || latitud  !== (usuario?.latitud  ?? null)
    || longitud !== (usuario?.longitud ?? null)

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Editar perfil</Text>
        </View>

        <Animated.View style={[styles.content, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {avatarUrl(usuario?.avatar) ? (
                  <Image source={{ uri: avatarUrl(usuario?.avatar)! }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {nombre?.charAt(0).toUpperCase()}
                  </Text>
                )}
                {subiendoAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color="white" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.avatarEdit}
                onPress={handleCambiarFoto}
                disabled={subiendoAvatar}
              >
                <Text style={styles.avatarEditText}>📷</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tocá para cambiar foto</Text>
          </View>

          {/* Campos */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>INFORMACIÓN PERSONAL</Text>

            <View style={styles.fieldGroup}>
              <View style={[styles.fieldWrap, focused === 'nombre' && styles.fieldFocused]}>
                <Text style={styles.fieldIco}>👤</Text>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Nombre completo</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                    placeholderTextColor="#bbb"
                    onFocus={() => setFocused('nombre')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={[styles.fieldWrap, focused === 'telefono' && styles.fieldFocused]}>
                <Text style={styles.fieldIco}>📱</Text>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 381 123 4567"
                    placeholderTextColor="#bbb"
                    keyboardType="phone-pad"
                    onFocus={() => setFocused('telefono')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>
            </View>

            {/* Ubicación (solo proveedores, para aparecer en el mapa) */}
            {esProveedor && (
              <>
                <Text style={[styles.sectionLabel, { marginTop:20 }]}>UBICACIÓN</Text>
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldIco}>📍</Text>
                    <View style={styles.fieldContent}>
                      <Text style={styles.fieldLabel}>En el mapa de clientes</Text>
                      <Text style={styles.fieldInputReadOnly}>
                        {latitud != null && longitud != null ? '✅ Ubicación guardada' : 'Sin ubicación cargada'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.ubicacionBtn}
                      onPress={handleUsarUbicacionActual}
                      disabled={ubicando}
                    >
                      {ubicando
                        ? <ActivityIndicator color={Colors.primary} size="small" />
                        : <Text style={styles.ubicacionBtnText}>Usar actual</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {latitud != null && longitud != null && (
                  <View style={styles.previewMapWrap}>
                    <MapView
                      style={StyleSheet.absoluteFillObject}
                      region={{ latitude: latitud, longitude: longitud, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                    >
                      <Marker
                        coordinate={{ latitude: latitud, longitude: longitud }}
                        draggable
                        onDragEnd={e => {
                          setLatitud(e.nativeEvent.coordinate.latitude)
                          setLongitud(e.nativeEvent.coordinate.longitude)
                        }}
                        pinColor={Colors.primary}
                      />
                    </MapView>
                    <Text style={styles.previewMapHint}>Mantené presionado el pin para ajustarlo</Text>
                  </View>
                )}

                <Text style={styles.ubicacionHint}>
                  Así los clientes te ven en el mapa y saben qué tan cerca estás.
                </Text>
              </>
            )}

            {/* Email (no editable) */}
            <Text style={[styles.sectionLabel, { marginTop:20 }]}>CUENTA</Text>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIco}>✉️</Text>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldInputReadOnly}>{usuario?.email}</Text>
                </View>
                <View style={styles.noeditBadge}>
                  <Text style={styles.noeditText}>No editable</Text>
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIco}>🏷️</Text>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Rol</Text>
                  <Text style={styles.fieldInputReadOnly}>
                    {usuario?.rol === 'PROVEEDOR' ? '🔨 Proveedor' : '🙋 Cliente'}
                  </Text>
                </View>
                <View style={styles.noeditBadge}>
                  <Text style={styles.noeditText}>No editable</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height:120 }} />
        </Animated.View>
      </ScrollView>

      {/* Botón guardar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.guardarBtn,
            !hayCambios && styles.guardarBtnDisabled,
            loading && { opacity:.7 }
          ]}
          onPress={handleGuardar}
          disabled={!hayCambios || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.guardarBtnText}>Guardar cambios</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Toast de éxito */}
      <Animated.View style={[styles.successToast, { opacity: successAnim, transform:[{ translateY: successAnim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }] }]}>
        <Text style={styles.successToastText}>✅ Perfil actualizado</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex:1, backgroundColor:Colors.cream },
  header:             { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:20 },
  backBtn:            { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:           { fontSize:16, color:Colors.dark },
  title:              { fontSize:22, fontWeight:'900', color:Colors.dark },
  content:            { paddingHorizontal:22 },
  avatarSection:      { alignItems:'center', marginBottom:28 },
  avatarWrap:         { position:'relative', marginBottom:8 },
  avatar:             { width:90, height:90, borderRadius:28, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', overflow:'hidden', shadowColor:Colors.primary, shadowOffset:{width:0,height:6}, shadowOpacity:.3, shadowRadius:12, elevation:6 },
  avatarImg:          { width:'100%', height:'100%' },
  avatarLoading:       { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,.4)', alignItems:'center', justifyContent:'center' },
  avatarText:         { color:'white', fontSize:36, fontWeight:'900' },
  avatarEdit:         { position:'absolute', bottom:-4, right:-4, width:32, height:32, borderRadius:10, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.1, shadowRadius:4, elevation:3 },
  avatarEditText:     { fontSize:16 },
  avatarHint:         { fontSize:12, color:Colors.gray },
  formSection:        { gap:0 },
  sectionLabel:       { fontSize:11, fontWeight:'700', color:'#999', letterSpacing:1.5, marginBottom:10 },
  fieldGroup:         { backgroundColor:'white', borderRadius:18, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.05, shadowRadius:8, elevation:2 },
  fieldWrap:          { flexDirection:'row', alignItems:'center', padding:16, gap:12, borderWidth:1.5, borderColor:'transparent', borderRadius:18 },
  fieldFocused:       { borderColor:Colors.primary, backgroundColor:'#F0FDF4' },
  fieldIco:           { fontSize:22, width:28, textAlign:'center' },
  fieldContent:       { flex:1 },
  fieldLabel:         { fontSize:10, fontWeight:'700', color:'#aaa', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 },
  fieldInput:         { fontSize:15, color:Colors.dark, fontWeight:'500' },
  fieldInputReadOnly: { fontSize:15, color:'#aaa', fontWeight:'500' },
  fieldDivider:       { height:1, backgroundColor:'#f5f5f5', marginLeft:56 },
  noeditBadge:        { backgroundColor:'#f5f5f5', paddingHorizontal:8, paddingVertical:3, borderRadius:100 },
  noeditText:         { fontSize:9, fontWeight:'700', color:'#bbb' },
  ubicacionBtn:       { backgroundColor:Colors.greenLight, paddingHorizontal:12, paddingVertical:8, borderRadius:100, minWidth:80, alignItems:'center' },
  ubicacionBtnText:   { fontSize:11, fontWeight:'700', color:Colors.primary },
  ubicacionHint:      { fontSize:11, color:'#bbb', marginTop:8, paddingHorizontal:4 },
  previewMapWrap:     { height:160, borderRadius:16, overflow:'hidden', marginTop:10, position:'relative' },
  previewMapHint:     { position:'absolute', bottom:8, alignSelf:'center', backgroundColor:'rgba(0,0,0,.6)', color:'white', fontSize:10, fontWeight:'600', paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  bottomBar:          { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.cream, padding:16, paddingBottom:32 },
  guardarBtn:         { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center', shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.3, shadowRadius:10, elevation:5 },
  guardarBtnDisabled: { backgroundColor:'#ddd', shadowOpacity:0, elevation:0 },
  guardarBtnText:     { color:'white', fontSize:15, fontWeight:'700' },
  successToast:       { position:'absolute', bottom:100, alignSelf:'center', backgroundColor:'#1a1a1a', paddingHorizontal:20, paddingVertical:12, borderRadius:100 },
  successToastText:   { color:'white', fontSize:14, fontWeight:'700' },
})
