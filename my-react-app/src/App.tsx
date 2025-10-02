import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './page/LoginPage';
import HomePage from './page/HomePage';
import ProfilePage from './page/ProfilePage';
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import type { User } from './types/user';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const {authUser, isLoading} = useContext(AuthContext) as {authUser: User | null, isLoading: boolean}
  
  
  if (isLoading) {
    return <LoadingScreen />
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
