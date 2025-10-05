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
    isLoadingUsers: boolean;
    scrollPositions: { [key: string]: number };
    saveScrollPosition: (userId: string, position: number) => Promise<void>;
    markMessagesAsSeen: (userId: string) => Promise<void>;
    deleteChatWithUser: (userId: string) => Promise<boolean>;
    searchUsers: (query: string) => Promise<User[]>;
}

export const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({children}: {children: React.ReactNode}) => {

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    
    // Функция для воспроизведения звука уведомления
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sound/new_message.mp3');
            audio.volume = 0.5; // Устанавливаем громкость
            audio.play().catch(error => {
                console.log('Не удалось воспроизвести звук уведомления:', error);
            });
        } catch (error) {
            console.log('Ошибка при создании аудио:', error);
        }
    };

    // Функция для проверки, нужно ли воспроизводить звук для пользователя
    const shouldPlaySound = (userId: string) => {
        // Проверяем, не отключен ли звук для этого пользователя
        const mutedUsers = JSON.parse(localStorage.getItem('mutedUsers') || '{}');
        return !mutedUsers[userId];
    };
    const [messages, setMessages] = useState<Message[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [unseenMessages, setUnseenMessages] = useState<{ [key: string]: number }>({})
    const [lastMessages, setLastMessages] = useState<{ [key: string]: Message }>({})
    const [typingUser, setTypingUser] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({})
    const {socket, axios, authUser} = useContext(AuthContext) as AuthContextType
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Функция для безопасного добавления пользователя в список
    const addUserIfNotExists = async (userId: string, playSoundAfterAdd = false) => {
        setUsers(prevUsers => {
            const userExists = prevUsers.some(user => user._id === userId);
            
            if (!userExists) {
                console.log(`🔄 [ChatContext] Добавляем пользователя ${userId} в список`);
                
                // Получаем информацию о пользователе с сервера асинхронно
                axios.get(`/api/user/${userId}`)
                    .then(response => {
                        if (response.data.success) {
                            const newUser = response.data.user;
                            setUsers(currentUsers => {
                                // Проверяем еще раз, не добавился ли пользователь за это время
                                const stillNotExists = !currentUsers.some(user => user._id === newUser._id);
                                if (stillNotExists) {
                                    console.log(`✅ [ChatContext] Пользователь ${newUser.name} успешно добавлен в список`);
                                    
                                    // Воспроизводим звук если нужно
                                    if (playSoundAfterAdd && shouldPlaySound(userId)) {
                                        playNotificationSound();
                                    }
                                    
                                    return [...currentUsers, newUser];
                                }
                                return currentUsers;
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при получении информации о пользователе:', error);
                    });
            }
            
            return prevUsers;
        });
    };
    
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
            console.log(`📨 [ChatContext] Загрузка сообщений для пользователя: ${userId}`);
            const {data} = await axios.get(`/api/message/${userId}`)
            if(data.success){
                setMessages(data.messages)
                
                // Сохраняем позицию скролла если она есть в ответе
                if (data.scrollPosition !== undefined) {
                    console.log(`📨 [ChatContext] Получена позиция скролла с сервера: ${data.scrollPosition}`);
                    setScrollPositions(prev => ({
                        ...prev,
                        [userId]: data.scrollPosition
                    }));
                } else {
                    console.log(`📨 [ChatContext] Позиция скролла не найдена на сервере, используем 0`);
                }
                
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
            console.log(`❌ [ChatContext] Ошибка при загрузке сообщений:`, error);
            toast.error(error.message)
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
                   
                   // Проверяем, есть ли получатель в списке пользователей и добавляем если нужно
                   addUserIfNotExists(selectedUser._id);
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
        socket.on("newMessage", async (newMessage) => {
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
               
               // Проверяем, есть ли отправитель в списке пользователей и добавляем если нужно
               setUsers(prevUsers => {
                   const senderExists = prevUsers.some(user => user._id === newMessage.senderId);
                   
                   if (!senderExists) {
                       // Добавляем пользователя асинхронно с воспроизведением звука
                       addUserIfNotExists(newMessage.senderId, true);
                   } else {
                       // Если пользователь уже есть в списке, воспроизводим звук сразу
                       if (shouldPlaySound(newMessage.senderId)) {
                           playNotificationSound();
                       }
                   }
                   
                   return prevUsers;
               });
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

    // Функция для сохранения позиции скролла
    const saveScrollPosition = async (userId: string, position: number) => {
        try {
            console.log(`💾 [ChatContext] Сохранение позиции скролла: userId=${userId}, position=${position}`);
            await axios.post('/api/message/save-scroll-position', {
                userId,
                position
            });
            
            console.log(`✅ [ChatContext] Позиция скролла успешно отправлена на сервер`);
            
            // Обновляем локальное состояние
            setScrollPositions(prev => ({
                ...prev,
                [userId]: position
            }));
            
            console.log(`✅ [ChatContext] Локальное состояние обновлено`);
        } catch (error) {
            console.error(`❌ [ChatContext] Ошибка при сохранении позиции скролла:`, error);
        }
    };

    // Функция для пометки сообщений как прочитанных
    const markMessagesAsSeen = async (userId: string) => {
        try {
            console.log(`👁️ [ChatContext] Пометка сообщений как прочитанных от пользователя ${userId}`);
            
            await axios.put(`/api/message/mark-messages/${userId}`);
            
            // Обновляем локальное состояние сообщений
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.senderId === userId && msg.receiverId === authUser?._id 
                        ? { ...msg, seen: true }
                        : msg
                )
            );
            
            console.log(`✅ [ChatContext] Сообщения от пользователя ${userId} помечены как прочитанные`);
        } catch (error) {
            console.error(`❌ [ChatContext] Ошибка пометки сообщений как прочитанных:`, error);
        }
    };

    // Функция для удаления чата с пользователем
    const deleteChatWithUser = async (userId: string) => {
        try {
            console.log(`🗑️ [ChatContext] Удаление чата с пользователем: ${userId}`);
            
            const response = await axios.delete(`/api/message/chat/${userId}`);
            
            if (response.data.success) {
                console.log(`✅ [ChatContext] Чат успешно удален:`, response.data);
                
                // Очищаем сообщения с этим пользователем
                setMessages([]);
                
                // Обновляем список пользователей
                await getUsers();
                
                toast.success(`Чат удален. Удалено ${response.data.deletedCount} сообщений.`);
                
                return true;
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            console.error(`❌ [ChatContext] Ошибка удаления чата:`, error);
            toast.error(error.response?.data?.message || 'Ошибка при удалении чата');
            return false;
        }
    };

    // Поиск пользователей по username в базе данных
    const searchUsers = async (query: string): Promise<User[]> => {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }
            
            console.log(`🔍 [ChatContext] Поиск пользователей по запросу: "${query}"`);
            const response = await axios.get(`/api/user/search?username=${encodeURIComponent(query)}`);
            
            if (response.data.success) {
                console.log(`🔍 [ChatContext] Найдено ${response.data.users.length} пользователей`);
                return response.data.users;
            } else {
                console.log(`🔍 [ChatContext] Поиск не дал результатов:`, response.data.message);
                return [];
            }
        } catch (error: any) {
            console.error(`❌ [ChatContext] Ошибка поиска пользователей:`, error);
            toast.error('Ошибка при поиске пользователей');
            return [];
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

            socket.on("chatDeleted", (data: {deletedBy: string, deletedWith: string}) => {
                console.log(`🗑️ [ChatContext] Получено событие удаления чата:`, data);
                console.log(`🗑️ [ChatContext] Текущий selectedUser:`, selectedUser);
                console.log(`🗑️ [ChatContext] Сравнение ID:`, {
                    selectedUserId: selectedUser?._id,
                    selectedUserIdString: selectedUser?._id?.toString(),
                    deletedWith: data.deletedWith,
                    deletedWithString: data.deletedWith?.toString(),
                    isMatch: selectedUser?._id?.toString() === data.deletedWith?.toString()
                });
                
                // Если удаленный чат - это текущий выбранный пользователь
                // Проверяем оба случая: если мы удалили чат с кем-то, или если с нами удалили чат
                const isCurrentUserDeletedBy = selectedUser && selectedUser._id.toString() === data.deletedBy.toString();
                const isCurrentUserDeletedWith = selectedUser && selectedUser._id.toString() === data.deletedWith.toString();
                
                if (isCurrentUserDeletedBy || isCurrentUserDeletedWith) {
                    console.log(`🗑️ [ChatContext] Удален чат с текущим пользователем, очищаем сообщения`);
                    console.log(`🗑️ [ChatContext] Причина:`, {
                        isCurrentUserDeletedBy,
                        isCurrentUserDeletedWith,
                        selectedUserId: selectedUser._id,
                        deletedBy: data.deletedBy,
                        deletedWith: data.deletedWith
                    });
                    setMessages([]);
                    // НЕ закрываем чат, оставляем пользователя выбранным для показа пустого состояния
                } else {
                    console.log(`🗑️ [ChatContext] Удален чат с другим пользователем, не очищаем текущий чат`);
                }
                
                // Обновляем список пользователей
                getUsers();
                
                toast.success('Чат был удален другим пользователем. Сообщения очищены.');
            });
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
        scrollPositions,
        saveScrollPosition,
        markMessagesAsSeen,
        deleteChatWithUser,
        searchUsers,
    } as ChatContextType
        
    

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}