import type { Socket } from "socket.io-client";
import type { User } from "./user";
import type { AxiosInstance } from "axios";


export interface AuthContextType {
    axios: AxiosInstance,
    authUser: User | null,
    onlineUsers: string[],
    socket: Socket | null,
    token: string | null,
    setToken: (token: string | null) => void,
    setAuthUser: (authUser: User | null) => void,
    setOnlineUsers: (onlineUsers: string[]) => void,
    setSocket: (socket: Socket | null) => void,
    login: (state: string, credentials: {email: string, password: string}) => Promise<void>,
    logout: () => Promise<void>,
    updateProfile: (body: {name: string, bio: string, profilePic: string}) => Promise<void>
    checkAuth: () => Promise<void>
    connectSocket: (userData: User) => void
    isLoading: boolean
}