import api from './api'

export interface Estadisticas {
  vecinos:       number
  profesionales: number
  satisfaccion:  number | null   // % de reseñas de 4-5 estrellas; null si no hay reseñas
}

export const estadisticasService = {
  async obtener(): Promise<Estadisticas> {
    const response = await api.get('/estadisticas')
    return response.data.estadisticas
  },
}
