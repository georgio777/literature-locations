import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Location } from '../types'
import './LocationsList.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function LocationsList() {
  const { getToken, isAuthenticated } = useAuthStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/api/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        setError('Ошибка при загрузке данных')
      }
    } catch {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const deleteLocation = async (id: number): Promise<void> => {
    if (!confirm('Вы уверены, что хотите удалить эту локацию?')) return

    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setLocations(locations.filter(location => location.id !== id))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Ошибка при удалении')
      }
    } catch {
      alert('Ошибка соединения с сервером')
    }
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="locations-list">
      <h2>Список локаций ({locations.length})</h2>
      
      {locations.length === 0 ? (
        <p className="no-data">Локации не найдены</p>
      ) : (
        <div className="locations-grid">
          {locations.map(location => (
            <div key={location.id} className="location-card">
              <div className="location-header">
                <h3>{location.name}</h3>
                {isAuthenticated() && (
                  <div className="location-actions">
                    <Link 
                      to={`/admin/edit/${location.id}`}
                      className="edit-btn"
                      title="Редактировать"
                    >
                      ✏️
                    </Link>
                    <button 
                      onClick={() => deleteLocation(location.id)}
                      className="delete-btn"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              <div className="card-content">
                <div className="info-group">
                  <strong>Координаты:</strong>
                  <span>{location.latitude}, {location.longitude}</span>
                </div>
                
                <div className="info-group">
                  <strong>Современный адрес:</strong>
                  <span>{location.current_address}</span>
                </div>
                
                <div className="info-group">
                  <strong>Исторический адрес:</strong>
                  <span>{location.historical_address}</span>
                </div>
                
                <div className="info-group">
                  <strong>Автор:</strong>
                  <span>{location.author}</span>
                </div>
                
                <div className="info-group">
                  <strong>Произведение:</strong>
                  <span>{location.fiction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationsList