import { create } from 'zustand'
import type { Location } from '../types'

interface MapState {
  data: Location[] | null
  filteredData: Location[] | null
  currentCharacter: Location | null
  currentId: number | null
  setFilteredData: ( filteredData: Location[] ) => void
  setData: (data: Location[]) => void
  setCurrentCharacter: (character: Location) => void
  setCurrentId: (id: number) => void
  clearCurrent: () => void
  clearFiltered: () => void
}

export const useMapStore = create<MapState>((set) => ({
  data: null,
  filteredData: null,
  currentCharacter: null,
  currentId: null,

  setFilteredData: (filteredData: Location[]) => set({ filteredData }),

  setData: (data: Location[]) => set({ data }),

  setCurrentCharacter: (character: Location) =>
    set({ currentCharacter: character }),

  setCurrentId: (id: number) =>
    set({ currentId: id }),

  clearCurrent: () =>
    set({ currentCharacter: null, currentId: null }),
  
  clearFiltered: () => 
    set({ filteredData: null })
}))