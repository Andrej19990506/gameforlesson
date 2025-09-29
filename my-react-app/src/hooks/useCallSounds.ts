import { useRef, useCallback } from 'react';

export const useCallSounds = () => {
  const incomingRingRef = useRef<HTMLAudioElement | null>(null);
  const outgoingRingRef = useRef<HTMLAudioElement | null>(null);
  const callConnectedRef = useRef<HTMLAudioElement | null>(null);
  const callEndedRef = useRef<HTMLAudioElement | null>(null);
  const ringIntervalRef = useRef<number | null>(null);

  // Создание простого звука через Web Audio API
  const createBeepSound = (frequency: number, duration: number = 0.1) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };


  // Воспроизведение звука входящего звонка
  const playIncomingRing = useCallback(() => {
    console.log('🔊 Воспроизводим периодический звук входящего звонка');
    
    // Останавливаем предыдущий интервал если есть
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
    }
    
    // Создаем периодический звук каждые 2 секунды
    const playRing = () => {
      try {
        createBeepSound(800, 0.3);
        setTimeout(() => createBeepSound(800, 0.3), 400);
        setTimeout(() => createBeepSound(800, 0.3), 800);
      } catch (error) {
        console.error('Ошибка воспроизведения звука входящего звонка:', error);
      }
    };
    
    // Воспроизводим сразу
    playRing();
    
    // Затем каждые 2 секунды
    ringIntervalRef.current = setInterval(playRing, 2000);
  }, [createBeepSound]);

  // Воспроизведение звука исходящего звонка
  const playOutgoingRing = useCallback(() => {
    console.log('🔊 Воспроизводим периодический звук исходящего звонка');
    
    // Останавливаем предыдущий интервал если есть
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
    }
    
    // Создаем периодический звук каждые 2 секунды
    const playRing = () => {
      try {
        createBeepSound(600, 0.2);
        setTimeout(() => createBeepSound(600, 0.2), 300);
        setTimeout(() => createBeepSound(600, 0.2), 600);
      } catch (error) {
        console.error('Ошибка воспроизведения звука исходящего звонка:', error);
      }
    };
    
    // Воспроизводим сразу
    playRing();
    
    // Затем каждые 2 секунды
    ringIntervalRef.current = setInterval(playRing, 2000);
  }, [createBeepSound]);

  // Воспроизведение звука подключения
  const playCallConnected = useCallback(() => {
    console.log('🔊 Воспроизводим звук подключения');
    try {
      // Используем Web Audio API для более надежного воспроизведения
      createBeepSound(1000, 0.1);
      setTimeout(() => createBeepSound(1200, 0.1), 150);
    } catch (error) {
      console.error('Ошибка воспроизведения звука подключения:', error);
    }
  }, [createBeepSound]);

  // Воспроизведение звука завершения
  const playCallEnded = useCallback(() => {
    console.log('🔊 Воспроизводим звук завершения');
    try {
      // Используем Web Audio API для более надежного воспроизведения
      createBeepSound(400, 0.2);
      setTimeout(() => createBeepSound(300, 0.2), 250);
    } catch (error) {
      console.error('Ошибка воспроизведения звука завершения:', error);
    }
  }, [createBeepSound]);

  // Остановка всех звуков
  const stopAllSounds = useCallback(() => {
    // Останавливаем периодический звонок
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    
    [incomingRingRef, outgoingRingRef, callConnectedRef, callEndedRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    console.log('🔇 Остановлены все звуки звонков');
  }, []);

  // Остановка звуков звонка (входящий/исходящий)
  const stopRingSounds = useCallback(() => {
    // Останавливаем периодический звонок
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    
    if (incomingRingRef.current) {
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    }
    if (outgoingRingRef.current) {
      outgoingRingRef.current.pause();
      outgoingRingRef.current.currentTime = 0;
    }
    console.log('🔇 Остановлены звуки звонка');
  }, []);

  return {
    playIncomingRing,
    playOutgoingRing,
    playCallConnected,
    playCallEnded,
    stopAllSounds,
    stopRingSounds
  };
};
