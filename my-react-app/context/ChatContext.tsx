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
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    users: User[],
    getUsers: () => void,
    setUsers: (users: User[]) => void,
    unseenMessages: { [key: string]: number },
    setUnseenMessages: (unseenMessages: { [key: string]: number }) => void,
    lastMessages: { [key: string]: Message },
    setLastMessages: (lastMessages: { [key: string]: Message }) => void,
    sendMessage: (messageData: {text: string, image: string}) => void,
    getMessages: (userId: string) => Promise<void>,
    retryMessage: (messageId: string) => void,
    updateMessageSeen: (messageId: string) => void,
    deleteMessage: (messageId: string) => void,
    addReaction: (messageId: string, emoji: string) => void,
    typingUser: string[],
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    isTyping: boolean,
    setInput: (input: string) => void,
    input: string,
    isLoadingUsers: boolean
}

export const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({children}: {children: React.ReactNode}) => {

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [unseenMessages, setUnseenMessages] = useState<{ [key: string]: number }>({})
    const [lastMessages, setLastMessages] = useState<{ [key: string]: Message }>({})
    const [typingUser, setTypingUser] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const {socket, axios, authUser} = useContext(AuthContext) as AuthContextType
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    //get all users for sidebar
    const getUsers = async () => {
        try {
            setIsLoadingUsers(true)
            const {data} = await axios.get('/api/message/users')
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
                setLastMessages(data.lastMessages || {})
            }
        } catch (error: any) {
            toast.error(error.message)
            console.log(error)
        } finally {
            setIsLoadingUsers(false)
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
                   
                   // Обновляем последнее сообщение
                   setLastMessages(prev => ({
                       ...prev,
                       [selectedUser._id]: sentMessage
                   }));
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
           
           // Обновляем последнее сообщение в сайдбаре
           setLastMessages(prev => {
               const updated = { ...prev };
               Object.keys(updated).forEach(userId => {
                   if (updated[userId]._id === messageId) {
                       updated[userId] = { ...updated[userId], seen: true };
                   }
               });
               return updated;
           });
       };

    //function to delete message
    const deleteMessage = async (messageId: string) => {
        try {
            const {data} = await axios.delete(`/api/message/${messageId}`);
            if(data.success) {
                // Удаляем сообщение из локального состояния
                setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
                
                // Обновляем последние сообщения в сайдбаре
                setLastMessages(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(userId => {
                        if (updated[userId]._id === messageId) {
                            delete updated[userId];
                        }
                    });
                    return updated;
                });
            } else {
                console.error('Ошибка при удалении:', data.message);
                toast.error(data.message);
            }
        } catch (error: any) {
            console.error('Ошибка при удалении сообщения:', error);
            toast.error(error.message);
        }
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
               
               // Обновляем последнее сообщение
               setLastMessages(prev => ({
                   ...prev,
                   [selectedUser._id]: newMessage
               }));
               
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
               
               // Обновляем последнее сообщение для отправителя
               setLastMessages(prev => ({
                   ...prev,
                   [newMessage.senderId]: newMessage
               }));
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

        // Обработчик события удаления сообщения
        socket.on("messageDeleted", (data: {messageId: string}) => {
            console.log("messageDeleted received:", data);
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== data.messageId));
        })
        
    }

    //function to unsubscribe from messages for a selected user
    const unsubscribeFromMessages = () => {
        if(socket) {
            socket.off("newMessage")
            socket.off("messageSeen")
            socket.off("messageDeleted")
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

    const addReaction = async (messageId: string, emoji: string) => {
        // Мгновенное обновление UI
        setMessages(prevMessages => 
            prevMessages.map(msg => {
                if (msg._id === messageId) {
                    const existingReaction = msg.reactions?.find(
                        reaction => reaction.userId === authUser?._id && reaction.emoji === emoji
                    );

                    let newReactions = [...(msg.reactions || [])];
                    
                    if (existingReaction) {
                        // Удаляем существующую реакцию
                        newReactions = newReactions.filter(
                            reaction => !(reaction.userId === authUser?._id && reaction.emoji === emoji)
                        );
                    } else {
                        // Удаляем все предыдущие реакции этого пользователя
                        newReactions = newReactions.filter(
                            reaction => reaction.userId !== authUser?._id
                        );
                        
                        // Добавляем новую реакцию
                        newReactions.push({
                            emoji,
                            userId: authUser?._id || '',
                            createdAt: new Date().toISOString()
                        });
                    }

                    return { ...msg, reactions: newReactions };
                }
                return msg;
            })
        );


        try {
            const {data} = await axios.post(`/api/message/reaction/${messageId}`, {emoji});
            if(!data.success) {
                console.error('Ошибка при добавлении реакции:', data.message);
                toast.error(data.message);
                // Откатываем изменения при ошибке
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg._id === messageId ? data.updatedMessage : msg
                    )
                );
            }
        } catch (error: any) {
            console.error('Ошибка при добавлении реакции:', error);
            toast.error(error.message);
            // Откатываем изменения при ошибке
            setMessages(prevMessages => 
                prevMessages.map(msg => {
                    if (msg._id === messageId) {
                        // Возвращаем исходное состояние реакций
                        return { ...msg, reactions: msg.reactions?.filter(r => r.userId !== authUser?._id) || [] };
                    }
                    return msg;
                })
            );
        }
    };

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

            socket.on("messageUpdated", (updatedMessage: Message) => {
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg._id === updatedMessage._id ? updatedMessage : msg
                    )
                );
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
        lastMessages,
        setLastMessages,
        sendMessage,
        getMessages,
        retryMessage,
        updateMessageSeen,
        deleteMessage,
        addReaction,
        typingUser,
        handleInputChange,
        isTyping,
        input,
        setInput,
        isLoadingUsers,
    } as ChatContextType
        
    

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}