import { create } from 'zustand'

export type Rol  = 'CLIENTE' | 'PROVEEDOR'
// PRO es solo de proveedores y PLUS solo de clientes; PREMIUM existe para los dos
export type Plan = 'GRATIS' | 'PRO' | 'PLUS' | 'PREMIUM'

export interface Usuario {
  id:       string
  nombre:   string
  username: string
  email:    string
  rol:      Rol
  plan?:        Plan
  planVenceEn?: string | null
  telefono?: string
  avatar?:  string
  bio?:     string | null
  verificado?: boolean
  rating:   number
  activo?:  boolean
  latitud?:  number | null
  longitud?: number | null
}

interface AuthStore {
  usuario:    Usuario | null
  token:      string | null
  isLoading:  boolean
  setUsuario: (usuario: Usuario, token: string) => void
  logout:     () => void
  setLoading: (val: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario:    null,
  token:      null,
  isLoading:  false,
  setUsuario: (usuario, token) => set({ usuario, token }),
  logout:     () => set({ usuario: null, token: null }),
  setLoading: (val) => set({ isLoading: val }),
}))
