import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import type { User } from "../src/types/user";
import type { Socket } from "socket.io-client";
import type { AuthContextType } from "../src/types/auth.ts";

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
axios.defaults.baseURL = backendUrl

export const AuthContext = createContext<AuthContextType | null>(null)


export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    //check if user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const {data} = await axios.get('/api/auth/checkauth')
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    //Login function to handle user authentication and scoket connection
    const login = async (state: string, credentials: {email: string, password: string}) => {
        try {
            const {data} = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.userData)
                connectSocket(data.userData)
                // Исправляем заголовок аутентификации
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
                setToken(data.token)
                localStorage.setItem('token', data.token)
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        } catch (error: any) {
            toast.error(error.message as string)
        }
    }



    //Logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem('token')
        setToken(null)
        setAuthUser(null)
        setOnlineUsers([])
        axios.defaults.headers.common['Authorization'] = null
        toast.success('Logged out successfully')
        socket?.disconnect()
    }

    //Update user function to handle user profile updates
    const updateProfile = async (body: {name: string, bio: string, profilePic: string}) => {
        try {
            console.log('🔄 [AuthContext] updateProfile вызван с данными:', body);
            const{data} = await axios.put('/api/user/update-profile', body);
            console.log('📡 [AuthContext] Ответ сервера:', data);
            if(data.success){
                console.log('✅ [AuthContext] Обновляем authUser:', data.user);
                setAuthUser(data.user)
                toast.success('User updated successfully')
            } else {
                console.log('❌ [AuthContext] Сервер вернул success: false');
            }
        } catch (error: any) {
            console.error('❌ [AuthContext] Ошибка в updateProfile:', error);
            toast.error(error.message)
        }
    }


    // connect socket function to handle scoket connection  and online users updates
    const connectSocket = (userData: User) => {
        if(!userData||socket?.connected) return
        if(socket) socket.disconnect()
        
        // Получаем токен из localStorage или состояния
        const authToken = token || localStorage.getItem('token');
        
        if (!authToken) {
            console.error('❌ [AuthContext] Токен не найден для WebSocket подключения');
            return;
        }
        
        console.log('🔐 [AuthContext] Подключение WebSocket с аутентификацией для пользователя:', userData.name);
        
        const newSocket = io(backendUrl, {
            auth: {
                token: authToken  // ✅ БЕЗОПАСНО! Передаем JWT токен
            }
        });
        
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            console.log('👥 [AuthContext] Получен список онлайн пользователей:', userIds);
            setOnlineUsers(userIds)
        });
        
        // Обработка ошибок аутентификации
        newSocket.on("connect_error", (error) => {
            console.error('❌ [AuthContext] Ошибка подключения WebSocket:', error.message);
            if (error.message.includes('Authentication')) {
                toast.error('Ошибка аутентификации WebSocket');
                logout(); // Выходим из системы при ошибке аутентификации
            }
        });
        
        newSocket.on("disconnect", (reason) => {
            console.log('🔌 [AuthContext] WebSocket отключен:', reason);
        });
    }

    useEffect(() => {
       if(token){
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        checkAuth()
       } else {
        setIsLoading(false)
       }
    }, [token])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        token,
        setToken,
        setAuthUser,
        setOnlineUsers,
        setSocket,
        login,
        logout,
        updateProfile,
        checkAuth,
        connectSocket,
        isLoading,
    } as AuthContextType
    
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}