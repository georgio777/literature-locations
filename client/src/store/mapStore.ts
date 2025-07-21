import { create } from 'zustand'
import type { Location } from '../types'

interface MapState {
  data: Location[] | null
  currentCharacter: Location | null
  currentId: number | null
  setData: (data: Location[]) => void
  setCurrentCharacter: (character: Location) => void
  setCurrentId: (id: number) => void
  clearCurrent: () => void
}

export const useMapStore = create<MapState>((set) => ({
  data: null,
  currentCharacter: null,
  currentId: null,

  setData: (data: Location[]) => set({ data }),

  setCurrentCharacter: (character: Location) =>
    set({ currentCharacter: character }),

  setCurrentId: (id: number) =>
    set({ currentId: id }),

  clearCurrent: () =>
    set({ currentCharacter: null, currentId: null })
}))