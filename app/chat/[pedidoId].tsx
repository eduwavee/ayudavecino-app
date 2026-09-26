import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
  Dimensions, Image, Alert, ActivityIndicator, Linking
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors } from '../../constants/colors'
import { archivoUrl } from '../../constants/config'
import { useAuthStore } from '../../store/authStore'
import { chatService } from '../../services/chat.service'
import { pedidosService } from '../../services/pedidos.service'
import { FUENTES as F, DURACION, CURVA } from '../../constants/diseno'
import Reanimated, { FadeInDown } from 'react-native-reanimated'
import { haptica } from '../../utils/haptica'
import { PressScale } from '../../components/ui/PressScale'
import { usePlan } from '../../hooks/usePlan'
import { leerRespuestas } from '../../utils/respuestasRapidas'
import { Icono, NombreIcono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { FotoPerfil } from '../../components/ui/FotoPerfil'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTema, TemaTokens } from '../../store/temaStore'

// Entrada de un mensaje nuevo: sube corto y rápido (power3.out)
const ENTRADA_MENSAJE = FadeInDown.duration(DURACION.base).easing(CURVA.salida)

const { width } = Dimensions.get('window')

type ChipRespuesta = { icono: NombreIcono; txt: string; propia?: boolean; gestionar?: boolean }

// Cada rol tiene sus frases: antes el proveedor veía "¿A qué hora llegás?" y
// "Te mando la dirección", que son preguntas del cliente
const QUICK_REPLIES: ChipRespuesta[] = [
  { icono:'thumbs-up-outline',  txt:'Perfecto' },
  { icono:'time-outline',       txt:'¿A qué hora llegás?' },
  { icono:'heart-outline',      txt:'Muchas gracias' },
  { icono:'hourglass-outline',  txt:'¿Cuánto tardás?' },
  { icono:'location-outline',   txt:'Te mando la dirección' },
]

const QUICK_REPLIES_PROVEEDOR: ChipRespuesta[] = [
  { icono:'thumbs-up-outline',  txt:'Perfecto' },
  { icono:'car-outline',        txt:'Voy en camino' },
  { icono:'time-outline',       txt:'Llego en 15 minutos' },
  { icono:'camera-outline',     txt:'¿Me mandás una foto del problema?' },
  { icono:'location-outline',   txt:'¿Me pasás la dirección?' },
  { icono:'heart-outline',      txt:'Muchas gracias' },
]

export default function ChatScreen() {
  const router  = useRouter()
  const tema    = useTema()
  const styles  = getStyles(tema)
  // La barra de escritura no queda tapada por la navegación del sistema (3 botones)
  const insets  = useSafeAreaInsets()
  const usuario = useAuthStore(s => s.usuario)
  const { pedidoId, nombreContraparte, servicioNombre } = useLocalSearchParams<any>()

  const [mensajes, setMensajes]       = useState<any[]>([])
  const [texto, setTexto]             = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [conectado, setConectado]     = useState(false)
  const [inputAlto, setInputAlto]     = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [misRespuestas, setMisRespuestas] = useState<string[]>([])
  // Foto de la otra persona (encabezado, mensajes y "escribiendo"): viene del detalle del pedido
  const [avatarContraparte, setAvatarContraparte] = useState<string | null>(null)

  useEffect(() => {
    pedidosService.obtenerPedido(pedidoId)
      .then((p: any) => {
        const otra = p.clienteId === usuario?.id ? p.proveedor : p.cliente
        setAvatarContraparte(otra?.avatar ?? null)
      })
      .catch(() => {})
  }, [pedidoId, usuario?.id])
  const { esPremium } = usePlan()
  const esProveedor = usuario?.rol === 'PROVEEDOR'

  // Respuestas rápidas propias (proveedor Premium). Se recargan al volver de la
  // pantalla donde se editan.
  useFocusEffect(useCallback(() => {
    if (esProveedor && esPremium && usuario?.id) leerRespuestas(usuario.id).then(setMisRespuestas)
  }, [esProveedor, esPremium, usuario?.id]))

  const chipsRespuestas: ChipRespuesta[] = esProveedor
    ? [
        esPremium
          ? { icono: 'create-outline' as NombreIcono, txt: 'Mis respuestas', gestionar: true }
          : { icono: 'lock-closed-outline' as NombreIcono, txt: 'Tus respuestas', gestionar: true },
        ...(esPremium ? misRespuestas.map(txt => ({ icono: 'star' as NombreIcono, txt, propia: true })) : []),
        ...QUICK_REPLIES_PROVEEDOR,
      ]
    : QUICK_REPLIES

  const flatListRef   = useRef<FlatList>(null)
  const inputRef      = useRef<TextInput>(null)
  const typingTimeout = useRef<any>(null)
  const leidoTimeout  = useRef<any>(null)
  const fadeAnim      = useRef(new Animated.Value(0)).current
  const slideAnim     = useRef(new Animated.Value(20)).current
  const typingAnim    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    iniciarChat()
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start()
    return () => {
      chatService.salirDelChat()
      clearTimeout(leidoTimeout.current)
    }
  }, [])

  useEffect(() => {
    if (escribiendo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue:1, duration:600, useNativeDriver:true }),
          Animated.timing(typingAnim, { toValue:0, duration:600, useNativeDriver:true }),
        ])
      ).start()
    } else {
      typingAnim.stopAnimation()
      typingAnim.setValue(0)
    }
  }, [escribiendo])

  async function iniciarChat() {
    try {
      console.log('Cargando historial del pedido:', pedidoId)
      const historial = await pedidosService.obtenerMensajes(pedidoId)
      console.log('Historial recibido:', historial?.length ?? 0, 'mensajes')
      setMensajes(historial ?? [])
    } catch (err: any) {
      console.log('Error cargando historial:', err?.response?.status, err?.response?.data ?? err?.message)
      // Si falla la carga del historial, el chat sigue funcionando en vivo igual
    } finally {
      setCargandoHistorial(false)
    }

    const socket = await chatService.conectar()
    if (!socket) return
    setConectado(true)
    chatService.unirsePedido(pedidoId)
    marcarLeidoDebounced() // lo que ya estaba sin leer, se marca al entrar al chat

    chatService.onMensajeNuevo((msg) => {
      setMensajes(prev => [...prev, msg])
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated:true }), 100)
      // Si el mensaje es de la otra persona y estás viendo el chat, se marca leído
      // (debounced: si llega una ráfaga de mensajes, se manda un solo marcar_leido)
      if (msg.autorId !== usuario?.id) marcarLeidoDebounced()
    })
    chatService.onUsuarioEscribiendo((data) => {
      if (data.usuarioId !== usuario?.id) setEscribiendo(true)
    })
    chatService.onUsuarioDejoEscribir(() => setEscribiendo(false))
    chatService.onMensajesLeidos((data) => {
      if (data.pedidoId !== pedidoId) return
      setMensajes(prev => prev.map(m => m.autorId === usuario?.id ? { ...m, leido: true } : m))
    })
  }

  function marcarLeidoDebounced() {
    clearTimeout(leidoTimeout.current)
    leidoTimeout.current = setTimeout(() => chatService.marcarLeido(pedidoId), 400)
  }

  async function llamarContraparte() {
    try {
      const pedido = await pedidosService.obtenerPedido(pedidoId)
      const contraparte = pedido.clienteId === usuario?.id ? pedido.proveedor : pedido.cliente
      if (!contraparte?.telefono) {
        return Alert.alert('Sin teléfono', `${contraparte?.nombre ?? 'Tu contacto'} todavía no cargó un número de teléfono.`)
      }
      await Linking.openURL(`tel:${contraparte.telefono}`)
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la llamada')
    }
  }

  async function handleAdjuntarImagen() {
    if (!conectado) {
      Alert.alert('Sin conexión', 'Esperá a que se reconecte el chat para mandar fotos')
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Activá el permiso de galería para mandar una foto')
      return
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (resultado.canceled || !resultado.assets?.[0]) return

    setSubiendoImagen(true)
    try {
      await pedidosService.enviarImagenChat(pedidoId, resultado.assets[0].uri)
      // El mensaje llega solo por el socket (el servidor lo emite a la sala del pedido)
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo mandar la foto')
    } finally {
      setSubiendoImagen(false)
    }
  }

  function handleTexto(val: string) {
    setTexto(val)
    setInputAlto(val.length > 40)
    if (!val) return
    chatService.escribiendo(pedidoId, usuario?.nombre ?? '')
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => chatService.dejoEscribir(pedidoId), 1500)
  }

  function enviar(msg?: string) {
    const txt = (msg ?? texto).trim()
    if (!txt || !conectado) return
    chatService.enviarMensaje(pedidoId, txt, usuario?.nombre ?? '')
    haptica.toque()
    setTexto('')
    setInputAlto(false)
    chatService.dejoEscribir(pedidoId)
  }

  const esMio = (msg: any) => msg.autorId === usuario?.id
  // Solo se animan los mensajes que llegan con el chat abierto; el historial aparece quieto
  const abiertoEn = useRef(Date.now()).current
  const esNuevo = (msg: any) => new Date(msg.fecha).getTime() > abiertoEn

  function agruparFecha(fecha: string) {
    const d = new Date(fecha)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    return d.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })
  }

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <PressScale accessibilityLabel="Volver" hitSlop={10} style={styles.backBtn} onPress={() => router.back()}>
          <Icono nombre="chevron-back" tamano={26} color={tema.texto} />
        </PressScale>

        <View style={styles.headerCenter}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <FotoPerfil ruta={avatarContraparte} nombre={nombreContraparte} radio={21} estiloTexto={styles.avatarText} />
            </View>
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerNombre} numberOfLines={1}>{nombreContraparte}</Text>
            <Text style={styles.headerStatus}>
              {/* `conectado` es la conexión propia al chat, no la presencia de la otra persona:
                  antes decía "En línea" aunque el otro no tuviera la app abierta */}
              {escribiendo ? 'escribiendo...' : conectado ? 'Mensajes en tiempo real' : 'Reconectando…'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerAction} onPress={llamarContraparte} accessibilityRole="button" accessibilityLabel={`Llamar a ${nombreContraparte ?? 'tu contacto'}`} hitSlop={10}>
          <Icono nombre="call-outline" tamano={19} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── PEDIDO CHIP ── */}
      <View style={styles.pedidoChip}>
        <View style={styles.pedidoChipLeft}>
          <Icono nombre="receipt-outline" tamano={16} color={Colors.primary} />
          <Text style={styles.pedidoChipText} numberOfLines={1}>{servicioNombre}</Text>
        </View>
        <View style={styles.pedidoChipBadge}>
          <Text style={styles.pedidoChipId}>#{pedidoId?.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      {/* ── MENSAJES ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.flex, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
          <FlatList
            ref={flatListRef}
            data={mensajes}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated:true })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <View style={styles.emptyChatBubble}>
                  <View style={styles.emptyChatIco}>
                    <Icono nombre="chatbubbles-outline" tamano={30} color={Colors.primary} />
                  </View>
                  <Text style={styles.emptyChatTitle}>
                    {cargandoHistorial ? 'Cargando...' : conectado ? 'Iniciá la conversación' : 'Conectando...'}
                  </Text>
                  <Text style={styles.emptyChatSub}>
                    {cargandoHistorial
                      ? 'Buscando mensajes anteriores...'
                      : conectado
                      ? `Chateá con ${nombreContraparte} sobre tu pedido`
                      : 'Estableciendo conexión en tiempo real...'
                    }
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item: msg, index }) => {
              const mio      = esMio(msg)
              const anterior = mensajes[index - 1]
              const mismoAutor = anterior && anterior.autorId === msg.autorId
              const mostrarFecha = !anterior ||
                agruparFecha(anterior.fecha) !== agruparFecha(msg.fecha)

              return (
                <>
                  {mostrarFecha && (
                    <View style={styles.fechaSep}>
                      <View style={styles.fechaLine} />
                      <Text style={styles.fechaText}>{agruparFecha(msg.fecha)}</Text>
                      <View style={styles.fechaLine} />
                    </View>
                  )}
                  <Reanimated.View
                    entering={esNuevo(msg) ? ENTRADA_MENSAJE : undefined}
                    style={[
                      styles.msgRow,
                      mio ? styles.msgRowMio : styles.msgRowEllos,
                      mismoAutor && { marginTop:2 }
                    ]}
                  >
                    {!mio && !mismoAutor && (
                      <View style={styles.msgAvatar}>
                        <FotoPerfil ruta={avatarContraparte} nombre={msg.autorNombre} radio={14} estiloTexto={styles.msgAvatarText} />
                      </View>
                    )}
                    {!mio && mismoAutor && <View style={styles.msgAvatarSpacer} />}

                    <View style={[
                      styles.bubble,
                      mio ? styles.bubbleMio : styles.bubbleEllos,
                      mismoAutor && (mio ? styles.bubbleMioGroup : styles.bubbleEllosGroup)
                    ]}>
                      {!mio && !mismoAutor && (
                        <Text style={styles.bubbleAutor}>{msg.autorNombre}</Text>
                      )}
                      {msg.imagen && (
                        // El spinner queda detrás: mientras la foto baja se ve la carga y no
                        // un bloque liso del color de la burbuja
                        <View style={styles.bubbleImagenWrap}>
                          <ActivityIndicator color={mio ? 'white' : Colors.primary} />
                          <Image source={{ uri: archivoUrl(msg.imagen)! }} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                        </View>
                      )}
                      {!!msg.texto && (
                        <Text style={[styles.bubbleText, mio && styles.bubbleTextMio]}>
                          {msg.texto}
                        </Text>
                      )}
                      <View style={styles.bubbleMeta}>
                        <Text style={[styles.bubbleHora, mio && styles.bubbleHoraMio]}>
                          {new Date(msg.fecha).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
                        </Text>
                        {mio && (
                          <Icono
                            nombre={msg.leido ? 'checkmark-done' : 'checkmark'}
                            tamano={14}
                            color={msg.leido ? '#8ED6FF' : 'rgba(255,255,255,.7)'}
                          />
                        )}
                      </View>
                    </View>
                  </Reanimated.View>
                </>
              )
            }}
          />

          {/* Typing indicator */}
          {escribiendo && (
            <Animated.View style={[styles.typingRow, { opacity: fadeAnim }]}>
              <View style={styles.typingAvatar}>
                <FotoPerfil ruta={avatarContraparte} nombre={nombreContraparte} radio={14} estiloTexto={styles.typingAvatarText} />
              </View>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <Animated.View style={[styles.dot, { opacity: typingAnim }]} />
                  <Animated.View style={[styles.dot, { opacity: typingAnim, marginLeft:4 }]} />
                  <Animated.View style={[styles.dot, { opacity: typingAnim, marginLeft:4 }]} />
                </View>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── QUICK REPLIES ── */}
        <FlatList
          data={chipsRespuestas}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => (i.propia ? 'propia:' : i.gestionar ? 'gestionar:' : '') + i.txt}
          style={styles.quickList}
          contentContainerStyle={styles.quickContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.quickBtn, item.propia && styles.quickBtnPropia, item.gestionar && styles.quickBtnGestionar]}
              onPress={() => {
                if (item.gestionar) router.push('/respuestas-rapidas')
                else enviar(item.txt)
              }}
              activeOpacity={.7}
            >
              <Icono nombre={item.icono} tamano={14} color={item.propia || item.gestionar ? tema.dorado : Colors.primary} />
              <Text style={styles.quickTxt}>{item.txt}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── INPUT ── */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom + 8, 28) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAdjuntarImagen} disabled={subiendoImagen} accessibilityRole="button" accessibilityLabel="Adjuntar una foto" hitSlop={8}>
            {subiendoImagen
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Icono nombre="attach" tamano={21} color={tema.texto} />}
          </TouchableOpacity>

          <View style={[styles.inputWrap, inputAlto && styles.inputWrapTall]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Mensaje..."
              placeholderTextColor={tema.subTexto}
              value={texto}
              onChangeText={handleTexto}
              multiline
              maxLength={500}
            />
          </View>

          {texto.trim() ? (
            <PressScale haptico style={styles.sendBtn} onPress={() => enviar()} accessibilityLabel="Enviar mensaje">
              <Icono nombre="send" tamano={18} color="white" style={{ marginLeft: 2 }} />
            </PressScale>
          ) : (
            // Abre el teclado; el selector de emojis es el del teclado del telefono
            <TouchableOpacity style={styles.emojiBtn} onPress={() => inputRef.current?.focus()} accessibilityRole="button" accessibilityLabel="Abrir el teclado para escribir">
              <Icono nombre="happy-outline" tamano={22} color={tema.texto} />
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
      <FondoBarraEstado color={tema.card} />
    </View>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  // Fondo del chat: beige en claro (se distingue de las burbujas blancas), el fondo del tema en oscuro
  container:         { flex:1, backgroundColor:tema.esOscuro ? tema.bg : '#F0EDE8' },
  flex:              { flex:1 },

  // Header
  header:            { backgroundColor:tema.card, flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingTop:52, paddingBottom:12, shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:4 },
  backBtn:           { width:36, height:36, alignItems:'center', justifyContent:'center', marginRight:4 },
  backIco:           { fontSize:30, color:tema.texto, fontFamily: F.regular, lineHeight:36 },
  headerCenter:      { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  avatarWrap:        { position:'relative' },
  avatar:            { width:42, height:42, borderRadius:21, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarText:        { color:'white', fontSize:17, fontFamily: F.extrabold },
  onlineDot:         { position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:6, backgroundColor:'#2ecc71', borderWidth:2, borderColor:tema.card },
  headerTexts:       { flex:1 },
  headerNombre:      { fontSize:16, fontFamily: F.extrabold, color:tema.texto },
  headerStatus:      { fontSize:11, color:Colors.primary, fontFamily: F.medium, marginTop:1 },
  headerAction:      { width:38, height:38, borderRadius:19, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center' },
  headerActionIco:   { fontFamily: F.regular, fontSize:18 },

  // Pedido chip
  pedidoChip:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:tema.card, marginHorizontal:16, marginVertical:8, borderRadius:14, padding:10, paddingHorizontal:14, shadowColor:tema.sombra, shadowOffset:{width:0,height:1}, shadowOpacity:.04, shadowRadius:4, elevation:1 },
  pedidoChipLeft:    { flexDirection:'row', alignItems:'center', gap:8, flex:1 },
  pedidoChipIco:     { fontFamily: F.regular, fontSize:16 },
  pedidoChipText:    { fontSize:13, fontFamily: F.semibold, color:tema.texto, flex:1 },
  pedidoChipBadge:   { backgroundColor:tema.bg, paddingHorizontal:10, paddingVertical:3, borderRadius:100 },
  pedidoChipId:      { fontSize:10, fontFamily: F.extrabold, color:tema.subTexto, fontVariant:['tabular-nums'] },

  // Mensajes
  messagesList:      { padding:16, paddingBottom:8, gap:2 },
  emptyChat:         { alignItems:'center', paddingTop:40, paddingHorizontal:32 },
  emptyChatBubble:   { backgroundColor:tema.card, borderRadius:20, padding:24, alignItems:'center', shadowColor:tema.sombra, shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  emptyChatIco:      { width:60, height:60, borderRadius:20, backgroundColor:'rgba(26,158,92,.1)', alignItems:'center', justifyContent:'center', marginBottom:12 },
  emptyChatTitle:    { fontSize:16, fontFamily: F.extrabold, color:tema.texto, marginBottom:6, textAlign:'center' },
  emptyChatSub:      { fontFamily: F.regular, fontSize:13, color:tema.subTexto, textAlign:'center', lineHeight:19 },

  // Fecha separador
  fechaSep:          { flexDirection:'row', alignItems:'center', gap:10, marginVertical:16 },
  fechaLine:         { flex:1, height:1, backgroundColor:tema.overlay },
  fechaText:         { fontSize:11, color:tema.subTexto, fontFamily: F.semibold, backgroundColor:tema.esOscuro ? tema.bg : '#F0EDE8', paddingHorizontal:4 },

  // Rows de mensajes
  msgRow:            { flexDirection:'row', alignItems:'flex-end', gap:6, marginBottom:2 },
  msgRowMio:         { justifyContent:'flex-end' },
  msgRowEllos:       { justifyContent:'flex-start' },
  msgAvatar:         { width:28, height:28, borderRadius:14, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 },
  msgAvatarText:     { color:'white', fontSize:11, fontFamily: F.extrabold },
  msgAvatarSpacer:   { width:28, flexShrink:0 },

  // Burbujas
  bubble:            { maxWidth:width*0.72, borderRadius:20, paddingHorizontal:14, paddingVertical:10, paddingBottom:6 },
  bubbleMio:         { backgroundColor:Colors.primary, borderBottomRightRadius:4 },
  bubbleEllos:       { backgroundColor:tema.card, borderBottomLeftRadius:4, shadowColor:tema.sombra, shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:4, elevation:1 },
  bubbleMioGroup:    { borderBottomRightRadius:20, borderTopRightRadius:4 },
  bubbleEllosGroup:  { borderBottomLeftRadius:20, borderTopLeftRadius:4 },
  bubbleAutor:       { fontSize:10, fontFamily: F.extrabold, color:Colors.primaryLight, marginBottom:3 },
  bubbleText:        { fontFamily: F.regular, fontSize:15, color:tema.texto, lineHeight:21 },
  bubbleTextMio:     { color:'white' },
  bubbleMeta:        { flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:3 },
  bubbleHora:        { fontFamily: F.regular, fontSize:10, color:tema.esOscuro ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)' },
  bubbleHoraMio:     { color:'rgba(255,255,255,.6)' },
  bubbleTick:        { fontFamily: F.regular, fontSize:10, color:'rgba(255,255,255,.7)' },
  bubbleTickLeido:   { color:'#8ED6FF' },
  bubbleImagenWrap:  { width:200, height:200, borderRadius:14, marginBottom:4, alignItems:'center', justifyContent:'center', backgroundColor:tema.overlay },

  // Typing
  typingRow:         { flexDirection:'row', alignItems:'flex-end', gap:6, paddingHorizontal:16, paddingBottom:8 },
  typingAvatar:      { width:28, height:28, borderRadius:14, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  typingAvatarText:  { color:'white', fontSize:11, fontFamily: F.extrabold },
  typingBubble:      { backgroundColor:tema.card, borderRadius:18, borderBottomLeftRadius:4, paddingHorizontal:14, paddingVertical:12, shadowColor:tema.sombra, shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:4, elevation:1 },
  typingDots:        { flexDirection:'row', alignItems:'center' },
  dot:               { width:7, height:7, borderRadius:4, backgroundColor:Colors.gray },

  // Quick replies
  // flexGrow 0 en vez de una altura fija: con maxHeight 44 se cortaban las letras con cola (q, g)
  quickList:         { flexGrow:0, backgroundColor:tema.card, borderTopWidth:1, borderTopColor:tema.border },
  quickContent:      { paddingHorizontal:14, gap:8, alignItems:'center', paddingVertical:8 },
  quickBtn:          { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:6, borderRadius:100, backgroundColor:tema.bg, borderWidth:1, borderColor:tema.border },
  quickBtnPropia:    { backgroundColor:'rgba(255,210,63,.15)', borderColor:'rgba(212,160,23,.35)' },
  quickBtnGestionar: { backgroundColor:tema.card, borderStyle:'dashed', borderColor:'#D4A017' },
  quickIco:          { fontFamily: F.regular, fontSize:13 },
  quickTxt:          { fontSize:12, fontFamily: F.semibold, color:tema.texto },

  // Input
  inputArea:         { flexDirection:'row', alignItems:'flex-end', gap:8, paddingHorizontal:14, paddingVertical:10, paddingBottom:28, backgroundColor:tema.card, borderTopWidth:1, borderTopColor:tema.border },
  attachBtn:         { width:38, height:38, borderRadius:19, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center', flexShrink:0 },
  attachIco:         { fontFamily: F.regular, fontSize:18 },
  inputWrap:         { flex:1, backgroundColor:tema.bg, borderRadius:22, paddingHorizontal:16, paddingVertical:10, minHeight:42, maxHeight:100, justifyContent:'center', borderWidth:1, borderColor:tema.border },
  inputWrapTall:     { paddingVertical:12 },
  input:             { fontFamily: F.regular, fontSize:15, color:tema.texto, maxHeight:80, lineHeight:20 },
  sendBtn:           { width:42, height:42, borderRadius:21, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', flexShrink:0, shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.35, shadowRadius:8, elevation:5 },
  sendIco:           { color:'white', fontSize:17, fontFamily: F.extrabold, marginLeft:2 },
  emojiBtn:          { width:42, height:42, borderRadius:21, backgroundColor:tema.bg, alignItems:'center', justifyContent:'center', flexShrink:0 },
  emojiIco:          { fontFamily: F.regular, fontSize:22 },
})
