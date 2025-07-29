import { create } from 'zustand'

interface PreloadState {
  tilesLoaded: boolean
  setTilesLoaded: () => void
}

export const usePreloadStore = create<PreloadState>((set) => ({
  tilesLoaded: false,
  setTilesLoaded: () => set({ tilesLoaded: true })
}))