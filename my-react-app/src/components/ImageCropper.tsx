import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageFile, onCropComplete, onCancel }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CROP_SIZE = 230; // Фиксированный размер обрезки

  // Создаем URL для изображения
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Обработка загрузки изображения
  const handleImageLoad = useCallback(() => {
    if (imgRef.current && containerRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const { clientWidth, clientHeight } = containerRef.current;
      
      setImageSize({ width: naturalWidth, height: naturalHeight });
      setDisplaySize({ width: clientWidth, height: clientHeight });
      
      // Центрируем кроп-область в пикселях дисплея
      const centerX = clientWidth / 2 - CROP_SIZE / 2;
      const centerY = clientHeight / 2 - CROP_SIZE / 2;
      setCropArea({ x: centerX, y: centerY });
      
      setImageLoaded(true);
      updatePreview();
    }
  }, []);

  // Обновление предварительного просмотра
  const updatePreview = useCallback(() => {
    if (!imageLoaded || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Конвертируем координаты дисплея в координаты изображения
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;
    
    const imageX = cropArea.x * scaleX;
    const imageY = cropArea.y * scaleY;
    const imageCropSize = CROP_SIZE * scaleX;

    // Устанавливаем размеры canvas для предварительного просмотра 80x80
    canvas.width = 80;
    canvas.height = 80;

    // Создаем круглую маску для предварительного просмотра
    ctx.save();
    ctx.beginPath();
    ctx.arc(40, 40, 40, 0, Math.PI * 2);
    ctx.clip();

    // Рисуем обрезанную часть изображения на canvas
    ctx.drawImage(
      image,
      imageX,
      imageY,
      imageCropSize,
      imageCropSize,
      0,
      0,
      80,
      80
    );

    ctx.restore();
  }, [imageLoaded, cropArea, imageSize, displaySize]);

  // Обновляем предварительный просмотр при изменении cropArea
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Обработка начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded || !containerRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  }, [imageLoaded]);

  // Обработка начала перетаскивания (тач)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!imageLoaded || !containerRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragStart({ 
      x: touch.clientX - rect.left, 
      y: touch.clientY - rect.top 
    });
  }, [imageLoaded]);

  // Обработка перетаскивания (тач)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !imageLoaded || !containerRef.current) return;

    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    setCropArea(prev => ({
      x: Math.max(0, Math.min(displaySize.width - CROP_SIZE, prev.x + deltaX)),
      y: Math.max(0, Math.min(displaySize.height - CROP_SIZE, prev.y + deltaY))
    }));

    setDragStart({ x: currentX, y: currentY });
  }, [isDragging, imageLoaded, dragStart, displaySize]);

  // Обработка окончания перетаскивания (тач)
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Обработка перетаскивания
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded || !containerRef.current) return;

    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    setCropArea(prev => ({
      x: Math.max(0, Math.min(displaySize.width - CROP_SIZE, prev.x + deltaX)),
      y: Math.max(0, Math.min(displaySize.height - CROP_SIZE, prev.y + deltaY))
    }));

    setDragStart({ x: currentX, y: currentY });
  }, [isDragging, imageLoaded, dragStart, displaySize]);

  // Обработка окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Добавляем глобальные обработчики для перетаскивания (мышь и тач)
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!imageLoaded || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const deltaX = currentX - dragStart.x;
        const deltaY = currentY - dragStart.y;

        setCropArea(prev => ({
          x: Math.max(0, Math.min(displaySize.width - CROP_SIZE, prev.x + deltaX)),
          y: Math.max(0, Math.min(displaySize.height - CROP_SIZE, prev.y + deltaY))
        }));

        setDragStart({ x: currentX, y: currentY });
      };

      const handleGlobalTouchMove = (e: TouchEvent) => {
        if (!imageLoaded || !containerRef.current) return;
        
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        const deltaX = currentX - dragStart.x;
        const deltaY = currentY - dragStart.y;

        setCropArea(prev => ({
          x: Math.max(0, Math.min(displaySize.width - CROP_SIZE, prev.x + deltaX)),
          y: Math.max(0, Math.min(displaySize.height - CROP_SIZE, prev.y + deltaY))
        }));

        setDragStart({ x: currentX, y: currentY });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      const handleGlobalTouchEnd = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isDragging, imageLoaded, dragStart, displaySize]);

  // Функция для обрезки изображения в круг
  const handleCropComplete = useCallback(async () => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Конвертируем координаты дисплея в координаты изображения
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;
    
    const imageX = cropArea.x * scaleX;
    const imageY = cropArea.y * scaleY;
    const imageCropSize = CROP_SIZE * scaleX;

    console.log('🔍 [ImageCropper] Координаты обрезки:', {
      displayCrop: cropArea,
      imageSize,
      displaySize,
      scale: { x: scaleX, y: scaleY },
      imageCrop: { x: imageX, y: imageY, size: imageCropSize }
    });

    // Устанавливаем размеры canvas для финального изображения 230x230
    canvas.width = 230;
    canvas.height = 230;

    // Создаем круглую маску
    ctx.save();
    ctx.beginPath();
    ctx.arc(115, 115, 115, 0, Math.PI * 2); // Радиус 115px для размера 230x230
    ctx.clip();

    // Рисуем обрезанную часть изображения на canvas
    ctx.drawImage(
      image,
      imageX,
      imageY,
      imageCropSize,
      imageCropSize,
      0,
      0,
      230,
      230
    );

    ctx.restore();

    // Конвертируем canvas в Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: 'image/png',
            lastModified: Date.now(),
          });
          console.log('✅ [ImageCropper] Обрезанный файл создан:', croppedFile);
          onCropComplete(croppedFile);
        }
      },
      'image/png',
      0.9
    );
  }, [imageLoaded, cropArea, imageSize, displaySize, imageFile.name, onCropComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-white">Миниатюра</h3>
          </div>
        </div>

        {/* Область обрезки */}
        <div className="flex flex-col items-center space-y-6">
          <div 
            ref={containerRef}
            className="relative max-w-[400px] max-h-[400px] overflow-hidden"
          >
            {/* Изображение */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop me"
              className="max-w-full max-h-[400px] object-contain"
              onLoad={handleImageLoad}
              draggable={false}
            />
            
            {/* Маска за кругом - показывает что не войдет в миниатюру */}
            {imageLoaded && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <circle
                      cx={cropArea.x + CROP_SIZE/2}
                      cy={cropArea.y + CROP_SIZE/2}
                      r={CROP_SIZE/2}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.5)"
                  mask="url(#crop-mask)"
                />
              </svg>
            )}

            {/* Круглая рамка обрезки - теперь в пикселях! */}
            {imageLoaded && (
              <div
                className="absolute border-2 border-white rounded-full cursor-move"
                style={{
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  width: `${CROP_SIZE}px`,
                  height: `${CROP_SIZE}px`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            )}
          </div>

          {/* Предварительный просмотр */}
          {imageLoaded && (
            <div className="flex flex-col items-center space-y-2">
              <p className="text-gray-300 text-sm">Предварительный просмотр (круглая):</p>
              <div className="w-20 h-20 border-2 border-violet-400 rounded-full overflow-hidden bg-gray-700">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full rounded-full"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Скрытый canvas для финальной обрезки */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {/* Кнопка "Продолжить" */}
          <button
            onClick={handleCropComplete}
            disabled={!imageLoaded}
            className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-medium py-4 px-6 rounded-lg transition-colors"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;