import assets from '../assets/assets.js';
import { ChatContext } from '../../context/ChatContext.js'
import type { ChatContextType } from '../../context/ChatContext.js'
import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext.js';
import type { AuthContextType } from '../types/auth.js';
import Gallery from './Gallery';

const RightSidebar = ({ onClose }: { onClose?: () => void }) => {

    const {selectedUser, messages} = useContext(ChatContext) as ChatContextType
    const {logout, onlineUsers} = useContext(AuthContext) as AuthContextType
    const [msgImages, setMsgImages] = useState<string[]>([])
    const [showGallery, setShowGallery] = useState(false)
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)

    //Get all the images from the messages and set them to state
    useEffect(() => {
        console.log(`🖼️ [RightSidebar] useEffect messages сработал:`, {
            messagesCount: messages.length,
            selectedUser: selectedUser?.name,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Игнорируем эффект во время восстановления позиции скролла
        // Это предотвращает неожиданный скролл в ChatContainer
        if (selectedUser && messages.length > 0) {
            // Небольшая задержка чтобы дать время ChatContainer восстановить позицию
            const timeoutId = setTimeout(() => {
                setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image))
            }, 100);
            
            return () => clearTimeout(timeoutId);
        } else {
            setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image))
        }
    }, [messages])

    const handleImageClick = (imageUrl: string) => {
        const imageIndex = msgImages.findIndex(img => img === imageUrl);
        setGalleryInitialIndex(imageIndex >= 0 ? imageIndex : 0);
        setShowGallery(true);
    };

    return (
        <>
            {selectedUser && (
                <div className="h-full w-full relative overflow-y-scroll">
                    {/* Кнопка закрытия - только для мобильных */}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className='md:hidden absolute top-6 right-6 z-10 p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors backdrop-blur-sm'
                            title="Закрыть профиль"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                    
                    {/* Заголовок профиля */}
                    <div className='pt-20 pb-8 flex flex-col items-center gap-4 text-center px-6'>
                        <div className="relative">
                            <img 
                                src={selectedUser?.profilePic || assets.avatar_icon} 
                                alt='user' 
                                className='w-32 h-32 rounded-full border-4 border-violet-400/50 shadow-2xl object-cover' 
                            />
                            {onlineUsers.includes(selectedUser._id) && (
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-white">
                                {selectedUser.name}
                            </h1>
                            <p className='text-gray-300 text-sm max-w-xs leading-relaxed'>
                                {selectedUser.bio || 'Нет описания профиля'}
                            </p>
                        </div>
                    </div>

                    {/* Разделитель */}
                    <div className='mx-6 border-t border-gray-700/50'></div>

                    {/* Медиа секция */}
                    <div className='px-6 py-6'>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className='text-lg font-semibold text-white'>Медиа</h2>
                            <span className="text-sm text-gray-400">{msgImages.length} фото</span>
                        </div>
                        
                        {msgImages.length > 0 ? (
                            <div className='grid grid-cols-2 gap-3'>
                                {msgImages.map((url: string, index: number) => (
                                    <div 
                                        key={index} 
                                        onClick={() => handleImageClick(url)} 
                                        className='cursor-pointer rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-lg'
                                    >
                                        <img 
                                            src={url} 
                                            alt={`Фото ${index + 1}`} 
                                            className='w-full h-32 object-cover' 
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21,15 16,10 5,21"></polyline>
                                    </svg>
                                </div>
                                <p className="text-gray-400 text-sm">Нет фотографий</p>
                            </div>
                        )}
                    </div>

                    {/* Кнопка выхода */}
                    <div className="px-6 pb-8 pt-4">
                        <button 
                            onClick={logout} 
                            className='w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none text-sm font-medium py-3 px-6 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl'
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            )}

            {/* Галерея для фотографий */}
            <Gallery 
                isOpen={showGallery} 
                onClose={() => setShowGallery(false)}
                images={msgImages}
                initialIndex={galleryInitialIndex}
            />
        </>
    )
}

export default RightSidebar;