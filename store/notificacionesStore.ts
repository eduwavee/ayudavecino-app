import { create } from 'zustand'

interface Notificacion {
  id:      string
  titulo:  string
  cuerpo:  string
  tipo:    'pedido' | 'pago' | 'mensaje' | 'sistema'
  leida:   boolean
  fecha:   Date
  datos?:  any
}

interface NotifStore {
  notificaciones: Notificacion[]
  noLeidas:       number
  agregarNotif:   (n: Omit<Notificacion, 'id' | 'leida' | 'fecha'>) => void
  marcarLeidas:   () => void
  limpiarTodo:    () => void
}

export const useNotifStore = create<NotifStore>((set, get) => ({
  notificaciones: [],
  noLeidas: 0,

  agregarNotif: (n) => {
    const nueva: Notificacion = {
      ...n,
      id:    Date.now().toString(),
      leida: false,
      fecha: new Date(),
    }
    set(state => ({
      notificaciones: [nueva, ...state.notificaciones],
      noLeidas: state.noLeidas + 1,
    }))
  },

  marcarLeidas: () => set({ noLeidas: 0, notificaciones: get().notificaciones.map(n => ({ ...n, leida: true })) }),

  limpiarTodo: () => set({ notificaciones: [], noLeidas: 0 }),
}))
