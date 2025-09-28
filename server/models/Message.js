import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    text: {type: String},
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

const Message = mongoose.model("Message", messageSchema)

export default Message