import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react'
import { ChatContext } from '../../context/ChatContext'
import type { ChatContextType } from '../../context/ChatContext'
import { useContext } from 'react'

interface GalleryProps {
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
  images?: string[]
}

const Gallery = ({ isOpen, onClose, initialIndex = 0, images: customImages }: GalleryProps) => {
  const { messages } = useContext(ChatContext) as ChatContextType
  const [currentIndex, setCurrentIndex] = useState(0)
  const [images, setImages] = useState<string[]>([])
  const [showNavigation, setShowNavigation] = useState(true)
  const hideTimeoutRef = useRef<number | null>(null)

  // Получаем изображения из сообщений или используем переданные
  useEffect(() => {
    if (customImages) {
      setImages(customImages)
    } else {
      const messageImages = messages
        .filter(msg => msg.image)
        .map(msg => msg.image)
        .filter(Boolean) as string[]
      
      setImages(messageImages)
    }
  }, [messages, customImages])

  // Сброс индекса при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setShowNavigation(true)
      startHideTimer()
    } else {
      clearHideTimer()
    }
  }, [isOpen, initialIndex])

  // Функции для управления таймером скрытия
  const startHideTimer = () => {
    clearHideTimer()
    hideTimeoutRef.current = setTimeout(() => {
      setShowNavigation(false)
    }, 1000) // Скрываем через 1 секунду
  }

  const clearHideTimer = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  // Показать навигацию при взаимодействии
  const showNavigationTemporarily = () => {
    setShowNavigation(true)
    startHideTimer()
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleDownload = async () => {
    if (!images[currentIndex]) return
    
    try {
      const response = await fetch(images[currentIndex])
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка при скачивании:', error)
    }
  }

  const handleShare = async () => {
    if (!images[currentIndex]) return
    
    try {
      if (navigator.share) {
        const response = await fetch(images[currentIndex])
        const blob = await response.blob()
        const file = new File([blob], `image-${currentIndex + 1}.jpg`, { type: blob.type })
        
        await navigator.share({
          title: 'Фото из чата',
          text: 'Посмотрите на это фото!',
          files: [file]
        })
      } else {
        // Fallback: копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(images[currentIndex])
        alert('Ссылка на изображение скопирована в буфер обмена')
      }
    } catch (error) {
      console.error('Ошибка при шаринге:', error)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        handlePrevious()
        break
      case 'ArrowRight':
        handleNext()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearHideTimer()
    }
  }, [isOpen])

  if (!isOpen || images.length === 0) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center">
      {/* Фон для закрытия */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Основной контент */}
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-end  mb-6 px-2">
          <div className="flex   items-center gap-3">
            {/* Кнопки действий */}
            <button
              onClick={handleDownload}
              className="p-2 bg-gradient-to-r from-gray-900/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-500/30 text-white rounded-xl transition-all duration-200 border border-gray-500/30 hover:border-gray-400/50 backdrop-blur-sm"
              title="Скачать фото"
            >
              <Download size={18} />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 bg-gradient-to-r from-gray-900/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-500/30 text-white rounded-xl transition-all duration-200 border border-gray-500/30 hover:border-gray-400/50 backdrop-blur-sm"
              title="Поделиться"
            >
              <Share2 size={18} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-gradient-to-r from-gray-800/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-500/30 text-white rounded-xl transition-all duration-200 border border-gray-500/30 hover:border-gray-400/50 backdrop-blur-sm"
              title="Закрыть галерею"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Изображение */}
        <div 
          className="relative bg-gray-900 rounded-lg overflow-hidden"
          onMouseMove={showNavigationTemporarily}
          onTouchStart={showNavigationTemporarily}
        >
          <img
            src={images[currentIndex]}
            alt={`Изображение ${currentIndex + 1}`}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
          
          {/* Навигационные кнопки */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-300 ${
                  showNavigation ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Предыдущее"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={handleNext}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-300 ${
                  showNavigation ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Следующее"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto ">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-violet-500' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={image}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Подсказки */}
        <div className=" bg-gray-900 pt-2 text-center text-gray-300 text-sm">
          <p>Используйте ← → для навигации или ESC для закрытия</p>
        </div>
      </div>
    </div>
  )
}

export default Gallery
