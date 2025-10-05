import { useContext, useState, useEffect } from 'react'
import { MenuIcon } from 'lucide-react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/user'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import type { ChatContextType } from '../../context/ChatContext'
import MenuBar from './MenuBar'


const Sidebar = () => {

    const {selectedUser, setSelectedUser, users, getUsers, unseenMessages, setUnseenMessages, typingUser, lastMessages, isLoadingUsers} = useContext(ChatContext) as ChatContextType
    
    const navigate = useNavigate()

    const {logout, onlineUsers, authUser} = useContext(AuthContext) as {logout: () => void, onlineUsers: string[], authUser: User | null}
    
    const [input, setInput] = useState('')
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const filteredUsers = input ? users.filter((user: User) => user.name.toLowerCase().includes(input.toLowerCase())) : users
    
    // Сортируем пользователей: сначала с непрочитанными сообщениями, потом по алфавиту
    const sortedUsers = filteredUsers.sort((a, b) => {
        const aUnseen = unseenMessages[a._id] || 0;
        const bUnseen = unseenMessages[b._id] || 0;
        
        // Если у одного есть непрочитанные, а у другого нет
        if (aUnseen > 0 && bUnseen === 0) return -1;
        if (aUnseen === 0 && bUnseen > 0) return 1;
        
        // Если у обоих есть непрочитанные, сортируем по количеству
        if (aUnseen > 0 && bUnseen > 0) {
            return bUnseen - aUnseen;
        }
        
        // Если у обоих нет непрочитанных, сортируем по алфавиту
        return a.name.localeCompare(b.name);
    });

    
    useEffect(() => {
        getUsers()
    }, [onlineUsers])

    return (
        <>
            {/* Кнопка меню для мобильных устройств */}
            <div className={`md:hidden fixed top-4 left-4 z-50 ${selectedUser ? 'hidden' : ''}`}>
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
                >
                    <MenuIcon size={14} />
                </button>
            </div>

            {/* MenuBar компонент */}
            <MenuBar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Сайдбар */}
            <div className={`h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`} style={{backgroundColor: 'var(--color-gray-900)'}}>
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <div className='relative py-2 group'>
                        <img src={assets.menu_icon} alt='menu' className='max-h-5 cursor-pointer' />
                        <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                            <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Редактировать профиль</p>
                            <hr className='my-2 border-t border-gray-500'/>
                            <p onClick={logout} className='cursor-pointer text-sm'>Выйти</p>
                        </div>
                    </div>
                </div>
                <div className='bg-[#282142] rounded-full flex items-center gap-2 p-3 px-4 mt-5'>
                    <img src={assets.search_icon} alt='search' className='w-3' />
                    <input onChange={(e) => setInput(e.target.value)} type='text' className='bg-transparent border-none outline-none text-white text-xs placeholder:[c8c8c8] flex-1' placeholder='Search Users...' />
                </div>
            </div>
            <div className='flex flex-col'>
                {isLoadingUsers ? (
                    // Скелетоны для загрузки - показываем столько, сколько пользователей или минимум 3
                    Array.from({ length: Math.max(users.length, 3) }).map((_, index) => (
                        <div key={index} className="relative flex items-center gap-2 p-2 pl-4 rounded animate-pulse">
                            {/* Скелетон аватара */}
                            <div className="w-[35px] h-[35px] bg-gray-700 rounded-full"></div>
                            
                            {/* Скелетон контента */}
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    sortedUsers.map((user, index) => {
                    return (
                        <div onClick={() => {setSelectedUser(user as unknown as User); setUnseenMessages({...unseenMessages, [user._id]: 0})}}
                            key={index} className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm transition-all duration-300 ${selectedUser?._id === user._id && 'bg-[#282142]/50'} ${unseenMessages[user._id] > 0 && 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 border-l-4 border-violet-400'}`}>
                                <div className='relative'>
                            <img 
                                src={`${user?.profilePic|| assets.avatar_icon}?v=${Date.now()}`} 
                                alt='user' 
                                className='w-[35px] h-[35px] rounded-full object-cover object-center'
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = assets.avatar_icon;
                                }}
                            />
                                    {onlineUsers.includes(user._id) ? (
                                        <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#8185B2]/10'></div>
                                    ) : (() => {
                                        const now = new Date();
                                        const lastSeenDate = new Date(user.lastSeen);
                                        const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
                                        
                                        if (diffInMinutes >= 5 && diffInMinutes < 60) {
                                            return (
                                                <div className='absolute -bottom-0.5 -right-0.5 bg-gray-700 rounded-full w-3 h-3 flex items-center justify-center border border-gray-600 shadow-sm'>
                                                    <span className='text-white text-[8px] font-medium leading-none'>{diffInMinutes}м</span>
                                                </div>
                                            );
                                        } else if (diffInMinutes >= 60 && diffInMinutes < 120) {
                                            return (
                                                <div className='absolute -bottom-0.5 -right-0.5 bg-gray-700 rounded-full w-3 h-3 flex items-center justify-center border border-gray-600 shadow-sm'>
                                                    <span className='text-white text-[8px] font-medium leading-none'>1ч</span>
                                                </div>
                                            );
                                        } else if (diffInMinutes >= 120) {
                                            const hours = Math.floor(diffInMinutes / 60);
                                            return (
                                                <div className='absolute -bottom-0.5 -right-0.5 bg-gray-700 rounded-full w-3 h-3 flex items-center justify-center border border-gray-600 shadow-sm'>
                                                    <span className='text-white text-[8px] font-medium leading-none'>{hours}ч</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className='flex flex-col leading-5 flex-1 min-w-0'>
                                    <div className='flex items-center justify-between'>
                                        <p className='truncate'>{user.name as string}</p>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex-1 min-w-0 flex items-center gap-1'>
                                            {typingUser.includes(user._id) ? (
                                                <div className="flex items-center gap-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 animate-pulse">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    <div className="flex space-x-0.5">
                                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                                    </div>
                                                </div>
                                            ) : (() => {
                                                const lastMessage = lastMessages[user._id];
                                                if (!lastMessage) {
                                                    return <p className='text-xs text-gray-400'>Нет сообщений</p>;
                                                }
                                                
                                                const isFromMe = lastMessage.senderId === authUser?._id;
                                                const messageText = lastMessage.text || (lastMessage.image ? 'Фото' : 'Сообщение');
                                                
                                                return (
                                                    <div className='flex items-center gap-1'>
                                                        <p 
                                                            className='text-xs text-gray-400'
                                                            style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                wordBreak: 'break-word',
                                                                lineHeight: '1.2'
                                                            }}
                                                        >
                                                            {isFromMe ? 'Вы: ' : ''}{messageText}
                                                        </p>
                                                        {isFromMe && (
                                                            <div className='flex items-center'>
                                                                {lastMessage.seen ? (
                                                                    <div className='flex'>
                                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                                                            <polyline points="20,6 9,17 4,12"></polyline>
                                                                        </svg>
                                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400 -ml-1">
                                                                            <polyline points="20,6 9,17 4,12"></polyline>
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                                                        <polyline points="20,6 9,17 4,12"></polyline>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                            </div>
                                {unseenMessages[user._id]>0 && <p className='absolute top-4 right-4 text-xs h-6 w-6 flex justify-center items-center rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold shadow-lg ring-2 ring-violet-300/50'>{unseenMessages[user._id]}</p>}
                    </div>
                    );
                }))
                }
            </div>
        </div>
        </>
    )
}

export default Sidebar;