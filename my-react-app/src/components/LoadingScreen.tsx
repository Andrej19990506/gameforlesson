
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: 'var(--color-gray-900)'}}>
      <div className="text-center text-white">
        {/* Простой спиннер */}
        <div className="flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-white"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
