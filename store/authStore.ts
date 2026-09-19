import { create } from 'zustand'

interface Usuario {
  id:       string
  nombre:   string
  username: string
  email:    string
  rol:      'CLIENTE' | 'PROVEEDOR'
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
