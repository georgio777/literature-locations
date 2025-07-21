import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = (): void => {
    logout()
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">Литературные локации</h1>
        <div className="nav-content">
          <div className="nav-links">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Карта
            </Link>
            <Link 
              to="/locations" 
              className={`nav-link ${location.pathname === '/locations' ? 'active' : ''}`}
            >
              Все локации
            </Link>
            <Link 
              to="/admin" 
              className={`nav-link admin-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              Админка
            </Link>
          </div>
          {user && (
            <div className="nav-user">
              <span className="user-info">Админ: {user.login}</span>
              <button onClick={handleLogout} className="logout-btn">
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation