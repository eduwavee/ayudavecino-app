import { create } from 'zustand'
import api from '../services/api'

export interface Notificacion {
  id:        string
  titulo:    string
  cuerpo:    string
  tipo:      'pedido' | 'pago' | 'mensaje' | 'resena' | 'sistema'
  ruta:      string | null
  pedidoId:  string | null
  leida:     boolean
  creadoEn:  string
}

interface NotifStore {
  notificaciones: Notificacion[]
  noLeidas:       number
  cargar:         () => Promise<void>
  recibir:        (n: Notificacion) => void
  marcarLeida:    (id: string) => Promise<void>
  marcarTodas:    () => Promise<void>
  limpiar:        () => void
}

const contarNoLeidas = (lista: Notificacion[]) => lista.filter(n => !n.leida).length

// Notificaciones guardadas en el backend (/api/notificaciones). Las nuevas llegan
// por socket (evento notificacion_nueva) y se agregan con recibir().
export const useNotifStore = create<NotifStore>((set, get) => ({
  notificaciones: [],
  noLeidas: 0,

  cargar: async () => {
    try {
      const { data } = await api.get('/notificaciones')
      set({ notificaciones: data.notificaciones, noLeidas: data.noLeidas })
    } catch {
      // Sin conexion: se mantiene lo que ya habia
    }
  },

  // Una notificacion agrupada (mensajes del mismo chat) llega con el mismo id: se reemplaza y sube arriba
  recibir: (n) => {
    const lista = [n, ...get().notificaciones.filter(x => x.id !== n.id)]
    set({ notificaciones: lista, noLeidas: contarNoLeidas(lista) })
  },

  marcarLeida: async (id) => {
    const lista = get().notificaciones.map(n => (n.id === id ? { ...n, leida: true } : n))
    set({ notificaciones: lista, noLeidas: contarNoLeidas(lista) })
    try { await api.patch(`/notificaciones/${id}/leida`) } catch {}
  },

  marcarTodas: async () => {
    set({ notificaciones: get().notificaciones.map(n => ({ ...n, leida: true })), noLeidas: 0 })
    try { await api.patch('/notificaciones/leer-todas') } catch {}
  },

  limpiar: () => set({ notificaciones: [], noLeidas: 0 }),
}))
