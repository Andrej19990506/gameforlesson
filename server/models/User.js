import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    username: {type: String, unique: true, sparse: true}, // sparse: true позволяет null значения
    password: {type: String, required: true, minlength: 6},
    profilePic: {type: String, default: ""},
    bio: {type: String},
    lastSeen: {type: Date, default: Date.now},
    scrollPositions: {type: Map, of: Number, default: new Map()}, // userId -> scrollPosition
}, {timestamps: true});

const User = mongoose.model("User", userSchema)

export default User