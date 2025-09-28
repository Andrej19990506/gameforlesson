import assets from '../assets/assets'
import { useRef, useEffect, useContext, useState } from 'react'
import { formatMessageTime } from '../lib/utils'
import type { ChatContextType } from '../../context/ChatContext'
import { ChatContext } from '../../context/ChatContext'
import type { AuthContextType } from '../types/auth'
import { AuthContext } from '../../context/AuthContext'
import { formatLastSeen } from '../lib/utils'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react';

const ChatContainer = () => {
    const{selectedUser, setSelectedUser,sendMessage, getMessages, messages, handleInputChange, input, setInput, retryMessage} = useContext(ChatContext) as ChatContextType
    const{onlineUsers, authUser} = useContext(AuthContext) as AuthContextType
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleEmojiClick = (emojiObject: any) => {
        setInput(input + emojiObject.emoji);
        setShowEmojiPicker(false);
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
    

    
    return selectedUser ? (
            <div className='h-full overflow-scroll relative backdrop-blur-lg max-md:h-screen max-md:rounded-none max-md:border-none'>
                {/*Header*/}
                <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 max-md:mx-0 max-md:px-4'>
                    <img src={selectedUser.profilePic||assets.avatar_icon} alt='' className='w-8 rounded-full' />
                    <p className='flex-1 text-lg text-white flex items-center gap-2'>
                        {selectedUser.name}
                        {onlineUsers.includes(selectedUser._id)
                         ? <span className='w-2 h-2 rounded-full bg-green-500'></span>
                         : <span className='text-xs text-gray-400'> Был(а) в сети {formatLastSeen(selectedUser.lastSeen)}</span>
                         }
                    </p>
                    <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt='arrow' className='md:hidden max-w-7' />
                    <img src={assets.help_icon} alt='help' className='max-md:hidden max-w-5' />
                </div>
                {/*Chat Container*/}
                <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                
                {messages.filter(msg => msg && msg.senderId).map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 justify-end ${msg?.senderId !== authUser?._id && "flex-row-reverse"}`}>
                            <div className="flex flex-col items-end">
                                {msg.image ? (
                                    <img src={msg.image} alt='image' className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-2' />
                                ) : (
                                    <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-2 break-words bg-violet-500/30 text-white ${msg.senderId === authUser?._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
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
            </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
           <img src={assets.logo_icon} alt='logo' className='max-w-16' />
           <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
        </div>
    )
}

export default ChatContainer;