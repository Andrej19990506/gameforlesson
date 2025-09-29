import { useState, useEffect, useRef } from 'react';
import type { User } from '../types/user';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  caller: User | null;
  isIncoming: boolean;
  isConnected?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  isVideo?: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

const CallModal = ({ 
  isOpen, 
  caller, 
  isIncoming, 
  isConnected = false,
  onAccept, 
  onReject, 
  onEnd,
  isVideo = false,
  localStream,
  remoteStream
}: CallModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<number | null>(null);

  // Управление длительностью звонка
  useEffect(() => {
    if (isConnected) {
      setCallDuration(0); // Сброс при подключении
      setIsConnecting(false); // Сброс состояния подключения
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  // Подключение видео потоков
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsConnecting(true);
    onAccept?.();
  };

  const handleReject = () => {
    onReject?.();
  };

  const handleEnd = () => {
    onEnd?.();
  };

  if (!isOpen || !caller) return null;

  // Определяем статус звонка
  const getCallStatus = () => {
    if (isConnected) return 'Соединено';
    if (isConnecting) return 'Подключение...';
    if (isIncoming) return 'Входящий звонок';
    return 'Исходящий звонок';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={`bg-gray-800 rounded-xl p-6 w-full mx-4 ${isVideo && isConnected ? 'max-w-4xl' : 'max-w-md'}`}>
        {/* Заголовок */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <img 
              src={caller.profilePic || '/avatar_icon.png'} 
              alt={caller.name}
              className="w-16 h-16 rounded-full"
            />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{caller.name}</h3>
          <p className="text-gray-400">
            {getCallStatus()}
            {isVideo && ' (видео)'}
          </p>
          {isConnected && (
            <p className="text-violet-400 font-mono text-lg mt-2">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* Видео (если видеозвонок) */}
        {isVideo && (isConnected || isConnecting) && (
          <div className="mb-6">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden h-64">
              {/* Удаленное видео */}
              <video 
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Локальное видео (маленькое в углу) */}
              {localStream && (
                <video 
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute top-2 right-2 w-24 h-32 object-cover rounded-lg border-2 border-violet-400"
                />
              )}
              
              {/* Заглушка если нет удаленного видео */}
              {!remoteStream && isConnected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <img 
                        src={caller.profilePic || '/avatar_icon.png'} 
                        alt={caller.name}
                        className="w-12 h-12 rounded-full"
                      />
                    </div>
                    <p className="text-gray-400 text-sm">Ожидание видео...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Статус подключения */}
        {isConnecting && !isConnected && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <p className="text-gray-400 mt-2">Подключение...</p>
          </div>
        )}

        {/* Статус соединения */}
        {isConnected && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-green-400 text-sm">Соединено</p>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex justify-center gap-4">
          {isIncoming && !isConnected ? (
            <>
              <button
                onClick={handleReject}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
              <button
                onClick={handleAccept}
                className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={handleEnd}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
