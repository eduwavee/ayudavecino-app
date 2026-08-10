import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../constants/config'

export const resenasService = {
  async obtenerDeProveedor(proveedorId: string) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.get(`${API_URL}/resenas/${proveedorId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return response.data as { resenas: any[]; promedio: string; total: number }
  },
}
