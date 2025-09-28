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
    const{selectedUser, setSelectedUser,sendMessage, getMessages, messages, handleInputChange, input, setInput, retryMessage, typingUser, deleteMessage} = useContext(ChatContext) as ChatContextType
    const{onlineUsers, authUser} = useContext(AuthContext) as AuthContextType
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMessageMenu, setShowMessageMenu] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleEmojiClick = (emojiObject: any) => {
        setInput(input + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleMessageClick = (e: React.MouseEvent, message: Message, messageElement: HTMLElement) => {
        console.log('Message clicked:', message.senderId, authUser?._id);
        e.preventDefault();
        e.stopPropagation();
        
        const rect = messageElement.getBoundingClientRect();
        const chatContainer = chatContainerRef.current;
        
        // Если наше сообщение - слева, если не наше - справа
        const menuX = message.senderId === authUser?._id ? rect.left - 130 : rect.right + 10;
        
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
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

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
    }, [showMessageMenu]);
    

    
    return selectedUser ? (
            <div className='h-full overflow-scroll relative backdrop-blur-lg max-md:h-screen max-md:rounded-none max-md:border-none'>
                {/*Header*/}
                <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 max-md:mx-0 max-md:px-4'>
                    <img src={selectedUser.profilePic||assets.avatar_icon} alt='' className='w-8 rounded-full' />
                    <div className='flex-1 text-lg text-white flex items-center gap-2'>
                        <span>{selectedUser.name}</span>
                        {onlineUsers.includes(selectedUser._id)
                         ? ( 
                             <div className='flex items-center gap-1'>
                                 <span className='w-2 h-2 rounded-full bg-green-500'></span>
                                 {typingUser.includes(selectedUser._id) && (
                                     <span className='text-gray-300 text-xs'>печатает...</span>
                                 )}
                             </div>)
                         : <span className='text-xs text-gray-400'> Был(а) в сети {formatLastSeen(selectedUser.lastSeen)}</span>
                         }
                    </div>
                    <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt='arrow' className='md:hidden max-w-7' />
                    <img src={assets.help_icon} alt='help' className='max-md:hidden max-w-5' />
                </div>
                {/*Chat Container*/}
                <div ref={chatContainerRef} className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                
                {messages.filter(msg => msg && msg.senderId).map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 justify-end ${msg?.senderId !== authUser?._id && "flex-row-reverse"}`}>
                            <div className="flex flex-col items-end">
                                {msg.image ? (
                                    <img src={msg.image} alt='image' className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-2' />
                                ) : (
                                    <p 
                                        onClick={(e) => handleMessageClick(e, msg, e.currentTarget)}
                                        className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-2 break-words bg-violet-500/30 text-white cursor-pointer hover:bg-violet-500/40 transition-colors ${msg.senderId === authUser?._id ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                    >
                                        {msg.text}
                                    </p>
                                )}
                                {/* Статус сообщения только для своих сообщений */}
                                {msg.senderId === authUser?._id && (
                                    <div className="mb-6">
                                        <MessageStatus status={msg.status} messageId={msg._id} seen={msg.seen} messageIndex={index} />
                                    </div>
                                )}
                            </div>
                            <div className='text-center text-xs'>
                                <img src={msg.senderId === authUser?._id ? authUser?.profilePic || assets.avatar_icon : selectedUser.profilePic || assets.avatar_icon} alt='send' className='w-7 rounded-full' />
                                <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                    
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
                {/*Chat bottom-area*/}
                <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 max-md:px-4'>
                    <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
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
                    </div>
                    <img onClick={() => handleSendMessage()} src={assets.send_button} alt='send' className='w-7 cursor-pointer' />
                    {showEmojiPicker && (
        <div className='absolute bottom-16 left-4 z-50'>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
    )}
                </div>
                
                {/* Контекстное меню для сообщений */}
                {showMessageMenu && selectedMessage && (
                    <div 
                        className='fixed z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-2 min-w-[120px]'
                        style={{ 
                            left: menuPosition.x, 
                            top: menuPosition.y
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
            </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
           <img src={assets.logo_icon} alt='logo' className='max-w-16' />
           <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default ChatContainer;