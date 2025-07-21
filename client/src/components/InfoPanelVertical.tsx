import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import './InfoPanelVertical.css'
import { useMapStore } from '../store/mapStore'
import type { LocationDescription } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const HANDLE_HEIGHT = 40      // px
const HANDLE_MARGIN = 0       // px
const CLOSED_OFFSET = HANDLE_HEIGHT + HANDLE_MARGIN * 2

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
  const SNAP: SnapPoints = useMemo(() => ({
    closed: CLOSED_OFFSET,
    half: windowHeight / 2,
    open: windowHeight,
  }), [windowHeight])

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
      const delta = startMouseY - e.clientY
      const raw = startOffset + delta
      const clamped = Math.min(Math.max(raw, SNAP.closed), SNAP.open)
      
      offsetRef.current = clamped
      setCurrentY(clamped)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      
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

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [SNAP, getClosestPoint])

  // Обработчик нажатия на ручку
  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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
        className="info-panel__handle"
        onPointerDown={onHandlePointerDown}
      />
      <div className="info-panel__content">
        {currentCharacter && (
          <div className="character-info">
            <p className="character-name">{currentCharacter.name}</p>
            <p className="title-author">{currentCharacter.fiction}, {currentCharacter.author}</p>
            <hr />
            <div className="adress-wrapper">
              <p className='adress'>
                <span>Адрес:</span><br />
                {currentCharacter.current_address}
              </p>
              <p className='adress'>
                <span>Исторический адрес:</span><br />
                {currentCharacter.historical_address}
              </p>
            </div>
            
            {/* Секция описаний */}
            <div className="additional-info">
              {loadingDescriptions ? (
                <p>Загрузка описаний...</p>
              ) : descriptions.length > 0 ? (
                descriptions.map((desc, index) => (
                  <div key={desc.id} className="detail-block">
                    <h3 className="detail-title">{desc.title}</h3>
                    <div className="detail-content">
                      <p className="detail-description">{desc.description}</p>
                    </div>
                    {index < descriptions.length - 1 && <hr className="detail-divider" />}
                  </div>
                ))
              ) : (
                <p className="no-descriptions">Описания отсутствуют</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InfoPanelVertical