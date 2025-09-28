import { X, Edit3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import type { AuthContextType } from '../types/auth'

interface MenuBarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MenuBar = ({ isOpen, onClose }: MenuBarProps) => {
    const navigate = useNavigate()
    const { logout, authUser } = useContext(AuthContext) as AuthContextType

    if (!isOpen) return null

    return (
        <div className="fixed left-0 top-0 h-full w-80 bg-gray-800  p-5 z-50 md:hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <img src="/src/assets/logo.png" alt="logo" className="max-w-32" />
                    <button 
                        onClick={onClose}
                        className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            navigate('/profile')
                            onClose()
                        }}
                        className="w-full flex items-center gap-3 p-3 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <img 
                            src={authUser?.profilePic || '/src/assets/avatar_icon.png'} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 text-left">
                            <p className="font-medium">{authUser?.name}</p>
                            <p className="text-sm text-gray-400">Редактировать профиль</p>
                        </div>
                        <Edit3 size={16} className="text-gray-400" />
                    </button>
                    
                    <button
                        onClick={() => {
                            logout()
                            onClose()
                        }}
                        className="w-full text-left p-3 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                    >
                        Выйти
                    </button>
                </div>
        </div>
    )
}

export default MenuBar