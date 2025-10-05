import crypto from 'crypto';

/**
 * Генерирует новый ключ шифрования для переменной окружения
 * Запустите этот скрипт для генерации нового ключа
 */
const generateEncryptionKey = () => {
    const key = crypto.randomBytes(32);
    console.log('🔑 Новый ключ шифрования сгенерирован:');
    console.log('ENCRYPTION_KEY=' + key.toString('hex'));
    console.log('\n📝 Добавьте эту строку в ваш .env файл');
    console.log('⚠️  ВАЖНО: Сохраните этот ключ в безопасном месте!');
    console.log('⚠️  БЕЗ ЭТОГО КЛЮЧА НЕВОЗМОЖНО РАСШИФРОВАТЬ СООБЩЕНИЯ!');
};

// Запускаем генерацию
generateEncryptionKey();
