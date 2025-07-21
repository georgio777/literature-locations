import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './AddLocation.css'

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

interface DescriptionData {
  title: string
  description: string
}

function AddLocation() {
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
  const [descriptions, setDescriptions] = useState<DescriptionData[]>([
    { title: '', description: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
    setDescriptions(prev => [...prev, { title: '', description: '' }])
  }

  const removeDescription = (index: number) => {
    if (descriptions.length > 1) {
      setDescriptions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newLocation = await response.json()
        
        // Сохраняем описания для новой локации
        const validDescriptions = descriptions.filter(desc => desc.title.trim() && desc.description.trim())
        
        if (validDescriptions.length > 0) {
          for (const desc of validDescriptions) {
            await fetch(`${API_URL}/api/locations/${newLocation.id}/descriptions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(desc)
            })
          }
        }
        
        setMessage('Локация и описания успешно добавлены!')
        setFormData({
          name: '',
          longitude: '',
          latitude: '',
          currentAddress: '',
          historicalAddress: '',
          author: '',
          fiction: ''
        })
        setDescriptions([{ title: '', description: '' }])
        
        // Перенаправляем в админку через 2 секунды
        setTimeout(() => {
          navigate('/admin')
        }, 2000)
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Ошибка при добавлении локации')
      }
    } catch {
      setMessage('Ошибка соединения с сервером')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="add-location">
      <div className="add-location-header">
        <h2>Добавить новую локацию</h2>
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
          {descriptions.map((desc, index) => (
            <div key={index} className="description-item">
              <div className="description-header">
                <span>Описание {index + 1}</span>
                {descriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDescription(index)}
                    className="remove-description-btn"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor={`desc-title-${index}`}>Заголовок:</label>
                <input
                  type="text"
                  id={`desc-title-${index}`}
                  value={desc.title}
                  onChange={(e) => handleDescriptionChange(index, 'title', e.target.value)}
                  placeholder="Введите заголовок описания"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor={`desc-content-${index}`}>Описание:</label>
                <textarea
                  id={`desc-content-${index}`}
                  value={desc.description}
                  onChange={(e) => handleDescriptionChange(index, 'description', e.target.value)}
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
          {isSubmitting ? 'Добавление...' : 'Добавить локацию'}
        </button>
      </form>
    </div>
  )
}

export default AddLocation