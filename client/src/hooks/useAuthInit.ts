import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export const useAuthInit = (): void => {
  const initialize = useAuthStore(state => state.initialize)
  
  useEffect(() => {
    initialize()
  }, [initialize])
}