import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../constants/config'

export const authService = {
  async registro(email: string, username: string, password: string, confirmarPassword: string, rol: string) {
    const response = await axios.post(API_URL + '/auth/registro',
      { email, username, password, confirmarPassword, rol },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    )
    await AsyncStorage.setItem('token', response.data.token)
    return response.data
  },

  // El rol viaja al backend: una cuenta de proveedor no entra como cliente ni al reves
  async login(username: string, password: string, rol: string) {
    const response = await axios.post(API_URL + '/auth/login',
      { username, password, rol },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    )
    await AsyncStorage.setItem('token', response.data.token)
    return response.data
  },

  // Recuperar contraseña: 1) pide un código por email, 2) lo usa para poner una nueva
  async solicitarRecuperacion(email: string) {
    await axios.post(API_URL + '/auth/recuperar', { email }, { timeout: 10000 })
  },

  async restablecerPassword(email: string, codigo: string, password: string, confirmarPassword: string) {
    await axios.post(API_URL + '/auth/restablecer', { email, codigo, password, confirmarPassword }, { timeout: 10000 })
  },

  async logout() {
    await AsyncStorage.removeItem('token')
  },

  async getToken() {
    return AsyncStorage.getItem('token')
  },

  // Decodifica el payload de un JWT (sin validar la firma, solo para leer id/rol localmente)
  decodificarToken(token: string): { id: string; rol: string; exp: number } | null {
    try {
      const payload = token.split('.')[1]
      const json = base64UrlDecode(payload)
      return JSON.parse(json)
    } catch {
      return null
    }
  },
}

// Decodificador base64 (con variante URL-safe) autocontenido, sin depender de atob/Buffer
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64UrlDecode(input: string): string {
  const normalizado = input.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '')
  let bytes: number[] = []
  let buffer = 0
  let bits = 0

  for (const char of normalizado) {
    const val = BASE64_CHARS.indexOf(char)
    if (val === -1) continue
    buffer = (buffer << 6) | val
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }

  // Los payloads de JWT son JSON en UTF-8; decodificamos los bytes a texto.
  return decodeURIComponent(bytes.map(b => '%' + b.toString(16).padStart(2, '0')).join(''))
}
