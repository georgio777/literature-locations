import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuthStore } from '../store/authStore'
import type { LoginData } from '../types'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState<LoginData>({
    login: '',
    password: ''
  })
  const [error, setError] = useState('')
  const { login, loading } = useAuthStore()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(formData)
    
    if (!result.success) {
      setError(result.error || 'Произошла ошибка')
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Вход для администратора</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Логин:</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login