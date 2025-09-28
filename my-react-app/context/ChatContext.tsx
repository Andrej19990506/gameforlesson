import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { User } from "../src/types/user";
import { AuthContext } from "./AuthContext";
import type { Socket } from "socket.io-client";
import type { AxiosInstance } from "axios";
import { toast } from "react-hot-toast";
import type { Message } from "../src/types/message.ts";
import type { AuthContextType } from "../src/types/auth.ts";


export interface ChatContextType {
    selectedUser: User | null,
    setSelectedUser: (selectedUser: User | null) => void,
    messages: Message[],
    setMessages: (messages: Message[]) => void,
    users: User[],
    getUsers: () => void,
    setUsers: (users: User[]) => void,
    unseenMessages: { [key: string]: number },
    setUnseenMessages: (unseenMessages: { [key: string]: number }) => void,
    sendMessage: (messageData: {text: string, image: string}) => void,
    getMessages: (userId: string) => void
    typingUser: string[],
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    isTyping: boolean
    input: string
}

export const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({children}: {children: React.ReactNode}) => {

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [unseenMessages, setUnseenMessages] = useState<{ [key: string]: number }>({})
    const [typingUser, setTypingUser] = useState<string[]>([]);
    const {socket, axios, authUser} = useContext(AuthContext) as AuthContextType
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    //get all users for sidebar
    const getUsers = async () => {
        try {
            const {data} = await axios.get('/api/message/users')
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error: any) {
            toast.error(error.message)
            console.log(error)
        }
    }

    //get messages for a selected user
    const getMessages = async (userId: string) => {
        try {
            const {data} = await axios.get(`/api/message/${userId}`)
            if(data.success){
                setMessages(data.messages)
            }
        } catch (error: any) {
            toast.error(error.message)
            console.log(error)
        }
    }

    //send message to a selected user
    const sendMessage = async (messageData: {text: string, image: string}) => {
        try {
            const {data} = await axios.post(`/api/message/send/${selectedUser?._id}`, messageData)
            if(data.success){
                setMessages((prevMessages) => [...prevMessages, data.message])
            }else{
                toast.error(data.message)
            }
        } catch (error: any) {
            toast.error(error.message)
            console.log(error)
        }
    }

    //finction to subscribe to messages for a selected user
    const subscribeToMessages = async () => {
        if(!socket) return
        socket.on("newMessage", (newMessage) => {
            newMessage._id = newMessage._id.toString()
            newMessage.senderId = newMessage.senderId.toString()
            newMessage.receiverId = newMessage.receiverId.toString()

            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true
                setMessages((prevMessages) => [...prevMessages, newMessage])
                axios.put(`/api/message/mark/${newMessage._id}`);
            }
            else{
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1)
                }))
            }
        })
        
    }

    //function to unsubscribe from messages for a selected user
    const unsubscribeFromMessages = () => {
        if(socket) socket.off("newMessage")
    }

    //function to handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)

        if(!isTyping){
            setIsTyping(true);
            socket?.emit("typing", {
                receiverId: selectedUser?._id,
                isTyping: true
            }) 
        }

        if(typingTimeoutRef.current){
            clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            socket?.emit("typing", {
                receiverId: selectedUser?._id,
                isTyping: false
            })
        }, 1000)
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    useEffect(() => {
        if(socket){
            socket.on("userTyping", (data: {senderId: string, isTyping: boolean}) => {
                if(data.senderId !== authUser?._id){
                    setTypingUser(prev =>
                        data.isTyping
                        ? [...prev, data.senderId]
                        : prev.filter(id => id !== data.senderId)
                    )
                }
            })
        }
    }, [socket, selectedUser])
    
    const value = {
        selectedUser,
        setSelectedUser,
        messages,
        setMessages,
        users,
        getUsers,
        setUsers,
        unseenMessages,
        setUnseenMessages,
        sendMessage,
        getMessages,
        typingUser,
        handleInputChange,
        isTyping,
        input,
        setInput,
    } as ChatContextType
        
    

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}