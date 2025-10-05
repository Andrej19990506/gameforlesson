import { useEffect, useState } from 'react';

export const usePWA = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение как PWA
    const checkPWA = () => {
      // Проверка для iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
      
      // Проверка для Android
      const isAndroid = /Android/.test(navigator.userAgent);
      const isInWebApp = window.matchMedia('(display-mode: standalone)').matches;
      
      const isPWAInstalled = isInStandaloneMode || isInWebApp;
      
      setIsPWA(isPWAInstalled);
      setIsStandalone(isPWAInstalled);
      
      console.log('🔍 [PWA] Проверка режима:', {
        isIOS,
        isAndroid,
        isInStandaloneMode,
        isInWebApp,
        isPWAInstalled,
        userAgent: navigator.userAgent
      });
    };

    checkPWA();

    // Слушаем изменения в display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      console.log('🔄 [PWA] Display mode changed:', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Функция для установки PWA
  const installPWA = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ [PWA] Service Worker зарегистрирован:', registration.scope);
      } catch (error) {
        console.error('❌ [PWA] Ошибка регистрации Service Worker:', error);
      }
    }
  };

  // Функция для обновления системной панели
  const updateStatusBar = (color: string) => {
    // Обновляем theme-color мета-тег
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', color);
    }

    // Обновляем apple-mobile-web-app-status-bar-style
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', 'default');
    }

    console.log('🎨 [PWA] Системная панель обновлена:', color);
  };

  return {
    isPWA,
    isStandalone,
    installPWA,
    updateStatusBar
  };
};
