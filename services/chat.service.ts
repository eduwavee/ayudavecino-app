import { io, Socket } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SOCKET_URL } from '../constants/config'

class ChatService {
  private socket: Socket | null = null
  private pedidoActual: string | null = null

  // Salas de pedidos a las que nos unimos "de fondo" (no el chat que tenés abierto,
  // sino todos tus pedidos activos) — se re-emiten en cada reconexión del socket.
  private salasActivas: Set<string> = new Set()

  // Conexión en curso: evita que dos llamadas a conectar() casi simultáneas
  // (ej. el layout global y una pantalla de chat abriéndose a la vez) creen
  // dos sockets distintos y uno quede huérfano.
  private conectando: Promise<Socket | null> | null = null

  // Listeners "de pantalla": uno solo a la vez, se pisa cada vez que un chat se abre
  private handlerMensaje: ((msg: any) => void) | null = null
  private handlerEscribiendo: ((data: any) => void) | null = null
  private handlerDejoEscribir: ((data: any) => void) | null = null

  // Listeners "globales": conviven con los de pantalla (ej. para notificar mensajes
  // de otros pedidos aunque no estés dentro de ese chat). No se pisan entre sí.
  private handlersGlobales: Set<(msg: any) => void> = new Set()

  async conectar(): Promise<Socket | null> {
    if (this.socket?.connected) return this.socket
    if (this.conectando) return this.conectando

    this.conectando = this.crearConexion()
    try {
      return await this.conectando
    } finally {
      this.conectando = null
    }
  }

  private async crearConexion(): Promise<Socket | null> {
    const token = await AsyncStorage.getItem('token')
    if (!token) return null

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    this.socket.on('connect', () => {
      console.log('Socket conectado:', this.socket?.id)
      // Reingresamos a todas las salas: el chat abierto y los pedidos activos de fondo
      if (this.pedidoActual) this.socket?.emit('unirse_pedido', this.pedidoActual)
      this.salasActivas.forEach(id => this.socket?.emit('unirse_pedido', id))
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.log('Error conexion:', err.message)
    })

    // Los listeners globales se re-atan a cada nuevo socket
    this.handlersGlobales.forEach(cb => this.socket?.on('mensaje_nuevo', cb))

    return this.socket
  }

  salirDelChat() {
    this.removerListeners()
    this.pedidoActual = null
  }

  desconectar() {
    this.socket?.disconnect()
    this.socket = null
    this.pedidoActual = null
    this.salasActivas.clear()
  }

  unirsePedido(pedidoId: string) {
    this.pedidoActual = pedidoId
    if (this.socket?.connected) {
      this.socket.emit('unirse_pedido', pedidoId)
      console.log('Unido a sala:', pedidoId)
    }
  }

  enviarMensaje(pedidoId: string, texto: string, autorNombre: string) {
    if (!this.socket?.connected) {
      console.log('Socket no conectado')
      return
    }
    console.log('Enviando mensaje:', texto)
    this.socket.emit('mensaje', { pedidoId, texto, autorNombre })
  }

  escribiendo(pedidoId: string, nombre: string) {
    this.socket?.emit('escribiendo', { pedidoId, nombre })
  }

  dejoEscribir(pedidoId: string) {
    this.socket?.emit('dejo_escribir', { pedidoId })
  }

  onMensajeNuevo(callback: (msg: any) => void) {
    if (this.handlerMensaje) this.socket?.off('mensaje_nuevo', this.handlerMensaje)
    this.handlerMensaje = callback
    this.socket?.on('mensaje_nuevo', callback)
  }

  onUsuarioEscribiendo(callback: (data: any) => void) {
    if (this.handlerEscribiendo) this.socket?.off('usuario_escribiendo', this.handlerEscribiendo)
    this.handlerEscribiendo = callback
    this.socket?.on('usuario_escribiendo', callback)
  }

  onUsuarioDejoEscribir(callback: (data: any) => void) {
    if (this.handlerDejoEscribir) this.socket?.off('usuario_dejo_escribir', this.handlerDejoEscribir)
    this.handlerDejoEscribir = callback
    this.socket?.on('usuario_dejo_escribir', callback)
  }

  removerListeners() {
    if (this.handlerMensaje)     this.socket?.off('mensaje_nuevo', this.handlerMensaje)
    if (this.handlerEscribiendo) this.socket?.off('usuario_escribiendo', this.handlerEscribiendo)
    if (this.handlerDejoEscribir) this.socket?.off('usuario_dejo_escribir', this.handlerDejoEscribir)
    this.handlerMensaje = null
    this.handlerEscribiendo = null
    this.handlerDejoEscribir = null
  }

  // ── Escucha global de mensajes, para notificar sin importar qué pantalla esté abierta ──
  escucharMensajesGlobal(callback: (msg: any) => void) {
    this.handlersGlobales.add(callback)
    this.socket?.on('mensaje_nuevo', callback)
    return () => {
      this.handlersGlobales.delete(callback)
      this.socket?.off('mensaje_nuevo', callback)
    }
  }

  unirseAVariosPedidos(pedidoIds: string[]) {
    pedidoIds.forEach(id => this.salasActivas.add(id))
    if (!this.socket?.connected) return
    pedidoIds.forEach(id => this.socket?.emit('unirse_pedido', id))
  }

  getPedidoActual() {
    return this.pedidoActual
  }

  estaConectado() {
    return this.socket?.connected ?? false
  }
}

export const chatService = new ChatService()
