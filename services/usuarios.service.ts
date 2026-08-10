import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://192.168.1.37:3000/api'

export const usuariosService = {
  async obtenerPerfil(id: string) {
    const token = await AsyncStorage.getItem('token')
    console.log('GET perfil:', id)
    const response = await axios.get(`${API_URL}/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('Perfil recibido:', response.data.usuario?.nombre)
    return response.data.usuario
  },

  async listarProveedores(categoria?: string) {
    const token = await AsyncStorage.getItem('token')
    const url = categoria
      ? `${API_URL}/usuarios/proveedores?categoria=${categoria}`
      : `${API_URL}/usuarios/proveedores`
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.proveedores
  },

  async editarPerfil(id: string, datos: { nombre?: string; telefono?: string; latitud?: number; longitud?: number }) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.put(`${API_URL}/usuarios/${id}`, datos, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    return response.data.usuario
  },
}
