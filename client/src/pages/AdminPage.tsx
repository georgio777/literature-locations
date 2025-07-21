import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './AdminPage.css'

export default function AdminPage() {
  const { user, logout } = useAuthStore()

  const handleLogout = (): void => {
    logout()
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>Панель администратора</h1>
          <div className="admin-user-info">
            <span>Добро пожаловать, {user?.login}</span>
            <button onClick={handleLogout} className="logout-btn">
              Выйти
            </button>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-cards">
            <div className="admin-card">
              <h3>Добавить локацию</h3>
              <p>Добавить новую литературную локацию в базу данных</p>
              <Link to="/admin/add" className="admin-btn primary">
                Добавить локацию
              </Link>
            </div>

            <div className="admin-card">
              <h3>Управление локациями</h3>
              <p>Просмотр, редактирование и удаление существующих локаций</p>
              <Link to="/locations" className="admin-btn secondary">
                Управлять локациями
              </Link>
            </div>

            <div className="admin-card">
              <h3>Просмотр карты</h3>
              <p>Посмотреть все локации на интерактивной карте</p>
              <Link to="/" className="admin-btn secondary">
                Открыть карту
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}