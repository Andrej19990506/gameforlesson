import assets from '../assets/assets.js';
import { ChatContext } from '../../context/ChatContext.js'
import type { ChatContextType } from '../../context/ChatContext.js'
import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../../context/AuthContext.js';
import type { AuthContextType } from '../types/auth.js';

const RightSidebar = () => {

    const {selectedUser, messages} = useContext(ChatContext) as ChatContextType
    const {logout, onlineUsers} = useContext(AuthContext) as AuthContextType
    const [msgImages, setMsgImages] = useState<string[]>([])

    //Get all the images from the messages and set them to state
    useEffect(() => {
        setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image))
    }, [messages])


    return selectedUser && (
        <div className='bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}'>
            <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
                <img src={selectedUser?.profilePic || assets.avatar_icon} alt='user' className='w-20 aspect-[1/1] rounded-full' />
                <h1 className="px-3 text-xl font-medium mx-auto flex items-center gap-2">
                    {onlineUsers.includes(selectedUser._id) && <p className=' w-2 h-2 rounded-full bg-green-500'></p>}
                    {selectedUser.name}
                </h1>
                <p className='px-3 mx-auto'>{selectedUser.bio}</p>
            </div>

            <hr className='border-[#ffffff50] my-4'/>

            <div className='px-5 text-xs'>
                <p>Media</p>
                <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-2 opacity-80'>
                    {msgImages.map((url: string, index: number) => (
                        <div key={index} onClick={() => window.open(url)} 
                        className='cursor-pointer rounded'>
                            <img src={url} alt='image' className='h-full rounded-lg' />
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={logout} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>Выйти</button>
        </div>
    )
}

export default RightSidebar;