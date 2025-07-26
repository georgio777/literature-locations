import * as React from 'react'
import Map, { GeolocateControl, Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import circle from '@turf/circle'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import './InteractiveMap.css'
import { useMemo, useCallback, useEffect } from 'react'
import { useMapStore } from '../store/mapStore'
import { useSearchParams } from 'react-router-dom'
import { MAPTILER_KEY } from '../config'
import type { Location } from '../types'

// Геозона радиусом 7 миль вокруг центра СПб
const CENTER_COORDS: [number, number] = [30.315965, 59.939009]
const GEOFENCE = circle(CENTER_COORDS, 10, { units: 'miles' })

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
}

export default function InteractiveMap() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, setCurrentCharacter, currentId, setCurrentId, setData } = useMapStore()
  
  const [viewState, setViewState] = React.useState<ViewState>({
    longitude: CENTER_COORDS[0],
    latitude: CENTER_COORDS[1],
    zoom: 12
  })

  // Загружаем данные локаций при монтировании компонента
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/locations`)
        if (response.ok) {
          const locations: Location[] = await response.json()
          setData(locations)          
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }

    fetchLocations()
  }, [setData])

  // Обрабатываем URL параметр id при загрузке
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam && data) {
      const id = parseInt(idParam)
      const character = data.find(char => char.id === id)
      if (character) {
        setCurrentCharacter(character)
        setCurrentId(id)
        // Убрали центрирование карты при клике на pin
      }
    }
  }, [searchParams, data, setCurrentCharacter, setCurrentId])

  // Генерируем маркеры
  const pins = useMemo(() => {
    if (!data) return null
    
    return data.map((character) => (
      <Marker
        key={character.id}
        longitude={Number(character.longitude)}
        latitude={Number(character.latitude)}
        anchor="center"
        onClick={() => {
          // 1) Устанавливаем персонажа в Zustand
          setCurrentCharacter(character)
          // 2) Записываем id в строку запроса
          setSearchParams({ id: String(character.id) })
          // 3) Устанавливаем currentId
          setCurrentId(character.id)
        }}
      >
        <div
          style={{
            backgroundColor: currentId === character.id ? 'rgba(247, 246, 243, 1)' : 'rgba(29, 40, 28, 1)'
          }}
          title={character.name}
          className="map-pin"
        >
          <span
            style={{
              color: currentId === character.id ? 'rgba(36, 49, 35, 1)' : 'rgba(236, 243, 233, 1)'
            }}
            className="pin-name"
          >
            {Array.from(character.name)[0]}
          </span>
        </div>
      </Marker>
    ))
  }, [data, setCurrentCharacter, setSearchParams, currentId, setCurrentId])

  const onMove = useCallback(({ viewState }: { viewState: ViewState }) => {
    const newCenter: [number, number] = [viewState.longitude, viewState.latitude]
    if (booleanPointInPolygon(newCenter, GEOFENCE)) {
      setViewState(viewState)
    }
  }, [])

  return (
    <div className="map-container">
      <Map
        attributionControl={false}
        {...viewState}
        minZoom={10}
        maxZoom={18}
        onMove={onMove}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/01980d77-7e8c-712b-a9a9-ae80a88527a9/style.json?key=${MAPTILER_KEY}`}
      >
        <GeolocateControl position="top-left" />
        {pins}
      </Map>
    </div>
  )
}