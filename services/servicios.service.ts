import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../constants/config'
import { armarFormDataImagen } from '../utils/imagenFormData'

export const serviciosService = {
  async listarTodos(filtros?: { categoria?: string }) {
    const token = await AsyncStorage.getItem('token')
    let url = API_URL + '/servicios'
    if (filtros?.categoria) url += `?categoria=${filtros.categoria}`

    console.log('GET servicios:', url)
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('Servicios recibidos:', response.data.servicios?.length)
    return response.data.servicios
  },

  async obtenerServicio(id: string) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.get(`${API_URL}/servicios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.servicio
  },

  async serviciosDeProveedor(proveedorId: string) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.get(`${API_URL}/servicios/proveedor/${proveedorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.servicios
  },

  async crearServicio(datos: {
    nombre: string; descripcion: string; precio: number; categoria: string
  }) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.post(`${API_URL}/servicios`, datos, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    return response.data.servicio
  },

  async editarServicio(id: string, datos: {
    nombre: string; descripcion: string; precio: number; categoria: string
  }) {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.put(`${API_URL}/servicios/${id}`, datos, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    return response.data.servicio
  },

  // Fotos del servicio (max 6). Devuelven la lista actualizada de rutas.
  async subirFoto(id: string, imagenUri: string): Promise<string[]> {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.post(`${API_URL}/servicios/${id}/fotos`, armarFormDataImagen('foto', imagenUri), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    })
    return response.data.servicio.fotos
  },

  async eliminarFoto(id: string, indice: number): Promise<string[]> {
    const token = await AsyncStorage.getItem('token')
    const response = await axios.delete(`${API_URL}/servicios/${id}/fotos/${indice}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.servicio.fotos
  },
}
