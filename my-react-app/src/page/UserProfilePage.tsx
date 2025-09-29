import { useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import assets from "../assets/assets"
import { ChatContext } from "../../context/ChatContext"
import type { ChatContextType } from "../../context/ChatContext"
import { AuthContext } from "../../context/AuthContext"
import type { AuthContextType } from "../types/auth"
import { ArrowLeft } from "lucide-react"
import Gallery from '../components/Gallery'

const UserProfilePage = () => {
  const { selectedUser, messages } = useContext(ChatContext) as ChatContextType
  const { onlineUsers } = useContext(AuthContext) as AuthContextType
  const navigate = useNavigate()
  const [msgImages, setMsgImages] = useState<string[]>([])
  const [showGallery, setShowGallery] = useState(false)
  const [showAvatarGallery, setShowAvatarGallery] = useState(false)

  // Получаем все изображения из сообщений
  useEffect(() => {
    setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image))
  }, [messages])

  if (!selectedUser) {
    navigate('/')
    return null
  }

  return (
    <div className='min-h-screen bg-gray-900 flex flex-col'>
      {/* Header */}
      <div className='flex items-center gap-4 p-4 border-b border-gray-700'>
        <button 
          onClick={() => navigate('/')}
          className='p-2 hover:bg-gray-700 rounded-lg transition-colors'
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className='text-xl font-semibold text-white'>Профиль</h1>
      </div>

      {/* Profile Content */}
      <div className='flex-1 p-6 max-w-2xl mx-auto w-full'>
        {/* Profile Header */}
        <div className='text-center mb-8'>
          <div className='relative inline-block'>
            <img 
              src={selectedUser.profilePic || assets.avatar_icon} 
              alt="Profile" 
              onClick={() => setShowAvatarGallery(true)}
              className={`w-32 h-32 rounded-full border-4 shadow-lg object-cover cursor-pointer hover:opacity-80 transition-opacity ${
                onlineUsers.includes(selectedUser._id) 
                  ? 'border-green-400' 
                  : 'border-gray-600/50'
              }`}
            />
            {onlineUsers.includes(selectedUser._id) && (
              <div className='absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-900'></div>
            )}
          </div>
          <h2 className='text-2xl font-bold text-white mt-4'>{selectedUser.name}</h2>
          <p className='text-gray-400 mt-1'>{selectedUser.email}</p>
          <div className={`text-sm font-medium mt-2 ${
            onlineUsers.includes(selectedUser._id) 
              ? 'text-green-400' 
              : 'text-violet-200'
          }`}>
            {onlineUsers.includes(selectedUser._id) ? 'в сети' : 'не в сети'}
          </div>
        </div>

        {/* Profile Info */}
        <div className='bg-gray-800 rounded-lg p-6 mb-6'>
          <h3 className='text-lg font-semibold text-white mb-4'>Информация</h3>
          
          {selectedUser.bio && (
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                О себе
              </label>
              <p className='text-gray-200 p-3 bg-gray-700 rounded-lg'>
                {selectedUser.bio}
              </p>
            </div>
          )}

          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Email
            </label>
            <p className='text-gray-200 p-3 bg-gray-700 rounded-lg'>
              {selectedUser.email}
            </p>
          </div>
        </div>

        {/* Media Section */}
        {msgImages.length > 0 && (
          <div className='bg-gray-800 rounded-lg p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>Медиа</h3>
              <button 
                onClick={() => setShowGallery(true)}
                className='text-violet-400 hover:text-violet-300 text-sm underline'
              >
                Показать все ({msgImages.length})
              </button>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              {msgImages.slice(0, 6).map((url: string, index: number) => (
                <div 
                  key={index} 
                  onClick={() => setShowGallery(true)}
                  className='cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity'
                >
                  <img 
                    src={url} 
                    alt='image' 
                    className='w-full h-20 object-cover hover:scale-105 transition-transform duration-200' 
                  />
                </div>
              ))}
              {msgImages.length > 6 && (
                <div 
                  onClick={() => setShowGallery(true)}
                  className='cursor-pointer rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors h-20'
                >
                  <span className='text-white text-sm'>+{msgImages.length - 6}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Галерея для фото из сообщений */}
      <Gallery 
        isOpen={showGallery} 
        onClose={() => setShowGallery(false)} 
      />
      
      {/* Галерея для аватара */}
      {selectedUser.profilePic && (
        <Gallery 
          isOpen={showAvatarGallery} 
          onClose={() => setShowAvatarGallery(false)}
          images={[selectedUser.profilePic]}
        />
      )}
    </div>
  )
}

export default UserProfilePage
