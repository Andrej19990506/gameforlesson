import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import assets from "../assets/assets"
import type { User } from "../types/user"
import { AuthContext } from "../../context/AuthContext"
import { ArrowLeft, Camera, Edit3, Trash2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

const ProfilePage = () => {
  const {authUser, updateProfile, logout} = useContext(AuthContext) as {authUser: User | null, updateProfile: (body: {name: string, bio: string, profilePic: string}) => Promise<void>, logout: () => void}

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const [name, setName] = useState(authUser?.name || '')
  const [bio, setBio] = useState(authUser?.bio || '')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!selectedImage){
      await updateProfile({name: name, bio: bio, profilePic: authUser?.profilePic || ''})
      navigate('/')
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(selectedImage)
    reader.onload = async () => {
      const base64Image = reader.result as string
      await updateProfile({name: name, bio, profilePic: base64Image})
      navigate('/')
    }
  }

  const handleCancel = () => {
    setName(authUser?.name || '')
    setBio(authUser?.bio || '')
    setSelectedImage(null)
    setIsEditing(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'Я согласен удалить') {
      toast.error('Введите точную фразу подтверждения')
      return
    }

    if (!password) {
      toast.error('Введите пароль')
      return
    }

    try {
      const response = await axios.delete('/api/user/delete', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        data: {
          password: password
        }
      })
      
      console.log('Response:', response.data)
      
      if (response.data.success) {
        toast.success('Аккаунт успешно удален')
        // Полная очистка всех данных
        localStorage.clear()
        sessionStorage.clear()
        // Очистка cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        // Вызываем logout для полной очистки состояния
        logout()
        navigate('/')
      } else {
        toast.error(response.data.message || 'Ошибка при удалении аккаунта')
      }
    } catch (error: any) {
      console.error('Ошибка при удалении аккаунта:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Ошибка при удалении аккаунта')
    }
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
              src={selectedImage ? URL.createObjectURL(selectedImage) : authUser?.profilePic || assets.avatar_icon} 
              alt="Profile" 
              className='w-32 h-32 rounded-full border-4 border-violet-500/30 shadow-lg'
            />
            <label 
              htmlFor='avatar' 
              className='absolute bottom-2 right-2 bg-violet-600 hover:bg-violet-700 p-2 rounded-full cursor-pointer transition-colors shadow-lg'
            >
              <Camera size={16} className="text-white" />
              <input 
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                type="file" 
                id='avatar' 
                accept='image/png, image/jpg, image/jpeg' 
                hidden
              />
            </label>
          </div>
          <h2 className='text-2xl font-bold text-white mt-4'>{authUser?.name}</h2>
          <p className='text-gray-400 mt-1'>{authUser?.email}</p>
        </div>

        {/* Profile Form */}
        <div className='bg-gray-800 rounded-lg p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-white'>Информация о профиле</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className='flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors'
            >
              <Edit3 size={16} />
              {isEditing ? 'Отмена' : ''}
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Имя
              </label>
              <input 
                onChange={(e) => setName(e.target.value)} 
                value={name}
                type="text" 
                required 
                disabled={!isEditing}
                placeholder="Ваше имя" 
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                О себе
              </label>
              <textarea 
                onChange={(e) => setBio(e.target.value)} 
                value={bio}
                rows={4} 
                disabled={!isEditing}
                placeholder="Расскажите о себе..." 
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {isEditing && (
              <div className='flex gap-3 pt-4'>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white p-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Сохранить изменения
                </button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Delete Account Section */}
        <div className='mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Trash2 size={20} className="text-red-400" />
            <h3 className='text-lg font-semibold text-red-400'>Опасная зона</h3>
          </div>
          <p className='text-gray-300 mb-4'>
            Удаление аккаунта необратимо. Все ваши данные, сообщения и настройки будут безвозвратно удалены.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4" data-form-type="other" data-lpignore="true" data-1p-ignore="true">
            <h3 className="text-lg font-semibold text-white mb-4">Удалить аккаунт</h3>
            <p className="text-gray-300 mb-4">
              Это действие необратимо. Все ваши данные будут удалены навсегда.
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Введите <span className="text-red-400 font-mono">"Я согласен удалить"</span> для подтверждения:
            </p>
            {/* Скрытые поля-приманки */}
            <input type="text" style={{display: 'none'}} autoComplete="username" />
            <input type="password" style={{display: 'none'}} autoComplete="current-password" />
            
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Я согласен удалить"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="delete-confirmation"
              id="delete-confirmation"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите ваш пароль"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="delete-password"
              id="delete-password"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
              style={{WebkitTextSecurity: 'disc'} as React.CSSProperties}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                  setPassword('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'Я согласен удалить' || !password}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage