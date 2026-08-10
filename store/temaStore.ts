import { create } from 'zustand'

interface TemaStore {
  oscuro: boolean
  toggleTema: () => void
}

export const useTemaStore = create<TemaStore>((set) => ({
  oscuro: false,
  toggleTema: () => set(state => ({ oscuro: !state.oscuro })),
}))

export const TEMAS = {
  claro: {
    bg:        '#F7F3EE',
    card:      '#FFFFFF',
    texto:     '#1a1a1a',
    subTexto:  '#888888',
    border:    '#EFEFEF',
    inputBg:   '#F7F7F7',
  },
  oscuro: {
    bg:        '#0D0D0D',
    card:      '#1A1A1A',
    texto:     '#FFFFFF',
    subTexto:  '#888888',
    border:    '#2A2A2A',
    inputBg:   '#252525',
  },
}
