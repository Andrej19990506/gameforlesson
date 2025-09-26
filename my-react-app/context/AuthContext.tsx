import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import type { User } from "../src/types/user";
import type { Socket } from "socket.io-client";
import type { AuthContextType } from "../src/types/auth.ts";

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = backendUrl

export const AuthContext = createContext<AuthContextType | null>(null)


export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

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
        }
    }

    //Login function to handle user authentication and scoket connection
    const login = async (state: string, credentials: {email: string, password: string}) => {
        try {
            const {data} = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.userData)
                connectSocket(data.userData)
                axios.defaults.headers.common['token'] = data.token
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
        axios.defaults.headers.common['token'] = null
        toast.success('Logged out successfully')
        socket?.disconnect()
    }

    //Update user function to handle user profile updates
    const updateProfile = async (body: {name: string, bio: string, profilePic: string}) => {
        try {
            const{data} = await axios.put('/api/auth/update-profile', body);
            if(data.success){
                setAuthUser(data.user)
                toast.success('User updated successfully')
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }


    // connect socket function to handle scoket connection  and online users updates
    const connectSocket = (userData: User) => {
        if(!userData||socket?.connected) return
        if(socket) socket.disconnect()
        const newSocket = io(backendUrl,{
            query:{
                userId: userData._id
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds)
        });
    }

    useEffect(() => {
       if(token){
        axios.defaults.headers.common['token'] = token
       }
       checkAuth()
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
    } as AuthContextType
    
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}