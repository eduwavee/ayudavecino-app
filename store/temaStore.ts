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
    subTexto: '#6B6B6B', // 5.3:1 sobre blanco (antes #888: 3.5:1, no pasaba WCAG AA)
    border:   '#EFEFEF',
    inputBg:  '#F7F7F7',
    overlay:  'rgba(0,0,0,.06)',
    sombra:   '#000000',
    peligro:  '#C0392B', // acciones destructivas (cerrar sesión, eliminar): 5.4:1 sobre blanco
    seleccion: '#1a1a1a', // fondo de chips/botones activos (texto blanco encima)
    dorado:   '#8A6500', // texto/íconos dorados (Premium, urgente): 5.6:1 sobre blanco
    // Para los componentes con variante de fondo oscuro (PlanBadge, EstadoBadge): las
    // pantallas con tema se lo pasan; las que siempre son claras no
    esOscuro: false,
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
    peligro:  '#FF7675', // el rojo oscuro no se lee sobre #1A1A1A; este da 6:1
    seleccion: '#1A9E5C', // en oscuro el negro desaparece sobre el fondo: el activo va en verde
    dorado:   '#FFD23F', // el dorado oscuro no se lee sobre #1A1A1A
    esOscuro: true,
  },
}

export type TemaTokens = typeof TEMAS.claro

// Hook de conveniencia: devuelve directamente la paleta activa.
export function useTema(): TemaTokens {
  const oscuro = useTemaStore(s => s.oscuro)
  return oscuro ? TEMAS.oscuro : TEMAS.claro
}
