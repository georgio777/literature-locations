import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import Login from './Login'

interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialize } = useAuthStore()

  useEffect(() => {
    console.log('ok');

    const preloader: HTMLDivElement | null = document.querySelector('.preloader-wrapper');
    
    if (preloader) {
      preloader.style.display = 'none';
      console.log(preloader);
      
    }
  }, []);

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Загрузка...
      </div>
    )
  }

  if (!isAuthenticated()) {
    return <Login />
  }

  return <>{children}</>
}

export default ProtectedRoute