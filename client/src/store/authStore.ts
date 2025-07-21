import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginData, AuthResponse } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: () => boolean
  login: (loginData: LoginData) => Promise<AuthResponse>
  logout: () => void
  verifyToken: () => Promise<void>
  getToken: () => string | null
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      
      isAuthenticated: () => !!get().user && !!get().token,
      
      login: async (loginData: LoginData): Promise<AuthResponse> => {
        set({ loading: true })
        
        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
          })

          const data = await response.json()

          if (response.ok) {
            set({ 
              user: data.user, 
              token: data.token,
              loading: false 
            })
            return { success: true }
          } else {
            set({ loading: false })
            return { success: false, error: data.error }
          }
        } catch {
          set({ loading: false })
          return { success: false, error: 'Ошибка соединения с сервером' }
        }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      verifyToken: async () => {
        const { token } = get()
        if (!token) return

        set({ loading: true })

        try {
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, loading: false })
          } else {
            set({ user: null, token: null, loading: false })
          }
        } catch (error) {
          console.error('Token verification failed:', error)
          set({ user: null, token: null, loading: false })
        }
      },

      getToken: () => get().token,

      initialize: async () => {
        const { token, verifyToken } = get()
        if (token) {
          await verifyToken()
        } else {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      })
    }
  )
)