import assets from '../assets/assets'
import { useRef, useEffect, useContext, useState } from 'react'
import { formatMessageTime } from '../lib/utils'
import type { ChatContextType } from '../../context/ChatContext'
import { ChatContext } from '../../context/ChatContext'
import type { AuthContextType } from '../types/auth'
import { AuthContext } from '../../context/AuthContext'
import type { Message } from '../types/message'
import { formatLastSeen } from '../lib/utils'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react';

const ChatContainer = () => {
    const{selectedUser, setSelectedUser,sendMessage, getMessages, messages, handleInputChange, input, setInput, retryMessage, typingUser, deleteMessage, addReaction} = useContext(ChatContext) as ChatContextType
    const{onlineUsers, authUser} = useContext(AuthContext) as AuthContextType
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMessageMenu, setShowMessageMenu] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiReactions, setShowEmojiReactions] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleEmojiClick = (emojiObject: any) => {
        setInput(input + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleMessageClick = (e: React.MouseEvent, message: Message, messageElement: HTMLElement) => {
        console.log('Message clicked:', message.senderId, authUser?._id);
        e.preventDefault();
        e.stopPropagation();
        
        // Если кликаем на то же сообщение - закрываем меню
        if (selectedMessage && selectedMessage._id === message._id) {
            setShowMessageMenu(false);
            setShowEmojiReactions(false);
            setSelectedMessage(null);
            return;
        }
        
        // Если кликаем на другое сообщение - только закрываем предыдущее меню
        if (selectedMessage && selectedMessage._id !== message._id) {
            setShowMessageMenu(false);
            setShowEmojiReactions(false);
            setSelectedMessage(null);
            return;
        }
        
        // Если меню закрыто - открываем для нового сообщения
        const rect = messageElement.getBoundingClientRect();
        const chatContainer = chatContainerRef.current;
        
        // Безопасные зоны: 20% слева и справа
        const safeZoneLeft = window.innerWidth * 0.2;
        const safeZoneRight = window.innerWidth * 0.8;
        const menuWidth = 130;
        
        // Если наше сообщение - слева, если не наше - справа
        let menuX = message.senderId === authUser?._id ? rect.left - menuWidth : rect.right + 10;
        
        // Проверяем безопасные зоны
        if (menuX < safeZoneLeft) {
            menuX = safeZoneLeft;
        } else if (menuX + menuWidth > safeZoneRight) {
            menuX = safeZoneRight - menuWidth;
        }
        
        // Адаптивное позиционирование по вертикали
        let menuY = rect.top;
        if (chatContainer) {
            const containerRect = chatContainer.getBoundingClientRect();
            const messageCenter = rect.top + rect.height / 2;
            const containerCenter = containerRect.top + containerRect.height / 2;
            
            // Если сообщение в нижней половине контейнера - позиционируем меню снизу
            if (messageCenter > containerCenter) {
                menuY = rect.bottom - 120; // Высота меню примерно 120px
            }
        }
        
        console.log('Opening menu at:', menuX, menuY);
        setSelectedMessage(message);
        setMenuPosition({ x: menuX, y: menuY });
        setShowMessageMenu(true);
        setShowEmojiReactions(false);
    };

    const handleDeleteMessage = async (messageId: string) => {
        await deleteMessage(messageId);
        setShowMessageMenu(false);
        setSelectedMessage(null);
        setShowDeleteConfirm(false);
    };

    const handleDeleteClick = (message: Message) => {
        setSelectedMessage(message);
        setShowMessageMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleEditMessage = (message: Message) => {
        setInput(message.text);
        setShowMessageMenu(false);
        setSelectedMessage(null);
        // TODO: Добавить логику редактирования
    };

    const handleEmojiReaction = (emoji: string) => {
        if (selectedMessage) {
            addReaction(selectedMessage._id, emoji);
        }
        setShowMessageMenu(false);
        setSelectedMessage(null);
        setShowEmojiReactions(false);
    };

    const handleReactionClick = (messageId: string, emoji: string) => {
        addReaction(messageId, emoji);
    };

    const handleShowEmojiReactions = () => {
        setShowMessageMenu(false);
        setShowEmojiReactions(true);
    };

    const handleCloseEmojiReactions = () => {
        setShowEmojiReactions(false);
        setShowMessageMenu(true);
    };

    const getSafeMenuPosition = (x: number, y: number, menuWidth: number = 200) => {
        const safeZoneLeft = 20;
        const safeZoneRight = window.innerWidth - 20;
        const safeZoneTop = 80; // Высота хедера
        
        let safeX = x;
        let safeY = y;
        
        if (safeX < safeZoneLeft) {
            safeX = safeZoneLeft;
        } else if (safeX + menuWidth > safeZoneRight) {
            safeX = safeZoneRight - menuWidth;
        }
        
        if (safeY < safeZoneTop) {
            safeY = safeZoneTop;
        }
        
        return { x: safeX, y: safeY };
    };

    const handleCopyMessage = (message: Message) => {
        navigator.clipboard.writeText(message.text);
        setShowMessageMenu(false);
        setSelectedMessage(null);
        // TODO: Добавить уведомление о копировании
    };

    const handleForwardMessage = (message: Message) => {
        setInput(`Переслано: ${message.text}`);
        setShowMessageMenu(false);
        setSelectedMessage(null);
        // TODO: Добавить логику пересылки
    };

    // Компонент для отображения статуса сообщения
    const MessageStatus = ({ status, messageId, seen, messageIndex }: { status?: string, messageId: string, seen?: boolean, messageIndex: number }) => {
        if (!status) return null;
        
        // Проверяем, есть ли новые сообщения после этого
        const hasNewerMessages = messages.slice(messageIndex + 1).some(msg => msg.senderId !== authUser?._id);
        
        switch (status) {
            case 'sending':
                return (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                    </div>
                );
            case 'sent':
                return (
                    <div className="flex items-center">
                        {seen && !hasNewerMessages ? (
                            // Две галочки - прочитано (только если нет новых сообщений)
                            <div className="flex items-center gap-1">
                                <div className="flex">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400 -ml-1">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                </div>
                                <span className="text-gray-400 text-xs">Просмотрено</span>
                            </div>
                        ) : seen ? (
                            // Никаких галочек - прочитано, но есть новые сообщения
                            null
                        ) : (
                            // Одна галочка - отправлено, но не прочитано
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                        )}
                    </div>
                );
            case 'error':
                return (
                    <button 
                        onClick={() => retryMessage(messageId)}
                        className="flex items-center text-red-400 hover:text-red-300"
                        title="Повторить отправку"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                        </svg>
                    </button>
                );
            default:
                return null;
        }
    };

    //function to handle send message
    const handleSendMessage = async () => {
        if(input.trim() === '') return null;
        await sendMessage({text: input.trim(), image: ''})
        handleInputChange({target: {value: ''}} as React.ChangeEvent<HTMLInputElement>)
    }

    //function to handle send image
    const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if(!file||!file.type.startsWith('image/')){
            toast.error('Please select an image')
            return;
        }
        const reader = new FileReader()

        reader.onload = async () => {
            await sendMessage({ text: '', image: reader.result as string});
            (e.target as HTMLInputElement).value = '';
        }

        reader.readAsDataURL(file)
    }

    const scrollEnd = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if(selectedUser){
            setIsLoadingMessages(true);
            getMessages(selectedUser._id).finally(() => {
                setIsLoadingMessages(false);
            });
        }
    }, [selectedUser])

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.senderId !== authUser?._id) {
                // Новое сообщение от другого пользователя
                if (lastReadMessageId && lastMessage._id !== lastReadMessageId) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        }
    }, [messages, authUser?._id, lastReadMessageId])

    const handleScrollToBottom = () => {
        if (scrollEnd.current) {
            scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
            setShowScrollButton(false);
            setUnreadCount(0);
            if (messages && messages.length > 0) {
                setLastReadMessageId(messages[messages.length - 1]._id);
            }
        }
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isAtBottom);
        }
    };

    // Закрытие меню при клике вне его и блокировка скролла
    useEffect(() => {
        const handleClickOutside = () => {
            if (showMessageMenu) {
                setShowMessageMenu(false);
                setSelectedMessage(null);
            }
        };

        if (showMessageMenu) {
            // Блокируем скролл контейнера чата
            if (chatContainerRef.current) {
                chatContainerRef.current.style.overflow = 'hidden';
            }
            document.addEventListener('click', handleClickOutside);
        } else {
            // Разблокируем скролл контейнера чата
            if (chatContainerRef.current) {
                chatContainerRef.current.style.overflow = 'auto';
            }
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
            if (chatContainerRef.current) {
                chatContainerRef.current.style.overflow = 'auto';
            }
        };
    }, [showMessageMenu, showEmojiReactions]);
    
    
    
    return selectedUser ? (
            <div className='h-full overflow-scroll relative backdrop-blur-lg max-md:h-screen max-md:rounded-none max-md:border-none' style={{backgroundColor: 'var(--color-gray-800)'}}>
                {/*Header*/}
                <div className='flex items-center gap-3 py-4 mx-4 border-stone-500 max-md:mx-0 max-md:px-4 rounded-b-lg shadow-lg border-b border-violet-400/20' style={{backgroundColor: 'var(--color-gray-900)'}}>
                    <div className="relative">
                        <img 
                            src={selectedUser.profilePic||assets.avatar_icon} 
                            alt='' 
                            className={`w-10 h-10 rounded-full border-2 shadow-md ${
                                onlineUsers.includes(selectedUser._id) 
                                    ? 'border-green-400' 
                                    : 'border-violet-400/50'
                            }`} 
                        />
                    </div>
                    <div className='flex-1 text-white'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xl font-semibold text-white drop-shadow-sm'>{selectedUser.name}</span>
                        </div>
                        <div className={`text-sm font-medium ${
                            onlineUsers.includes(selectedUser._id) 
                                ? 'text-green-400' 
                                : 'text-violet-200'
                        }`}>
                            {typingUser.includes(selectedUser._id) ? (
                                <div className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 animate-pulse">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                    </div>
                                </div>
                            ) : onlineUsers.includes(selectedUser._id) ? (
                                'в сети'
                            ) : (
                                `Был(а) в сети ${formatLastSeen(selectedUser.lastSeen)}`
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedUser(null)} 
                        className='md:hidden p-3 bg-violet-600/20 hover:bg-violet-600/40 rounded-full transition-all duration-200 shadow-md hover:shadow-lg'
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                    </button>
                    <button className='max-md:hidden p-2 hover:bg-violet-500/20 rounded-lg transition-colors'>
                        <img src={assets.help_icon} alt='help' className='max-w-5' />
                    </button>
                </div>
                {/*Chat Container*/}
                <div ref={chatContainerRef} onScroll={handleScroll} className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-8'>
                
                {/* Loading Messages */}
                {isLoadingMessages && (
                    <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                            </div>
                            <div className="text-center">
                                <p className="text-violet-400 font-medium">Загружаем сообщения...</p>
                                <p className="text-gray-400 text-sm">Пожалуйста, подождите</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {!isLoadingMessages && messages.filter(msg => msg && msg.senderId).map((msg, index) => {
                    const prevMsg = messages[index - 1];
                    const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
                    const isOwnMessage = msg.senderId === authUser?._id;
                    const isLastMessage = index === messages.filter(msg => msg && msg.senderId).length - 1;
                    
                    return (
                    <div key={index} data-message-id={msg._id} className={`flex items-end gap-2 justify-end ${msg?.senderId !== authUser?._id && "flex-row-reverse"} ${isSameSender && isOwnMessage ? 'mt-0.5' : 'mt-2'} ${isLastMessage ? 'mb-0' : ''}`}>
                            <div className="flex flex-col items-end">
                            {msg.image ? (
                                    <img src={msg.image} alt='image' className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-2' />
                                ) : (
                                    <div 
                                        onClick={(e) => handleMessageClick(e, msg, e.currentTarget)}
                                        className={`px-2 py-1 max-w-[200px] md:text-sm font-light rounded-lg ${isOwnMessage ? 'mb-2' : 'mb-0'} break-words text-white cursor-pointer transition-colors ${msg.senderId === authUser?._id ? 'bg-violet-900/95 hover:bg-violet-600 rounded-br-none' : 'bg-gray-900 hover:bg-gray-600 rounded-bl-none'}`}
                                    >
                                        <div className="flex items-end justify-between">
                                            <span className="flex-1">{msg.text}</span>
                                            <span className="text-xs text-gray-400 ml-2">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                        {/* Реакции внутри пузырька слева */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className="flex justify-start mt-1">
                                                <div className="bg-gray-600/80 px-2 py-1 rounded-full flex items-center gap-1">
                                                    {msg.reactions.map((reaction, reactionIndex) => (
                                                        <div 
                                                            key={reactionIndex} 
                                                            className="flex items-center gap-1 cursor-pointer hover:bg-gray-500/50 rounded px-1 py-0.5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReactionClick(msg._id, reaction.emoji);
                                                            }}
                                                        >
                                                            <span className="text-sm">
                                                                {reaction.emoji}
                                                            </span>
                                                            <img 
                                                                src={reaction.userId === authUser?._id ? authUser.profilePic || assets.avatar_icon : selectedUser.profilePic || assets.avatar_icon} 
                                                                alt="avatar" 
                                                                className="w-4 h-4 rounded-full"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Статус сообщения только для своих сообщений */}
                                {msg.senderId === authUser?._id && (
                                    <div>
                                        <MessageStatus status={msg.status} messageId={msg._id} seen={msg.seen} messageIndex={index} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Empty State */}
                {!isLoadingMessages && messages.filter(msg => msg && msg.senderId).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Начните общение</h3>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Отправьте первое сообщение, чтобы начать разговор с {selectedUser.name}
                        </p>
                    </div>
                )}
                    
                    {/* Индикатор "печатает..." - только для первого сообщения после нашего */}
                    {typingUser.includes(selectedUser._id) && (() => {
                        // Проверяем, есть ли сообщения от собеседника после нашего последнего сообщения
                        const lastMessageFromUs = [...messages].reverse().find(msg => msg.senderId === authUser?._id);
                        const hasNewMessagesFromThem = lastMessageFromUs ? 
                            messages.some(msg => msg.senderId === selectedUser._id && new Date(msg.createdAt) > new Date(lastMessageFromUs.createdAt)) : 
                            false;
                        
                        // Показываем индикатор только если нет новых сообщений от собеседника после нашего последнего
                        return !hasNewMessagesFromThem ? (
                            <div className="absolute bottom-20 left-3 flex items-end gap-2">
                                <div className='text-center text-xs'>
                                    <img src={selectedUser.profilePic || assets.avatar_icon} alt='user' className='w-7 rounded-full' />
                                </div>
                                <div className="flex flex-col items-start">
                                    <div className="p-2 max-w-[200px] md:text-sm font-light rounded-lg bg-gray-500/30 text-white rounded-bl-none">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-300">печатает</span>
                                            <div className="flex space-x-1">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        </div>
                        ) : null;
                    })()}
                    <div ref={scrollEnd}></div>
                </div>
                
                {/* Кнопка скролла вниз */}
                {showScrollButton && (
                    <div className="absolute bottom-20 right-4 z-40">
                        <button
                            onClick={handleScrollToBottom}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full p-3 shadow-lg transition-colors relative"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
                {/*Chat bottom-area*/}
                <div className='absolute bottom-0 left-0 right-0 flex items-center p-3 max-md:px-4'>
                    <div className='flex-1 flex items-center px-3 rounded-full' style={{backgroundColor: 'var(--color-gray-900)'}}>
                        <button 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className='mr-2 text-white hover:text-gray-300'
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                    <circle cx="9" cy="9" r="1"/>
                                    <circle cx="15" cy="9" r="1"/>
                                </svg>
                        </button>
                        <input onChange={(e) => handleInputChange(e)} value={input} onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(): null} type='text' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' placeholder='Message...' />
                        <input onChange={(e) => handleSendImage(e)} type='file' id='image' accept='image/png, image/jpg, image/jpeg' hidden/>
                        <label htmlFor='image' className='cursor-pointer'>
                            <img src={assets.gallery_icon} alt='gallery' className='w-5 mr-2 cursor-pointer' />
                        </label>
                        <button onClick={() => handleSendMessage()} className='ml-2 p-1 text-white hover:text-gray-300'>
                            <img src={assets.send_button} alt='send' className='w-6 cursor-pointer' />
                        </button>
                    </div>
                    {showEmojiPicker && (
        <div className='absolute bottom-16 left-4 z-50'>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
    )}
                </div>
                
                {/* Эмодзи реакции */}
                {showMessageMenu && selectedMessage && (
                    <div 
                        className='fixed z-50 bg-gray-800/95 rounded-lg shadow-lg'
                        style={{ 
                            left: getSafeMenuPosition(menuPosition.x, menuPosition.y - 50, 200).x, 
                            top: getSafeMenuPosition(menuPosition.x, menuPosition.y - 50, 200).y
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='flex items-center gap-1 justify-center'>
                            {['😀', '😂', '😍', '❤️', '👍'].map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleEmojiReaction(emoji)}
                                    className='text-lg hover:bg-gray-700 rounded p-1 transition-colors'
                                >
                                    {emoji}
                                </button>
                            ))}
                            <button
                                onClick={handleShowEmojiReactions}
                                className='text-lg hover:bg-gray-700 rounded p-1 transition-colors'
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Контекстное меню для сообщений */}
                {showMessageMenu && selectedMessage && (
                    <div 
                        className='fixed z-50 bg-gray-800/95 rounded-lg shadow-lg py-2 min-w-[120px]'
                        style={{ 
                            left: getSafeMenuPosition(menuPosition.x, menuPosition.y - 50, 120).x, 
                            top: getSafeMenuPosition(menuPosition.x, menuPosition.y - 50, 120).y + 50
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => handleCopyMessage(selectedMessage)}
                            className='w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm flex items-center gap-3'
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Копировать
                        </button>
                        <button
                            onClick={() => handleForwardMessage(selectedMessage)}
                            className='w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm flex items-center gap-3'
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="17,1 21,5 17,9"></polyline>
                                <path d="M3,11V9a4,4 0 0,1 4,-4H21"></path>
                                <polyline points="7,23 3,19 7,15"></polyline>
                                <path d="M21,13v2a4,4 0 0,1 -4,4H3"></path>
                            </svg>
                            Переслать
                        </button>
                        {selectedMessage.senderId === authUser?._id && (
                            <>
                                <button
                                    onClick={() => handleEditMessage(selectedMessage)}
                                    className='w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors text-sm flex items-center gap-3'
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(selectedMessage)}
                                    className='w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors text-sm flex items-center gap-3'
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    Удалить
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Модальное окно подтверждения удаления */}
                {showDeleteConfirm && selectedMessage && (
                    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Удалить сообщение</h3>
                            <p className="text-gray-300 mb-2">Вы уверены, что хотите удалить это сообщение?</p>
                            <p className="text-gray-400 text-sm mb-6">Это удалит сообщение для всех участников чата.</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setSelectedMessage(null);
                                    }}
                                    className="px-4 py-2 text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    УДАЛИТЬ
                                </button>
                            </div>
                        </div>
                    </div>
                )}

        {/* Меню с полным списком эмодзи реакций */}
        {showEmojiReactions && selectedMessage && (() => {
            const safePosition = getSafeMenuPosition(menuPosition.x, menuPosition.y, 200);
            return (
            <div 
                className='fixed z-50 bg-gray-800/95 rounded-lg shadow-lg  p-2'
                style={{ 
                    left: safePosition.x, 
                    top: safePosition.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Кнопка закрытия */}
                <div className='flex justify-end mb-2'>
                    <button
                        onClick={handleCloseEmojiReactions}
                        className='text-gray-400 hover:text-white transition-colors p-1'
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    </div>
                <div className='flex flex-wrap gap-1 justify-center max-w-[200px]'>
                    {['😀', '😂', '😍', '❤️', '👍', '👎', '🔥', '💯', '🎉', '😢', '😮', '😡', '🤔', '👏', '🙏', '💪', '🎯', '🚀', '⭐', '💎', '🎊', '😎', '🤩', '😘', '🥰', '😋', '🤤', '😴', '🤯', '🥳'].map((emoji, index) => (
                        <button
                            key={index}
                            onClick={() => handleEmojiReaction(emoji)}
                            className='text-lg hover:bg-gray-700 rounded p-1 transition-colors'
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
            );
        })()}
            </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
           <img src={assets.logo_icon} alt='logo' className='max-w-16' />
           <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default ChatContainer;