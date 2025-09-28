import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap} from "../server.js";



//Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
       const userId = req.user._id;
       const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");

       //count number of messages  not seen and get last messages
       const unseenMessages = {}
       const lastMessages = {}
       const promises = filteredUsers.map(async (user) => {
        // Count unseen messages
        const unseenMsgs = await Message.find({senderId: user._id, receiverId: userId, seen: false});
        if(unseenMsgs.length > 0){
            unseenMessages[user._id] = unseenMsgs.length;
        }
        
        // Get last message between current user and this user
        const lastMessage = await Message.findOne({
            $or: [
                {senderId: userId, receiverId: user._id},
                {senderId: user._id, receiverId: userId}
            ]
        }).sort({createdAt: -1});
        
        if(lastMessage) {
            lastMessages[user._id] = lastMessage;
        }
       })
       await Promise.all(promises);
       res.json({success: true, users: filteredUsers, unseenMessages, lastMessages});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//Get all messages for a user
export const getMessages = async (req, res) => {
    try {
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId}
            ]
        })
        await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});

        res.json({success: true, messages});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//api to mark a message as seen using message id

export const markMessageAsSeen = async (req, res) => {
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen: true});
        res.json({success: true, message: "Message marked as seen"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// Send a message to selected user
export const sendMessage = async (req, res) => {
    try {
        const{text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;

        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({text, image: imageUrl, senderId, receiverId});

        //Emit the message to the receiver`s socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({success: true, message: newMessage});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//Delete message
export const deleteMessage = async (req, res) => {
    try {
        const {id:messageId} = req.params;
        const myId = req.user._id;

        const message = await Message.findById(messageId);
        if(!message) {
            return res.json({success: false, message: "Message not found"});
        }

        // Проверяем, что пользователь может удалить сообщение (только свои сообщения)
        if(message.senderId.toString() !== myId.toString()) {
            return res.json({success: false, message: "Unauthorized"});
        }

        await Message.findByIdAndDelete(messageId);
        
        // Отправляем событие удаления через WebSocket
        const receiverSocketId = userSocketMap[message.receiverId.toString()];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("messageDeleted", {messageId});
        }
        
        res.json({success: true, message: "Message deleted successfully"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}