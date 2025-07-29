import Preloader from '../components/Preloader';
import InteractiveMap from '../components/InteractiveMap';
import InfoPanel from '../components/InfoPanel';
import InfoPanelVertical from '../components/InfoPanelVertical';
import './MapPage.css';
import Share from '../components/Share';
import Filter from '../components/Filter';
import { usePreloadStore } from '../store/preloadStore';
import { useEffect, useRef, useState } from 'react';

export default function MapPage() {
  const { tilesLoaded } = usePreloadStore();
  const [endCountdown, setEndCountdown] = useState(false);
  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ставим таймер на 2 секунды один раз
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setEndCountdown(true);
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Убираем прелоадер, когда оба условия выполнены
  useEffect(() => {
    if (tilesLoaded && endCountdown) {
      setPreloaderVisible(false);
    }
  }, [tilesLoaded, endCountdown]);

  return (
    <div className="map-page">
      {preloaderVisible && <Preloader />}

      <InteractiveMap />
      <InfoPanel />
      <InfoPanelVertical />
      <Share />
      <Filter />
    </div>
  );
}
