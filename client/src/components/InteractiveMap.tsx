import * as React from 'react';
import Map, { GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import circle from '@turf/circle';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import './InteractiveMap.css';
import { useCallback, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import { useSearchParams } from 'react-router-dom';
import { MAPTILER_KEY } from '../config';
import Pins from './Pins';

// Геозона радиусом 7 миль вокруг центра СПб
const CENTER_COORDS: [number, number] = [30.315965, 59.939009];
const GEOFENCE = circle(CENTER_COORDS, 10, { units: 'miles' });

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
    const newCenter: [number, number] = [viewState.longitude, viewState.latitude];
    if (booleanPointInPolygon(newCenter, GEOFENCE)) {
      setViewState(viewState);
    }
  }, []);

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
        <Pins />
      </Map>
    </div>
  );
}