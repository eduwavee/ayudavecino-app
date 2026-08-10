import { useState, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
  Dimensions, StatusBar
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { chatService } from '../../services/chat.service'
import { pedidosService } from '../../services/pedidos.service'

const { width } = Dimensions.get('window')

const QUICK_REPLIES = [
  { ico:'👍', txt:'Perfecto' },
  { ico:'🕐', txt:'¿A qué hora llegás?' },
  { ico:'🙏', txt:'Muchas gracias' },
  { ico:'⏱️', txt:'¿Cuánto tardás?' },
  { ico:'📍', txt:'Te mando la dirección' },
]

export default function ChatScreen() {
  const router  = useRouter()
  const usuario = useAuthStore(s => s.usuario)
  const { pedidoId, nombreContraparte, servicioNombre } = useLocalSearchParams<any>()

  const [mensajes, setMensajes]       = useState<any[]>([])
  const [texto, setTexto]             = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [conectado, setConectado]     = useState(false)
  const [inputAlto, setInputAlto]     = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)

  const flatListRef   = useRef<FlatList>(null)
  const typingTimeout = useRef<any>(null)
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

    chatService.onMensajeNuevo((msg) => {
      setMensajes(prev => [...prev, msg])
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated:true }), 100)
    })
    chatService.onUsuarioEscribiendo((data) => {
      if (data.usuarioId !== usuario?.id) setEscribiendo(true)
    })
    chatService.onUsuarioDejoEscribir(() => setEscribiendo(false))
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
    setTexto('')
    setInputAlto(false)
    chatService.dejoEscribir(pedidoId)
  }

  const esMio = (msg: any) => msg.autorId === usuario?.id

  function agruparFecha(fecha: string) {
    const d = new Date(fecha)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    return d.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIco}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nombreContraparte?.charAt(0).toUpperCase()}
              </Text>
            </View>
            {conectado && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerNombre} numberOfLines={1}>{nombreContraparte}</Text>
            <Text style={styles.headerStatus}>
              {escribiendo ? '✍️ escribiendo...' : conectado ? '● En línea' : '○ Desconectado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Text style={styles.headerActionIco}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* ── PEDIDO CHIP ── */}
      <View style={styles.pedidoChip}>
        <View style={styles.pedidoChipLeft}>
          <Text style={styles.pedidoChipIco}>🔧</Text>
          <Text style={styles.pedidoChipText} numberOfLines={1}>{servicioNombre}</Text>
        </View>
        <View style={styles.pedidoChipBadge}>
          <Text style={styles.pedidoChipId}>#{pedidoId?.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      {/* ── MENSAJES ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                  <Text style={styles.emptyChatIco}>💬</Text>
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
                  <View style={[
                    styles.msgRow,
                    mio ? styles.msgRowMio : styles.msgRowEllos,
                    mismoAutor && { marginTop:2 }
                  ]}>
                    {!mio && !mismoAutor && (
                      <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>
                          {msg.autorNombre?.charAt(0).toUpperCase()}
                        </Text>
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
                      <Text style={[styles.bubbleText, mio && styles.bubbleTextMio]}>
                        {msg.texto}
                      </Text>
                      <View style={styles.bubbleMeta}>
                        <Text style={[styles.bubbleHora, mio && styles.bubbleHoraMio]}>
                          {new Date(msg.fecha).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
                        </Text>
                        {mio && <Text style={styles.bubbleTick}>✓✓</Text>}
                      </View>
                    </View>
                  </View>
                </>
              )
            }}
          />

          {/* Typing indicator */}
          {escribiendo && (
            <Animated.View style={[styles.typingRow, { opacity: fadeAnim }]}>
              <View style={styles.typingAvatar}>
                <Text style={styles.typingAvatarText}>
                  {nombreContraparte?.charAt(0).toUpperCase()}
                </Text>
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
          data={QUICK_REPLIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.txt}
          style={styles.quickList}
          contentContainerStyle={styles.quickContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => enviar(item.ico + ' ' + item.txt)}
              activeOpacity={.7}
            >
              <Text style={styles.quickIco}>{item.ico}</Text>
              <Text style={styles.quickTxt}>{item.txt}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── INPUT ── */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIco}>📎</Text>
          </TouchableOpacity>

          <View style={[styles.inputWrap, inputAlto && styles.inputWrapTall]}>
            <TextInput
              style={styles.input}
              placeholder="Mensaje..."
              placeholderTextColor="#bbb"
              value={texto}
              onChangeText={handleTexto}
              multiline
              maxLength={500}
            />
          </View>

          {texto.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={() => enviar()} activeOpacity={.8}>
              <Text style={styles.sendIco}>➤</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.emojiBtn}>
              <Text style={styles.emojiIco}>😊</Text>
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:'#F0EDE8' },
  flex:              { flex:1 },

  // Header
  header:            { backgroundColor:'white', flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingTop:52, paddingBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:4 },
  backBtn:           { width:36, height:36, alignItems:'center', justifyContent:'center', marginRight:4 },
  backIco:           { fontSize:30, color:Colors.dark, fontWeight:'300', lineHeight:36 },
  headerCenter:      { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  avatarWrap:        { position:'relative' },
  avatar:            { width:42, height:42, borderRadius:21, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  avatarText:        { color:'white', fontSize:17, fontWeight:'900' },
  onlineDot:         { position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:6, backgroundColor:'#2ecc71', borderWidth:2, borderColor:'white' },
  headerTexts:       { flex:1 },
  headerNombre:      { fontSize:16, fontWeight:'800', color:Colors.dark },
  headerStatus:      { fontSize:11, color:Colors.primary, fontWeight:'500', marginTop:1 },
  headerAction:      { width:38, height:38, borderRadius:19, backgroundColor:Colors.cream, alignItems:'center', justifyContent:'center' },
  headerActionIco:   { fontSize:18 },

  // Pedido chip
  pedidoChip:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'white', marginHorizontal:16, marginVertical:8, borderRadius:14, padding:10, paddingHorizontal:14, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.04, shadowRadius:4, elevation:1 },
  pedidoChipLeft:    { flexDirection:'row', alignItems:'center', gap:8, flex:1 },
  pedidoChipIco:     { fontSize:16 },
  pedidoChipText:    { fontSize:13, fontWeight:'600', color:Colors.dark, flex:1 },
  pedidoChipBadge:   { backgroundColor:Colors.cream, paddingHorizontal:10, paddingVertical:3, borderRadius:100 },
  pedidoChipId:      { fontSize:10, fontWeight:'800', color:Colors.gray, fontVariant:['tabular-nums'] },

  // Mensajes
  messagesList:      { padding:16, paddingBottom:8, gap:2 },
  emptyChat:         { alignItems:'center', paddingTop:40, paddingHorizontal:32 },
  emptyChatBubble:   { backgroundColor:'white', borderRadius:20, padding:24, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:2 },
  emptyChatIco:      { fontSize:40, marginBottom:12 },
  emptyChatTitle:    { fontSize:16, fontWeight:'800', color:Colors.dark, marginBottom:6, textAlign:'center' },
  emptyChatSub:      { fontSize:13, color:Colors.gray, textAlign:'center', lineHeight:19 },

  // Fecha separador
  fechaSep:          { flexDirection:'row', alignItems:'center', gap:10, marginVertical:16 },
  fechaLine:         { flex:1, height:1, backgroundColor:'rgba(0,0,0,.08)' },
  fechaText:         { fontSize:11, color:'#aaa', fontWeight:'600', backgroundColor:'#F0EDE8', paddingHorizontal:4 },

  // Rows de mensajes
  msgRow:            { flexDirection:'row', alignItems:'flex-end', gap:6, marginBottom:2 },
  msgRowMio:         { justifyContent:'flex-end' },
  msgRowEllos:       { justifyContent:'flex-start' },
  msgAvatar:         { width:28, height:28, borderRadius:14, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 },
  msgAvatarText:     { color:'white', fontSize:11, fontWeight:'900' },
  msgAvatarSpacer:   { width:28, flexShrink:0 },

  // Burbujas
  bubble:            { maxWidth:width*0.72, borderRadius:20, paddingHorizontal:14, paddingVertical:10, paddingBottom:6 },
  bubbleMio:         { backgroundColor:Colors.primary, borderBottomRightRadius:4 },
  bubbleEllos:       { backgroundColor:'white', borderBottomLeftRadius:4, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:4, elevation:1 },
  bubbleMioGroup:    { borderBottomRightRadius:20, borderTopRightRadius:4 },
  bubbleEllosGroup:  { borderBottomLeftRadius:20, borderTopLeftRadius:4 },
  bubbleAutor:       { fontSize:10, fontWeight:'800', color:Colors.primaryLight, marginBottom:3 },
  bubbleText:        { fontSize:15, color:Colors.dark, lineHeight:21 },
  bubbleTextMio:     { color:'white' },
  bubbleMeta:        { flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:3 },
  bubbleHora:        { fontSize:10, color:'rgba(0,0,0,.35)' },
  bubbleHoraMio:     { color:'rgba(255,255,255,.6)' },
  bubbleTick:        { fontSize:10, color:'rgba(255,255,255,.7)' },

  // Typing
  typingRow:         { flexDirection:'row', alignItems:'flex-end', gap:6, paddingHorizontal:16, paddingBottom:8 },
  typingAvatar:      { width:28, height:28, borderRadius:14, backgroundColor:Colors.primaryLight, alignItems:'center', justifyContent:'center' },
  typingAvatarText:  { color:'white', fontSize:11, fontWeight:'900' },
  typingBubble:      { backgroundColor:'white', borderRadius:18, borderBottomLeftRadius:4, paddingHorizontal:14, paddingVertical:12, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:4, elevation:1 },
  typingDots:        { flexDirection:'row', alignItems:'center' },
  dot:               { width:7, height:7, borderRadius:4, backgroundColor:Colors.gray },

  // Quick replies
  quickList:         { maxHeight:44, backgroundColor:'white', borderTopWidth:1, borderTopColor:'#f0f0f0' },
  quickContent:      { paddingHorizontal:14, gap:8, alignItems:'center', paddingVertical:8 },
  quickBtn:          { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:6, borderRadius:100, backgroundColor:Colors.cream, borderWidth:1, borderColor:'#e8e8e8' },
  quickIco:          { fontSize:13 },
  quickTxt:          { fontSize:12, fontWeight:'600', color:Colors.dark },

  // Input
  inputArea:         { flexDirection:'row', alignItems:'flex-end', gap:8, paddingHorizontal:14, paddingVertical:10, paddingBottom:28, backgroundColor:'white', borderTopWidth:1, borderTopColor:'#f0f0f0' },
  attachBtn:         { width:38, height:38, borderRadius:19, backgroundColor:Colors.cream, alignItems:'center', justifyContent:'center', flexShrink:0 },
  attachIco:         { fontSize:18 },
  inputWrap:         { flex:1, backgroundColor:Colors.cream, borderRadius:22, paddingHorizontal:16, paddingVertical:10, minHeight:42, maxHeight:100, justifyContent:'center', borderWidth:1, borderColor:'#e8e8e8' },
  inputWrapTall:     { paddingVertical:12 },
  input:             { fontSize:15, color:Colors.dark, maxHeight:80, lineHeight:20 },
  sendBtn:           { width:42, height:42, borderRadius:21, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', flexShrink:0, shadowColor:Colors.primary, shadowOffset:{width:0,height:4}, shadowOpacity:.35, shadowRadius:8, elevation:5 },
  sendIco:           { color:'white', fontSize:17, fontWeight:'900', marginLeft:2 },
  emojiBtn:          { width:42, height:42, borderRadius:21, backgroundColor:Colors.cream, alignItems:'center', justifyContent:'center', flexShrink:0 },
  emojiIco:          { fontSize:22 },
})
