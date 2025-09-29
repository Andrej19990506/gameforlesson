import { useState, useRef, useCallback, useEffect } from 'react';
import type { User } from '../types/user';
import io, { Socket } from 'socket.io-client';
import { useCallSounds } from './useCallSounds';

interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isConnected: boolean;
  caller: User | null;
  isVideo: boolean;
}

export const useWebRTC = () => {
  const [callState, setCallState] = useState<CallState>({
    isIncoming: false,
    isOutgoing: false,
    isConnected: false,
    caller: null,
    isVideo: false
  });

  const { 
    playIncomingRing, 
    playOutgoingRing, 
    playCallConnected, 
    playCallEnded, 
    stopAllSounds, 
    stopRingSounds 
  } = useCallSounds();

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const isEndingCallRef = useRef<boolean>(false);

  // Инициализация Socket.io соединения
  const initializeSocket = useCallback((userId: string) => {
    if (socketRef.current) return socketRef.current;
    
    console.log('🔌 Инициализация Socket для пользователя:', userId);
    
    const socket = io('http://localhost:5000', {
      query: { userId }
    });
    
    socketRef.current = socket;
    currentUserIdRef.current = userId;
    
    // Обработчики событий
    socket.on('incoming-call', (data: { caller: User, isVideo: boolean, offer?: RTCSessionDescriptionInit }) => {
      console.log('📞 Входящий звонок от:', data.caller.name, 'Видео:', data.isVideo);
      console.log('📞 Offer получен:', !!data.offer);
      
      setCallState({
        isIncoming: true,
        isOutgoing: false,
        isConnected: false,
        caller: data.caller,
        isVideo: data.isVideo
      });

      // Воспроизводим звук входящего звонка
      playIncomingRing();
      
      // Сохраняем offer для последующего использования
      if (data.offer) {
        incomingOfferRef.current = data.offer;
        console.log('💾 Offer сохранен для последующего использования');
      }
    });
    
    socket.on('call-accepted', async (data) => {
      console.log('✅ Звонок принят, получен answer');
      const { answer } = data;
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(answer);
          console.log('✅ Remote description установлен');
        } catch (error) {
          console.error('❌ Ошибка установки remote description:', error);
        }
      }
      
      // Останавливаем звуки звонка и воспроизводим звук подключения
      stopRingSounds();
      playCallConnected();
      
      setCallState(prev => ({ ...prev, isOutgoing: false, isConnected: true }));
    });
    
    socket.on('call-rejected', () => {
      console.log('❌ Звонок отклонен');
      
      // Останавливаем все звуки и воспроизводим звук завершения
      stopAllSounds();
      playCallEnded();
      
      setCallState({
        isIncoming: false,
        isOutgoing: false,
        isConnected: false,
        caller: null,
        isVideo: false
      });
    });
    
    socket.on('call-ended', () => {
      console.log('📴 Звонок завершен');
      
      // Останавливаем все звуки и воспроизводим звук завершения
      stopAllSounds();
      playCallEnded();
      
      endCall();
    });

    socket.on('ice-candidate', async (data) => {
      console.log('🧊 Получен ICE candidate');
      const { candidate } = data;
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
          console.log('✅ ICE candidate добавлен');
        } catch (error) {
          console.error('❌ Ошибка добавления ICE candidate:', error);
        }
      }
    });
    
    return socket;
  }, []);

  // Инициализация WebRTC соединения
  const initializePeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Обработчики ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId: callState.caller?._id
        });
      }
    };

    // Обработчик входящих потоков
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      // TODO: Установить remote stream в video элемент
      console.log('Получен удаленный поток:', remoteStream);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [callState.caller]);

  // Получение медиа-потока
  const getLocalStream = useCallback(async (isVideo: boolean = false) => {
    try {
      const constraints = {
        audio: true,
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Ошибка получения медиа-потока:', error);
      throw error;
    }
  }, []);

  // Начать исходящий звонок
  const startCall = useCallback(async (user: User, isVideo: boolean = false) => {
    try {
      console.log('📞 Начинаем звонок пользователю:', user.name, 'Видео:', isVideo);
      
      // Сброс флага завершения звонка
      isEndingCallRef.current = false;
      
      setCallState({
        isIncoming: false,
        isOutgoing: true,
        isConnected: false,
        caller: user,
        isVideo
      });

      // Воспроизводим звук исходящего звонка
      playOutgoingRing();

      // Получаем локальный поток
      console.log('🎥 Получаем локальный поток...');
      const localStream = await getLocalStream(isVideo);
      console.log('✅ Локальный поток получен');
      
      // Инициализируем peer connection
      console.log('🔗 Инициализируем peer connection...');
      const peerConnection = initializePeerConnection();
      
      // Добавляем локальный поток
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      console.log('✅ Локальные треки добавлены');

      // Создаем offer
      console.log('📝 Создаем offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log('✅ Offer создан и установлен как local description');

      // Отправляем сигнал через Socket.io
      if (socketRef.current) {
        console.log('📤 Отправляем call-user через Socket...');
        socketRef.current.emit('call-user', {
          targetUserId: user._id,
          offer,
          isVideo
        });
        console.log('✅ Call-user отправлен');
      } else {
        console.error('❌ Socket не инициализирован');
      }
      
    } catch (error) {
      console.error('❌ Ошибка начала звонка:', error);
      setCallState(prev => ({ ...prev, isOutgoing: false }));
    }
  }, [getLocalStream, initializePeerConnection]);

  // Принять входящий звонок
  const acceptCall = useCallback(async () => {
    try {
      console.log('✅ Принимаем входящий звонок от:', callState.caller?.name);
      setCallState(prev => ({ ...prev, isIncoming: false, isConnected: true }));
      
      // Получаем локальный поток
      console.log('🎥 Получаем локальный поток для ответа...');
      const localStream = await getLocalStream(callState.isVideo);
      console.log('✅ Локальный поток получен');
      
      // Инициализируем peer connection
      console.log('🔗 Инициализируем peer connection для ответа...');
      const peerConnection = initializePeerConnection();
      
      // Добавляем локальный поток
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      console.log('✅ Локальные треки добавлены');

      // Устанавливаем remote description из входящего offer
      if (incomingOfferRef.current) {
        console.log('📥 Устанавливаем remote description из offer...');
        await peerConnection.setRemoteDescription(incomingOfferRef.current);
        incomingOfferRef.current = null;
        console.log('✅ Remote description установлен');
      } else {
        console.error('❌ Нет сохраненного offer');
      }

      // Создаем answer
      console.log('📝 Создаем answer...');
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('✅ Answer создан и установлен как local description');

      // Отправляем ответ через Socket.io
      if (socketRef.current && callState.caller) {
        console.log('📤 Отправляем call-accepted через Socket...');
        socketRef.current.emit('call-accepted', {
          targetUserId: callState.caller._id,
          answer
        });
        console.log('✅ Call-accepted отправлен');
      } else {
        console.error('❌ Socket или caller не доступны');
      }
      
    } catch (error) {
      console.error('❌ Ошибка принятия звонка:', error);
      setCallState(prev => ({ ...prev, isConnected: false }));
    }
  }, [callState.caller, callState.isVideo, getLocalStream, initializePeerConnection]);

  // Отклонить звонок
  const rejectCall = useCallback(() => {
    console.log('❌ Отклоняем звонок от:', callState.caller?.name);
    
    // Останавливаем все звуки и воспроизводим звук завершения
    stopAllSounds();
    playCallEnded();
    
    if (socketRef.current && callState.caller) {
      socketRef.current.emit('call-rejected', {
        targetUserId: callState.caller._id
      });
      console.log('📤 Call-rejected отправлен');
    }
    
    setCallState({
      isIncoming: false,
      isOutgoing: false,
      isConnected: false,
      caller: null,
      isVideo: false
    });
  }, [callState.caller, stopAllSounds, playCallEnded]);

  // Завершить звонок
  const endCall = useCallback(() => {
    if (isEndingCallRef.current) {
      console.log('⚠️ endCall уже выполняется, пропускаем');
      return;
    }
    
    isEndingCallRef.current = true;
    console.log('📴 Завершаем звонок');
    
    // Останавливаем все звуки и воспроизводим звук завершения
    stopAllSounds();
    playCallEnded();
    
    // Останавливаем локальный поток
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      console.log('🛑 Локальный поток остановлен');
    }

    // Закрываем peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log('🔗 Peer connection закрыт');
    }

    // Отправляем завершение через Socket.io
    if (socketRef.current && callState.caller) {
      socketRef.current.emit('call-ended', {
        targetUserId: callState.caller._id
      });
      console.log('📤 Call-ended отправлен');
    }

    setCallState({
      isIncoming: false,
      isOutgoing: false,
      isConnected: false,
      caller: null,
      isVideo: false
    });
    
    // Сброс флага через небольшую задержку
    setTimeout(() => {
      isEndingCallRef.current = false;
    }, 1000);
  }, [callState.caller, stopAllSounds, playCallEnded]);

  // Симуляция входящего звонка (для тестирования)
  const simulateIncomingCall = useCallback((user: User, isVideo: boolean = false) => {
    setCallState({
      isIncoming: true,
      isOutgoing: false,
      isConnected: false,
      caller: user,
      isVideo
    });
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    return () => {
      // Очистка при размонтировании
      console.log('🧹 Очистка при размонтировании компонента');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Вызываем endCall напрямую без зависимости
      if (isEndingCallRef.current) {
        console.log('⚠️ endCall уже выполняется, пропускаем');
        return;
      }
      
      isEndingCallRef.current = true;
      console.log('📴 Завершаем звонок (cleanup)');
      
      // Останавливаем локальный поток
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        console.log('🛑 Локальный поток остановлен (cleanup)');
      }

      // Закрываем peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        console.log('🔗 Peer connection закрыт (cleanup)');
      }
    };
  }, []); // Убираем endCall из зависимостей

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    simulateIncomingCall,
    initializeSocket,
    localStream: localStreamRef.current,
    remoteStream: null // TODO: добавить remoteStream
  };
};
