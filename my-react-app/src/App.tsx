import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './page/LoginPage';
import HomePage from './page/HomePage';
import ProfilePage from './page/ProfilePage';
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext';
import { useContext, useEffect } from 'react';
import type { User } from './types/user';
import LoadingScreen from './components/LoadingScreen';
import { usePWA } from './hooks/usePWA';

function App() {
  const {authUser, isLoading} = useContext(AuthContext) as {authUser: User | null, isLoading: boolean}
  const { isPWA, updateStatusBar } = usePWA();
  
  // Обновляем системную панель при загрузке
  useEffect(() => {
    if (isPWA) {
      updateStatusBar('#1a1a2e');
      console.log('🎨 [App] PWA режим активен, системная панель настроена');
    }
  }, [isPWA, updateStatusBar]);
  if (isLoading) {
    return <LoadingScreen />
  }
  
  return (
    <div className="pwa-container bg-[url('/bgImage.svg')] bg-cover bg-center bg-no-repeat">
      {/* Overlay для системной панели */}
      <div className="status-bar-overlay"></div>
      <Toaster />
    <Routes>
      <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
    </Routes>
    </div>
  );
}

export default App
