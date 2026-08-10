import { io, Socket } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SOCKET_URL = 'http://192.168.1.37:3000'

class ChatService {
  private socket: Socket | null = null
  private pedidoActual: string | null = null

  async conectar() {
    if (this.socket?.connected) return this.socket

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
      if (this.pedidoActual) {
        this.socket?.emit('unirse_pedido', this.pedidoActual)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.log('Error conexion:', err.message)
    })

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
    this.socket?.off('mensaje_nuevo')
    this.socket?.on('mensaje_nuevo', callback)
  }

  onUsuarioEscribiendo(callback: (data: any) => void) {
    this.socket?.off('usuario_escribiendo')
    this.socket?.on('usuario_escribiendo', callback)
  }

  onUsuarioDejoEscribir(callback: (data: any) => void) {
    this.socket?.off('usuario_dejo_escribir')
    this.socket?.on('usuario_dejo_escribir', callback)
  }

  removerListeners() {
    this.socket?.off('mensaje_nuevo')
    this.socket?.off('usuario_escribiendo')
    this.socket?.off('usuario_dejo_escribir')
  }

  estaConectado() {
    return this.socket?.connected ?? false
  }
}

export const chatService = new ChatService()
