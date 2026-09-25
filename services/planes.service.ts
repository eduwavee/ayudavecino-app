import api from './api'
import type { Periodo } from '../constants/planes'
import type { Plan, Usuario } from '../store/authStore'

// Planes de pago. El cobro pasa por la misma pasarela que los pedidos (hoy simulada).
export const planesService = {
  async suscribir(plan: Plan, periodo: Periodo): Promise<Usuario> {
    const response = await api.post('/planes/suscribir', { plan, periodo })
    return response.data.usuario
  },

  async cancelar(): Promise<Usuario> {
    const response = await api.post('/planes/cancelar')
    return response.data.usuario
  },

  // Proveedores Pro (resumen del mes) y Premium (6 meses)
  async estadisticas() {
    const response = await api.get('/planes/estadisticas')
    return response.data.estadisticas
  },
}
