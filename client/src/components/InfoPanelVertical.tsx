import React, { useRef, useState, useEffect, useCallback } from 'react'
import './InfoPanelVertical.css'
import { useMapStore } from '../store/mapStore'
import type { LocationDescription } from '../types'
import Share from './Share'

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

// Упрощенные константы для позиций панели (в процентах от высоты экрана)
const PANEL_HEIGHT_PERCENT = 0.8 // 80% экрана
const POSITIONS = {
  CLOSED: 100,    // 100% translateY - полностью скрыта
  HALF: 60,       // 60% translateY - показывается 40% панели  
  OPEN: 20        // 20% translateY - показывается 80% панели
}

const InfoPanelVertical: React.FC = () => {
  const { currentCharacter } = useMapStore()
  const [descriptions, setDescriptions] = useState<LocationDescription[]>([])
  const [loadingDescriptions, setLoadingDescriptions] = useState(false)
  
  const panelRef = useRef<HTMLDivElement>(null)
  const [windowHeight, setWindowHeight] = useState(() => window.innerHeight)
  const [currentPosition, setCurrentPosition] = useState<number>(POSITIONS.CLOSED)
  const positionRef = useRef<number>(POSITIONS.CLOSED)

  // Загружаем описания при смене персонажа
  useEffect(() => {
    if (currentCharacter) {
      fetchDescriptions(currentCharacter.id)
    }
  }, [currentCharacter])

  const fetchDescriptions = async (locationId: number) => {
    setLoadingDescriptions(true)
    try {
      const response = await fetch(`${API_URL}/api/locations/${locationId}/descriptions`)
      if (response.ok) {
        const data = await response.json()
        setDescriptions(data)
      }
    } catch (error) {
      console.error('Error fetching descriptions:', error)
    } finally {
      setLoadingDescriptions(false)
    }
  }

  // Обновляем высоту экрана при ресайзе
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Упрощенная логика - работаем с процентами
  const snapPoints = [POSITIONS.CLOSED, POSITIONS.HALF, POSITIONS.OPEN]

  // При монтировании выставляем закрытую позицию
  useEffect(() => {
    setCurrentPosition(POSITIONS.CLOSED)
    positionRef.current = POSITIONS.CLOSED
  }, [])

  useEffect(() => {
    if (currentCharacter == null) return
    
    // включаем CSS‑переход для плавности
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.3s ease'
    }
    
    // открываем панель
    setCurrentPosition(POSITIONS.OPEN)
    positionRef.current = POSITIONS.OPEN
  }, [currentCharacter])

  // Вычисляем ближайшую точку притяжения
  const getClosestPoint = useCallback((position: number) => {
    return snapPoints.reduce((best, pt) =>
      Math.abs(position - pt) < Math.abs(position - best) ? pt : best,
      POSITIONS.CLOSED
    )
  }, [])

  // Начало перетаскивания
  const startDrag = useCallback((startMouseY: number, startPosition: number, pointerId: number) => {
    // отключаем CSS-переход для ручного движения
    if (panelRef.current) panelRef.current.style.transition = 'none'

    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      
      // Вычисляем изменение позиции в процентах
      const deltaY = startMouseY - e.clientY
      const deltaPercent = (deltaY / windowHeight) * 100
      const newPosition = startPosition - deltaPercent // инвертируем, так как тянем вверх
      
      // Ограничиваем позицию
      const clampedPosition = Math.min(Math.max(newPosition, POSITIONS.OPEN), POSITIONS.CLOSED)
      
      // Используем requestAnimationFrame для плавности
      requestAnimationFrame(() => {
        positionRef.current = clampedPosition
        setCurrentPosition(clampedPosition)
      })
    }

    const onUp = (e: PointerEvent) => {
      e.preventDefault()
      
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      
      // отпустить захват указателя
      panelRef.current?.releasePointerCapture(pointerId)
      
      // «притягиваем» к ближайшей точке
      const snapTo = getClosestPoint(positionRef.current)
      if (panelRef.current)
        panelRef.current.style.transition = 'transform 0.3s ease'
      
      setCurrentPosition(snapTo)
      positionRef.current = snapTo
      
      // по окончании transition убираем inline-стиль
      const cleanup = () => {
        if (panelRef.current) {
          panelRef.current.style.transition = ''
          panelRef.current.removeEventListener('transitionend', cleanup)
        }
      }
      panelRef.current?.addEventListener('transitionend', cleanup)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp, { passive: false })
    window.addEventListener('pointercancel', onUp, { passive: false })
  }, [windowHeight, getClosestPoint])

  // Обработчик нажатия на ручку
  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Предотвращаем стандартное поведение браузера
    e.preventDefault()
    e.stopPropagation()
    
    // перехватываем указатель, чтобы получать его события
    e.currentTarget.setPointerCapture(e.pointerId)
    
    startDrag(e.clientY, positionRef.current, e.pointerId)
  }, [startDrag])

  // Упрощенные вычисления
  const panelHeight = windowHeight * PANEL_HEIGHT_PERCENT
  const translateY = `${currentPosition}%`

  return (
    <div
      ref={panelRef}
      className="info-panel-vertical"
      style={{ 
        transform: `translateY(${translateY})`,
        height: `${panelHeight}px`
      }}
    >
      <div 
        className="info-panel__handle-area"
        onPointerDown={onHandlePointerDown}
      >
        <div
          className="info-panel__handle"
          role="slider"
          aria-label="Перетащите для изменения размера панели"
          tabIndex={0}
        >
          <div className="info-panel__handle-indicator" />
        </div>
      </div>
      <div className="info-panel__content">
        {currentCharacter ? (
          <div className="character-info-vert">
            <p className="character-name-vert">{currentCharacter.name}</p>
            <p className="title-author-vert">{currentCharacter.fiction}, {currentCharacter.author}</p>
            <hr />
            <div className="adress-wrapper-vert">
              <p className='adress-vert'>
                <span>Адрес:</span><br />
                {currentCharacter.current_address}
              </p>
              <p className='adress-vert'>
                <span>Исторический адрес:</span><br />
                {currentCharacter.historical_address}
              </p>
            </div>
            
            {/* Секция описаний */}
            <div className="additional-info-vert">
              {loadingDescriptions ? (
                <p>Загрузка описаний...</p>
              ) : descriptions.length > 0 ? (
                descriptions.map((desc, index) => (
                  <div key={desc.id} className="detail-block-vert">
                    <h3 className="detail-title-vert">{desc.title}</h3>
                    <div className="detail-content-vert">
                      <p className="detail-description-vert">{desc.description}</p>
                    </div>
                    {index < descriptions.length - 1 && <hr className="detail-divider-vert" />}
                  </div>
                ))
              ) : (
                <p className="no-descriptions-vert">Описания отсутствуют</p>
              )}
            </div>
          </div>
        ) : (
          <div className="character-info-vert">
            <p className="no-descriptions-vert">Выберите персонажа на карте</p>
          </div>
        )}
        <Share/>
      </div>
    </div>
  )
}

export default InfoPanelVertical