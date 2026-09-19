import api from './api'

// Proveedores favoritos del cliente
export const favoritosService = {
  async listar(): Promise<any[]> {
    const response = await api.get('/favoritos')
    return response.data.favoritos
  },

  async agregar(proveedorId: string) {
    await api.post(`/favoritos/${proveedorId}`)
  },

  async quitar(proveedorId: string) {
    await api.delete(`/favoritos/${proveedorId}`)
  },
}
