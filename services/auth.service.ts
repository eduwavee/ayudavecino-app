import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://192.168.1.37:3000/api'

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
}
