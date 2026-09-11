import { create } from 'zustand'

interface ThemeState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

const getInitialTheme = (): 'dark' | 'light' => {
  const saved = localStorage.getItem('bountyvault-theme')
  return (saved === 'dark' || saved === 'light') ? saved : 'dark'
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('bountyvault-theme', next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { theme: next }
  }),
  setTheme: (theme) => set(() => {
    localStorage.setItem('bountyvault-theme', theme)
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { theme }
  }),
}))
