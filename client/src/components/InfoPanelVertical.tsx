import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import './InfoPanelVertical.css'
import { useMapStore } from '../store/mapStore'
import type { LocationDescription } from '../types'

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

const HANDLE_AREA_HEIGHT = 70 // px - полная высота области касания
const SAFE_MARGIN = 20        // px - дополнительный отступ для удобства
const CLOSED_OFFSET = HANDLE_AREA_HEIGHT + SAFE_MARGIN

type SnapPoints = {
  closed: number
  half: number
  open: number
}

const InfoPanelVertical: React.FC = () => {
  const { currentCharacter } = useMapStore()
  const [descriptions, setDescriptions] = useState<LocationDescription[]>([])
  const [loadingDescriptions, setLoadingDescriptions] = useState(false)
  
  const panelRef = useRef<HTMLDivElement>(null)
  const [windowHeight, setWindowHeight] = useState(() => window.innerHeight)
  const [currentY, setCurrentY] = useState<number>(CLOSED_OFFSET)
  const offsetRef = useRef<number>(CLOSED_OFFSET)

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

  // Определяем snap‑точки в пикселях
  const SNAP: SnapPoints = useMemo(() => {
    // Убеждаемся, что закрытое состояние не слишком низко
    const minClosedOffset = Math.max(CLOSED_OFFSET, 90) // минимум 90px от низа
    // Ограничиваем открытое состояние до 80% от высоты экрана
    const maxOpenOffset = windowHeight * 0.8
    
    return {
      closed: minClosedOffset,
      half: windowHeight / 2,
      open: maxOpenOffset,
    }
  }, [windowHeight])

  // При монтировании выставляем закрытую позицию
  useEffect(() => {
    setCurrentY(SNAP.closed)
    offsetRef.current = SNAP.closed
  }, [SNAP.closed])

  useEffect(() => {
    if (currentCharacter == null) return
    
    // включаем CSS‑переход для плавности
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.3s ease'
    }
    
    // смещаемся в snap-полную позицию
    setCurrentY(SNAP.open)
    offsetRef.current = SNAP.open
  }, [currentCharacter, SNAP.open])

  // Вычисляем ближайшую точку притяжения
  const getClosestPoint = useCallback((offset: number) => {
    return [SNAP.closed, SNAP.half, SNAP.open].reduce((best, pt) =>
      Math.abs(offset - pt) < Math.abs(offset - best) ? pt : best,
      SNAP.closed
    )
  }, [SNAP])

  // Начало перетаскивания
  const startDrag = useCallback((startMouseY: number, startOffset: number, pointerId: number) => {
    // отключаем CSS-переход для ручного движения
    if (panelRef.current) panelRef.current.style.transition = 'none'

    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      
      const delta = startMouseY - e.clientY
      const raw = startOffset + delta
      // Дополнительная защита: ручка не должна уходить ниже 90px от низа экрана
      const minPosition = Math.max(SNAP.closed, 90)
      const clamped = Math.min(Math.max(raw, minPosition), SNAP.open)
      
      // Используем requestAnimationFrame для плавности
      requestAnimationFrame(() => {
        offsetRef.current = clamped
        setCurrentY(clamped)
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
      const snapTo = getClosestPoint(offsetRef.current)
      if (panelRef.current)
        panelRef.current.style.transition = 'transform 0.3s ease'
      
      setCurrentY(snapTo)
      offsetRef.current = snapTo
      
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
  }, [SNAP, getClosestPoint])

  // Обработчик нажатия на ручку
  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Предотвращаем стандартное поведение браузера
    e.preventDefault()
    e.stopPropagation()
    
    // перехватываем указатель, чтобы получать его события
    e.currentTarget.setPointerCapture(e.pointerId)
    
    startDrag(e.clientY, offsetRef.current, e.pointerId)
  }, [startDrag])

  // Вычисляем translateY
  const translateY = windowHeight - currentY

  return (
    <div
      ref={panelRef}
      className="info-panel-vertical"
      style={{ transform: `translateY(${translateY}px)` }}
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
        {currentCharacter && (
          <div className="character-info">
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
        )}
      </div>
    </div>
  )
}

export default InfoPanelVertical