import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://192.168.1.37:3000/api'

export const pedidosService = {
  async misPedidos() {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.get(`${API_URL}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.pedidos
  },

  async obtenerPedido(id: string) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.get(`${API_URL}/pedidos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.pedido
  },

  async crearPedido(datos: { servicioId: string; fecha: string; descripcion?: string }) {
    const token = await AsyncStorage.getItem('token')
    console.log('POST pedido:', datos)
    const response = await axios.post(`${API_URL}/pedidos`, datos, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    console.log('Pedido creado:', response.data)
    return response.data.pedido
  },

  async cambiarEstado(id: string, estado: string) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.patch(`${API_URL}/pedidos/${id}/estado`, { estado }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    return response.data.pedido
  },
}
