import * as React from 'react';
import Map, { GeolocateControl, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
// @ts-ignore
import circle from '@turf/circle';
// @ts-ignore
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import './InteractiveMap.css';
import { useCallback, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import { useSearchParams } from 'react-router-dom';
import { MAPTILER_KEY } from '../config';
import Pins from './Pins';

// Геозона радиусом 10 миль вокруг центра СПб
const CENTER_COORDS: [number, number] = [30.315965, 59.939009];
const CENTER_POINT = point(CENTER_COORDS);
const GEOFENCE = circle(CENTER_POINT, 10, { units: 'miles' as any });

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

export default function InteractiveMap() {
  const [searchParams] = useSearchParams();
  const { data, setCurrentCharacter, setCurrentId, setData } = useMapStore();
  
  const [viewState, setViewState] = React.useState<ViewState>({
    longitude: CENTER_COORDS[0],
    latitude: CENTER_COORDS[1],
    zoom: 12
  });

  // Загружаем данные локаций при монтировании компонента
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/locations`);
        if (response.ok) {
          const locations = await response.json();
          setData(locations);          
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [setData]);

  // Обрабатываем URL параметр id при загрузке
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && data) {
      const id = parseInt(idParam);
      const character = data.find(char => char.id === id);
      if (character) {
        setCurrentCharacter(character);
        setCurrentId(id);
      }
    }
  }, [searchParams, data, setCurrentCharacter, setCurrentId]);

  const onMove = useCallback(({ viewState }: { viewState: ViewState }) => {
    const newCenter = point([viewState.longitude, viewState.latitude]);
    if (booleanPointInPolygon(newCenter, GEOFENCE)) {
      setViewState(viewState);
    }
  }, []);

  // Обработчик для GeolocateControl
  const onGeolocate = useCallback((evt: any) => {
    const { longitude, latitude } = evt.coords;
    const newCenter = point([longitude, latitude]);
    
    // Проверяем, находится ли геолокация в пределах геозоны
    if (booleanPointInPolygon(newCenter, GEOFENCE)) {
      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: 15 // Увеличиваем зум при геолокации
      }));
    } else {
      // Если геолокация за пределами зоны, показываем уведомление и остаемся в центре
      console.warn('Геолокация находится за пределами доступной области');
      // Можно добавить toast уведомление здесь
      setViewState(prev => ({
        ...prev,
        longitude: CENTER_COORDS[0],
        latitude: CENTER_COORDS[1],
        zoom: 13
      }));
    }
  }, []);

  return (
    <div className="map-container">
      <Map
        attributionControl={false}
        initialViewState={{
          longitude: CENTER_COORDS[0],
          latitude: CENTER_COORDS[1],
          zoom: 12
        }}
        {...viewState}
        minZoom={10}
        maxZoom={18}
        onMove={onMove}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/01980d77-7e8c-712b-a9a9-ae80a88527a9/style.json?key=${MAPTILER_KEY}`}
      >
        <GeolocateControl 
          position="top-left" 
          onGeolocate={onGeolocate}
          onError={(error) => {
            console.error('Ошибка геолокации:', error);
            // Возвращаемся к центру при ошибке
            setViewState(prev => ({
              ...prev,
              longitude: CENTER_COORDS[0],
              latitude: CENTER_COORDS[1],
              zoom: 12
            }));
          }}
          trackUserLocation={false}
        />
        <NavigationControl position="top-left" />
        <Pins />
      </Map>
    </div>
  );
}