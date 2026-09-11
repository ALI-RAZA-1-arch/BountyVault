import { create } from 'zustand'

interface AppState {
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  activeRoute: string
  setActiveRoute: (route: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  activeRoute: '/',
  setActiveRoute: (route) => set({ activeRoute: route }),
}))
