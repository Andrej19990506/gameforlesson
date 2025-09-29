import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './page/LoginPage';
import HomePage from './page/HomePage';
import ProfilePage from './page/ProfilePage';
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import type { User } from './types/user';
import SplashScreen from './components/SplashScreen';

function App() {
  const {authUser, isLoading} = useContext(AuthContext) as {authUser: User | null, isLoading: boolean}
  
  // Показываем заглушку вместо приложения
  return <SplashScreen />
  
  if (isLoading) {
    return (
      <div className="bg-[url('/bgImage.svg')] bg-cover bg-center bg-no-repeat min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    )
  }
  
  return (
    <div className="bg-[url('/bgImage.svg')] bg-cover bg-center bg-no-repeat">
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
