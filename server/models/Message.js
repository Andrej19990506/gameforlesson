import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    // Текст сообщения (может быть зашифрован или обычным текстом)
    text: {
        type: mongoose.Schema.Types.Mixed, // Может быть строкой или объектом с зашифрованными данными
        default: null
    },
    // Флаг, указывающий зашифровано ли сообщение
    isEncrypted: {
        type: Boolean,
        default: false
    },
    image: {type: String},
    senderId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    seen: {type: Boolean, default: false},
    reactions: [{
        emoji: {type: String, required: true},
        userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        createdAt: {type: Date, default: Date.now}
    }]
}, {timestamps: true});

// Виртуальное поле для получения расшифрованного текста
messageSchema.virtual('decryptedText').get(function() {
    if (this.isEncrypted && typeof this.text === 'object') {
        // Здесь будет логика расшифровки (вызывается из контроллера)
        return this.text;
    }
    return this.text;
});

// Метод для установки зашифрованного текста
messageSchema.methods.setEncryptedText = function(encryptedData) {
    this.text = encryptedData;
    this.isEncrypted = true;
    return this;
};

// Метод для получения расшифрованного текста
messageSchema.methods.getDecryptedText = function(decryptFunction) {
    if (this.isEncrypted && typeof this.text === 'object') {
        return decryptFunction(this.text);
    }
    return this.text;
};

const Message = mongoose.model("Message", messageSchema)

export default Message