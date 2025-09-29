import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import type { User } from '../types/user';

interface WebRTCContextType {
  callState: {
    isIncoming: boolean;
    isOutgoing: boolean;
    isConnected: boolean;
    caller: User | null;
    isVideo: boolean;
  };
  startCall: (user: User, isVideo?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  initializeSocket: (userId: string) => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
};

interface WebRTCProviderProps {
  children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const webRTC = useWebRTC();

  return (
    <WebRTCContext.Provider value={webRTC}>
      {children}
    </WebRTCContext.Provider>
  );
};
