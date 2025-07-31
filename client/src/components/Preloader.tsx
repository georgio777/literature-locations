import { usePreloadStore } from '../store/preloadStore'
import { useState, useRef, useEffect } from 'react';


export default function Preloader() {
  const { tilesLoaded } = usePreloadStore();
  const [endCountdown, setEndCountdown] = useState(false);
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
      const preloader: HTMLDivElement | null = document.querySelector('.preloader-wrapper');
      if (preloader) {
        preloader.style.transition = '.5s ease'
        preloader.style.opacity = '0'
        setTimeout(() => {
          preloader!.style.display = 'none'
        }, 500);
      }
    }
  }, [tilesLoaded, endCountdown]);

  return null
}