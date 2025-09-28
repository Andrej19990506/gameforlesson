import { useContext, useState, useEffect } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/user'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import type { ChatContextType } from '../../context/ChatContext'


const Sidebar = () => {

    const {selectedUser, setSelectedUser, users, getUsers, unseenMessages, setUnseenMessages, typingUser, lastMessages} = useContext(ChatContext) as ChatContextType
    
    const navigate = useNavigate()

    const {logout, onlineUsers, authUser} = useContext(AuthContext) as {logout: () => void, onlineUsers: string[], authUser: User | null}
    
    const [input, setInput] = useState('')

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
        <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <img src={assets.logo} alt='logo' className='max-w-40'/>
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
                {sortedUsers.map((user, index) => {
                    return (
                        <div onClick={() => {setSelectedUser(user as unknown as User); setUnseenMessages({...unseenMessages, [user._id]: 0})}}
                            key={index} className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm transition-all duration-300 ${selectedUser?._id === user._id && 'bg-[#282142]/50'} ${unseenMessages[user._id] > 0 && 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 border-l-4 border-violet-400'}`}>
                                <div className='relative'>
                            <img src={user?.profilePic|| assets.avatar_icon} alt='user' className='w-[35px] aspect-[1/1] rounded-full' />
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
                                                <span className='text-gray-300 text-xs'>печатает...</span>
                                            ) : (() => {
                                                const lastMessage = lastMessages[user._id];
                                                if (!lastMessage) {
                                                    return <p className='text-xs text-gray-400'>Нет сообщений</p>;
                                                }
                                                
                                                const isFromMe = lastMessage.senderId === authUser?._id;
                                                const messageText = lastMessage.text || (lastMessage.image ? 'Фото' : 'Сообщение');
                                                
                                                return (
                                                    <div className='flex items-center gap-1'>
                                                        <p className='text-xs text-gray-400 truncate'>
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
                })}
            </div>
        </div>
    )
}

export default Sidebar;