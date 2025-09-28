import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { User } from "../src/types/user";
import { AuthContext } from "./AuthContext";
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
    getMessages: (userId: string) => void,
    retryMessage: (messageId: string) => void,
    updateMessageSeen: (messageId: string) => void,
    typingUser: string[],
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    isTyping: boolean,
    setInput: (input: string) => void,
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
                
                // Отправляем события прочтения для всех непрочитанных сообщений от выбранного пользователя
                data.messages.forEach((message: any) => {
                    if (message.senderId === userId && !message.seen) {
                        socket?.emit("messageSeen", {
                            messageId: message._id,
                            senderId: message.senderId
                        });
                    }
                });
            }
        } catch (error: any) {
            toast.error(error.message)
            console.log(error)
        }
    }

    //send message to a selected user
    const sendMessage = async (messageData: {text: string, image: string}) => {
        if (!selectedUser) return;
        
        // Создаем временное сообщение со статусом "sending"
        const tempMessage: Message = {
            _id: `temp_${Date.now()}`,
            text: messageData.text,
            image: messageData.image,
            senderId: authUser?._id || '',
            receiverId: selectedUser._id,
            seen: false,
            createdAt: new Date().toISOString(),
            status: 'sending'
        };
        
        // Добавляем временное сообщение в UI
        setMessages((prevMessages) => [...prevMessages, tempMessage]);
        
        try {
            const {data} = await axios.post(`/api/message/send/${selectedUser._id}`, messageData)
            if(data.success){
                // Заменяем временное сообщение на реальное со статусом "sent"
                const sentMessage = { ...data.message, status: 'sent' as const, seen: false };
                setMessages((prevMessages) => 
                    prevMessages.map(msg => 
                        msg._id === tempMessage._id ? sentMessage : msg
                    )
                );
            }else{
                // Обновляем статус на "error"
                setMessages((prevMessages) => 
                    prevMessages.map(msg => 
                        msg._id === tempMessage._id ? { ...msg, status: 'error' as const } : msg
                    )
                );
                toast.error(data.message)
            }
        } catch (error: any) {
            // Обновляем статус на "error"
            setMessages((prevMessages) => 
                prevMessages.map(msg => 
                    msg._id === tempMessage._id ? { ...msg, status: 'error' as const } : msg
                )
            );
            toast.error(error.message)
            console.log(error)
        }
    }

    //function to retry sending a failed message
    const retryMessage = async (messageId: string) => {
        const message = messages.find(msg => msg._id === messageId);
        if (!message || !selectedUser) return;
        
        // Обновляем статус на "sending"
        setMessages((prevMessages) => 
            prevMessages.map(msg => 
                msg._id === messageId ? { ...msg, status: 'sending' as const } : msg
            )
        );
        
        try {
            const {data} = await axios.post(`/api/message/send/${selectedUser._id}`, {
                text: message.text,
                image: message.image
            });
            if(data.success){
                // Заменяем сообщение на новое со статусом "sent"
                const sentMessage = { ...data.message, status: 'sent' as const, seen: false };
                setMessages((prevMessages) => 
                    prevMessages.map(msg => 
                        msg._id === messageId ? sentMessage : msg
                    )
                );
            }else{
                // Обновляем статус на "error"
                setMessages((prevMessages) => 
                    prevMessages.map(msg => 
                        msg._id === messageId ? { ...msg, status: 'error' as const } : msg
                    )
                );
                toast.error(data.message)
            }
        } catch (error: any) {
            // Обновляем статус на "error"
            setMessages((prevMessages) => 
                prevMessages.map(msg => 
                    msg._id === messageId ? { ...msg, status: 'error' as const } : msg
                )
            );
            toast.error(error.message)
            console.log(error)
        }
    }

    //function to update message seen status
    const updateMessageSeen = (messageId: string) => {
        console.log("updateMessageSeen called for:", messageId);
        setMessages((prevMessages) => {
            const updated = prevMessages.map(msg => 
                msg._id === messageId ? { ...msg, seen: true } : msg
            );
            console.log("Updated messages:", updated);
            return updated;
        });
    };

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
                
                // Отправляем событие прочтения отправителю
                socket.emit("messageSeen", {
                    messageId: newMessage._id,
                    senderId: newMessage.senderId
                });
            }
            else{
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1)
                }))
            }
        })

        // Обработчик события прочтения сообщения
        socket.on("messageSeen", (data: {messageId: string, senderId: string}) => {
            console.log("messageSeen received:", data, "authUser._id:", authUser?._id);
            // Обновляем статус прочтения только для сообщений от текущего пользователя
            // data.senderId - это ID отправителя сообщения (наш ID)
            if(data.senderId === authUser?._id) {
                console.log("Updating message seen status for:", data.messageId);
                updateMessageSeen(data.messageId);
            }
        })
        
    }

    //function to unsubscribe from messages for a selected user
    const unsubscribeFromMessages = () => {
        if(socket) {
            socket.off("newMessage")
            socket.off("messageSeen")
        }
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
        retryMessage,
        updateMessageSeen,
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