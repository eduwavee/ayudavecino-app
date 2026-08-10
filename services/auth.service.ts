import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../constants/config'

export const authService = {
  async registro(nombre: string, email: string, password: string, rol: string) {
    console.log('=== REGISTRO ===')
    console.log('URL:', API_URL + '/auth/registro')
    console.log('Body:', { nombre, email, password, rol })
    
    try {
      const response = await axios.post(API_URL + '/auth/registro', 
        { nombre, email, password, rol },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      )
      console.log('RESPUESTA OK:', response.data)
      await AsyncStorage.setItem('token', response.data.token)
      return response.data
    } catch (err: any) {
      console.log('ERROR STATUS:', err.response?.status)
      console.log('ERROR DATA:', JSON.stringify(err.response?.data))
      console.log('ERROR MSG:', err.message)
      throw err
    }
  },

  async login(email: string, password: string) {
    const response = await axios.post(API_URL + '/auth/login',
      { email, password },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    )
    await AsyncStorage.setItem('token', response.data.token)
    return response.data
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
