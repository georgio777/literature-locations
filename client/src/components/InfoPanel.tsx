import React, { useState, useRef, useEffect, useCallback } from 'react'
import './InfoPanel.css'
import { useMapStore } from '../store/mapStore'
import type { LocationDescription } from '../types'
import Share from './Share'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function InfoPanel() {
  const { currentCharacter } = useMapStore()
  const [isOpen, setOpen] = useState(false)
  const [descriptions, setDescriptions] = useState<LocationDescription[]>([])
  const [loadingDescriptions, setLoadingDescriptions] = useState(false)
  
  const isDraggableRef = useRef(false)
  const xRef = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const diffRef = useRef(0)
  const xStartRef = useRef(0)
  
  let screenWidth = window.innerWidth
  let panelWidth = screenWidth * 0.3
  const panelLedge = 0

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

  const handleResize = useCallback(() => {
    screenWidth = window.innerWidth
    panelWidth = screenWidth * 0.3
    if (panelRef.current) {
      panelRef.current.style.width = `${panelWidth}px`
      panelRef.current.style.transition = 'none'
      diffRef.current = isOpen ? -panelWidth + panelLedge : 0
      panelRef.current.style.transform = `translateX(${diffRef.current}px)`
    }
  }, [isOpen])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const openPanel = () => {
    diffRef.current = -panelWidth + panelLedge
    setOpen(true)
  }

  const closePanel = () => {
    diffRef.current = 0
    setOpen(false)
  }

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      panelRef.current.style.transition = 'none'
      e.currentTarget.setPointerCapture(e.pointerId)
      isDraggableRef.current = true
      xStartRef.current = e.clientX
      xRef.current = e.clientX
    }
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggableRef.current && panelRef.current) {
      xRef.current = e.clientX
      diffRef.current = isOpen 
        ? xRef.current - screenWidth + panelLedge
        : xRef.current - xStartRef.current
      
      if (diffRef.current <= 0 && diffRef.current >= -panelWidth + panelLedge) {
        panelRef.current.style.transform = `translateX(${diffRef.current}px)`
      }
    }
  }

  const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    isDraggableRef.current = false
    
    if (panelRef.current) {
      panelRef.current.style.transition = '.2s ease'
      
      if (xStartRef.current > xRef.current) {
        openPanel()
      } else {
        closePanel()
      }
      
      if (xRef.current - xStartRef.current === 0 && !isOpen) {
        openPanel()
      } else if (xRef.current - xStartRef.current === 0 && isOpen) {
        closePanel()
      }
      
      panelRef.current.style.transform = `translateX(${diffRef.current}px)`
    }
  }

  useEffect(() => {
    if (!currentCharacter) return
    openPanel()
    if (panelRef.current) {
      panelRef.current.style.transform = `translateX(${diffRef.current}px)`
    }
  }, [currentCharacter])

  return (
    <div ref={panelRef} className="info-panel">
      <div 
        onPointerDown={handleDown} 
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        className="grip"
      />
      <div className="panel-inner">
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
        <Share/>

      </div>
    </div>
  )
}

export default InfoPanel