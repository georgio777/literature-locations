import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Location, LocationDescription } from '../types'
import './EditLocation.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface LocationFormData {
  name: string
  longitude: string
  latitude: string
  currentAddress: string
  historicalAddress: string
  author: string
  fiction: string
}

interface DescriptionData extends LocationDescription {
  isNew?: boolean
  isDeleted?: boolean
}

export default function EditLocation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuthStore()
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    longitude: '',
    latitude: '',
    currentAddress: '',
    historicalAddress: '',
    author: '',
    fiction: ''
  })
  
  const [descriptions, setDescriptions] = useState<DescriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (id) {
      fetchLocation(parseInt(id))
      fetchDescriptions(parseInt(id))
    }
  }, [id])

  const fetchLocation = async (locationId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/locations`)
      if (response.ok) {
        const locations: Location[] = await response.json()
        const location = locations.find(loc => loc.id === locationId)
        
        if (location) {
          setFormData({
            name: location.name,
            longitude: location.longitude.toString(),
            latitude: location.latitude.toString(),
            currentAddress: location.current_address,
            historicalAddress: location.historical_address,
            author: location.author,
            fiction: location.fiction
          })
        } else {
          setMessage('Локация не найдена')
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error)
      setMessage('Ошибка при загрузке локации')
    } finally {
      setLoading(false)
    }
  }

  const fetchDescriptions = async (locationId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/locations/${locationId}/descriptions`)
      if (response.ok) {
        const data = await response.json()
        setDescriptions(data)
      }
    } catch (error) {
      console.error('Error fetching descriptions:', error)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDescriptionChange = (index: number, field: 'title' | 'description', value: string) => {
    setDescriptions(prev => prev.map((desc, i) => 
      i === index ? { ...desc, [field]: value } : desc
    ))
  }

  const addDescription = () => {
    setDescriptions(prev => [...prev, {
      id: Date.now(), // временный ID для новых описаний
      location_id: parseInt(id!),
      title: '',
      description: '',
      isNew: true
    }])
  }

  const removeDescription = (index: number) => {
    const desc = descriptions[index]
    if (desc.isNew) {
      // Удаляем новое описание сразу
      setDescriptions(prev => prev.filter((_, i) => i !== index))
    } else {
      // Помечаем существующее описание для удаления
      setDescriptions(prev => prev.map((d, i) => 
        i === index ? { ...d, isDeleted: true } : d
      ))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const token = getToken()
      
      // Обновляем основную информацию о локации
      const locationResponse = await fetch(`${API_URL}/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!locationResponse.ok) {
        const errorData = await locationResponse.json()
        throw new Error(errorData.error || 'Ошибка при обновлении локации')
      }

      // Обрабатываем описания
      for (const desc of descriptions) {
        if (desc.isDeleted && !desc.isNew) {
          // Удаляем существующее описание
          await fetch(`${API_URL}/api/descriptions/${desc.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        } else if (desc.isNew && desc.title.trim() && desc.description.trim()) {
          // Создаем новое описание
          await fetch(`${API_URL}/api/locations/${id}/descriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: desc.title,
              description: desc.description
            })
          })
        } else if (!desc.isNew && !desc.isDeleted && desc.title.trim() && desc.description.trim()) {
          // Обновляем существующее описание
          await fetch(`${API_URL}/api/descriptions/${desc.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: desc.title,
              description: desc.description
            })
          })
        }
      }

      setMessage('Локация успешно обновлена!')
      
      // Перенаправляем в админку через 2 секунды
      setTimeout(() => {
        navigate('/admin')
      }, 2000)

    } catch (error) {
      console.error('Error updating location:', error)
      setMessage(error instanceof Error ? error.message : 'Ошибка при обновлении')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="edit-location">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="edit-location">
      <div className="edit-location-header">
        <h2>Редактировать локацию</h2>
        <button 
          onClick={() => navigate('/admin')}
          className="back-btn"
          type="button"
        >
          ← Назад в админку
        </button>
      </div>
      
      {message && (
        <div className={`message ${message.includes('успешно') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="location-form">
        <div className="form-group">
          <label htmlFor="name">Имя персонажа:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude">Широта:</label>
            <input
              type="number"
              step="any"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Долгота:</label>
            <input
              type="number"
              step="any"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="currentAddress">Современный адрес:</label>
          <input
            type="text"
            id="currentAddress"
            name="currentAddress"
            value={formData.currentAddress}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="historicalAddress">Исторический адрес:</label>
          <input
            type="text"
            id="historicalAddress"
            name="historicalAddress"
            value={formData.historicalAddress}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Автор:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fiction">Произведение:</label>
          <input
            type="text"
            id="fiction"
            name="fiction"
            value={formData.fiction}
            onChange={handleChange}
            required
          />
        </div>

        <div className="descriptions-section">
          <h3>Описания</h3>
          {descriptions.filter(desc => !desc.isDeleted).map((desc, index) => (
            <div key={desc.id} className="description-item">
              <div className="description-header">
                <span>
                  {desc.isNew ? 'Новое описание' : `Описание ${index + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeDescription(descriptions.indexOf(desc))}
                  className="remove-description-btn"
                >
                  ×
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor={`desc-title-${desc.id}`}>Заголовок:</label>
                <input
                  type="text"
                  id={`desc-title-${desc.id}`}
                  value={desc.title}
                  onChange={(e) => handleDescriptionChange(descriptions.indexOf(desc), 'title', e.target.value)}
                  placeholder="Введите заголовок описания"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor={`desc-content-${desc.id}`}>Описание:</label>
                <textarea
                  id={`desc-content-${desc.id}`}
                  value={desc.description}
                  onChange={(e) => handleDescriptionChange(descriptions.indexOf(desc), 'description', e.target.value)}
                  placeholder="Введите описание"
                  rows={4}
                />
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addDescription}
            className="add-description-btn"
          >
            + Добавить еще описание
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}