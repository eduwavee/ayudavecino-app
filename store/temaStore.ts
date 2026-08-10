import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'

interface TemaStore {
  oscuro: boolean
  toggleTema: () => void
  setOscuro: (val: boolean) => void
}

// Por defecto arranca respetando el tema del sistema operativo la primera vez.
// Después de eso, se respeta lo que el usuario haya elegido a mano (persistido).
export const useTemaStore = create<TemaStore>()(
  persist(
    (set) => ({
      oscuro: Appearance.getColorScheme() === 'dark',
      toggleTema: () => set(state => ({ oscuro: !state.oscuro })),
      setOscuro: (val) => set({ oscuro: val }),
    }),
    {
      name: 'tema-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Tokens de color "neutros" que cambian entre claro/oscuro.
// Los colores de marca (verde primario, amarillo, rojo, azul, badges de estado)
// se mantienen iguales en los dos temas — es lo estándar en apps con dark mode.
export const TEMAS = {
  claro: {
    bg:       '#F7F3EE',
    card:     '#FFFFFF',
    texto:    '#1a1a1a',
    subTexto: '#888888',
    border:   '#EFEFEF',
    inputBg:  '#F7F7F7',
    overlay:  'rgba(0,0,0,.06)',
    sombra:   '#000000',
  },
  oscuro: {
    bg:       '#0D0D0D',
    card:     '#1A1A1A',
    texto:    '#FFFFFF',
    subTexto: '#9A9A9A',
    border:   '#2A2A2A',
    inputBg:  '#252525',
    overlay:  'rgba(255,255,255,.08)',
    sombra:   '#000000',
  },
}

export type TemaTokens = typeof TEMAS.claro

// Hook de conveniencia: devuelve directamente la paleta activa.
export function useTema(): TemaTokens {
  const oscuro = useTemaStore(s => s.oscuro)
  return oscuro ? TEMAS.oscuro : TEMAS.claro
}
