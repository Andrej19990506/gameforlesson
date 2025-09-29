import { useState } from 'react';

const SplashScreen = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "Он закрыл чат",
    "Ты долго не отвечала", 
    "Совсем офигела"
  ];

  const handleNext = () => {
    if (currentMessage < messages.length - 1) {
      setCurrentMessage(currentMessage + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 z-50 flex items-center justify-center overflow-hidden">
      {/* Летающие вопросительные знаки */}

      
      <div className="text-center text-white relative z-10">
        {/* Центральный элемент */}
        
        <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 mb-8 max-w-lg mx-auto border border-gray-700 shadow-2xl">
          <p className="text-3xl font-bold text-gray-300 animate-pulse">
            {messages[currentMessage]}
          </p>
        </div>
        
        {/* Кнопка для перехода к следующему сообщению */}
        {currentMessage < messages.length - 1 && (
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Далее ➡️
          </button>
        )}
        
        {/* Прогресс */}
        <div className="mt-6 flex justify-center space-x-3">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full ${
                index <= currentMessage ? 'bg-gray-500' : 'bg-gray-700'
              } ${index === currentMessage ? 'animate-ping' : ''}`}
            ></div>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default SplashScreen;