import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { encryptMessage } from '../utils/encryption.js';
import 'dotenv/config';

/**
 * Скрипт для шифрования существующих сообщений в базе данных
 * Запустите этот скрипт один раз после внедрения шифрования
 */
const migrateExistingMessages = async () => {
    try {
        console.log('🔄 Начинаем миграцию существующих сообщений...');
        
        // Подключаемся к базе данных
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app');
        console.log('✅ Подключение к базе данных установлено');
        
        // Находим все незашифрованные сообщения
        const unencryptedMessages = await Message.find({ 
            isEncrypted: { $ne: true },
            text: { $exists: true, $ne: null, $ne: '' }
        });
        
        console.log(`📊 Найдено ${unencryptedMessages.length} незашифрованных сообщений`);
        
        if (unencryptedMessages.length === 0) {
            console.log('✅ Все сообщения уже зашифрованы!');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Шифруем каждое сообщение
        for (const message of unencryptedMessages) {
            try {
                console.log(`🔐 Шифрование сообщения ID: ${message._id}`);
                
                // Шифруем текст
                const encryptedData = encryptMessage(message.text);
                
                if (encryptedData) {
                    // Обновляем сообщение в базе данных
                    await Message.findByIdAndUpdate(message._id, {
                        text: encryptedData,
                        isEncrypted: true
                    });
                    
                    successCount++;
                    console.log(`✅ Сообщение ${message._id} успешно зашифровано`);
                } else {
                    console.log(`❌ Ошибка шифрования сообщения ${message._id}`);
                    errorCount++;
                }
                
            } catch (error) {
                console.error(`❌ Ошибка при обработке сообщения ${message._id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 Результаты миграции:');
        console.log(`✅ Успешно зашифровано: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        console.log(`📊 Всего обработано: ${unencryptedMessages.length}`);
        
        if (successCount > 0) {
            console.log('\n🎉 Миграция завершена! Все сообщения теперь зашифрованы.');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка миграции:', error);
    } finally {
        // Закрываем соединение с базой данных
        await mongoose.disconnect();
        console.log('🔌 Соединение с базой данных закрыто');
        process.exit(0);
    }
};

// Запускаем миграцию
migrateExistingMessages();
