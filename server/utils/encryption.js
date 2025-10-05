import crypto from 'crypto';

// Генерируем ключ шифрования из переменной окружения
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
    : crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Шифрует текст сообщения
 * @param {string} text - Текст для шифрования
 * @returns {Object} - Объект с зашифрованными данными
 */
export const encryptMessage = (text) => {
    try {
        if (!text || typeof text !== 'string') {
            console.log('⚠️ [Encryption] Пустой или неверный текст для шифрования');
            return null;
        }

        // Генерируем случайный IV (Initialization Vector)
        const iv = crypto.randomBytes(16);
        
        // Создаем cipher с алгоритмом AES-256-GCM (правильный API для Node.js v22+)
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        // Шифруем текст
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Получаем тег аутентификации
        const authTag = cipher.getAuthTag();
        
        console.log('🔐 [Encryption] Сообщение зашифровано, длина:', text.length);
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: ALGORITHM
        };
        
    } catch (error) {
        console.error('❌ [Encryption] Ошибка шифрования:', error.message);
        return null;
    }
};

/**
 * Расшифровывает текст сообщения
 * @param {Object} encryptedData - Объект с зашифрованными данными
 * @returns {string|null} - Расшифрованный текст или null при ошибке
 */
export const decryptMessage = (encryptedData) => {
    try {
        if (!encryptedData || !encryptedData.encrypted) {
            console.log('⚠️ [Encryption] Нет данных для расшифровки');
            return null;
        }

        // Создаем decipher (правильный API для Node.js v22+)
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(encryptedData.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        // Расшифровываем текст
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('🔓 [Encryption] Сообщение расшифровано, длина:', decrypted.length);
        
        return decrypted;
        
    } catch (error) {
        console.error('❌ [Encryption] Ошибка расшифровки:', error.message);
        return null;
    }
};

/**
 * Проверяет, зашифрованы ли данные
 * @param {*} data - Данные для проверки
 * @returns {boolean} - true если данные зашифрованы
 */
export const isEncrypted = (data) => {
    return data && 
           typeof data === 'object' && 
           data.encrypted && 
           data.iv && 
           data.authTag && 
           data.algorithm === ALGORITHM;
};

/**
 * Генерирует новый ключ шифрования (для первоначальной настройки)
 * @returns {string} - Новый ключ в hex формате
 */
export const generateNewKey = () => {
    const newKey = crypto.randomBytes(32);
    console.log('🔑 [Encryption] Новый ключ сгенерирован');
    return newKey.toString('hex');
};

// Экспортируем для использования в других модулях
export default {
    encryptMessage,
    decryptMessage,
    isEncrypted,
    generateNewKey
};