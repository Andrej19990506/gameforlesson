import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

//signup new user
export const signup = async (req, res) => {
    const {email, name, password, bio} = req.body;
    try {
        if(!email || !name || !password || !bio){
            return res.json({success: false, message: "Missing details"});
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success: false, message: "User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email, name, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        res.json({success: true, userData: newUser, message: "User created successfully", token});
        } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

 //controller to login user
 export const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        const userData = await User.findOne({email});

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if(!isPasswordCorrect){
            return res.json({success: false, message: "Invalid password"});
        }

        const token = generateToken(userData._id);
        res.json({success: true, userData, message: "User logged in successfully", token});
    }   catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
 }

 //controller to check if user is authenticated
 export const checkAuth = async (req, res) => {
    res.json({success: true, user: req.user, message: "User is authenticated"});
 }

 //controller to update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const {profilePic, name, bio} = req.body;

        const userid = req.user._id;
        let updatedUser;

        if(!profilePic){
           updatedUser = await User.findByIdAndUpdate(userid, {name, bio}, {new: true});
        }else{
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userid, {name, bio, profilePic: upload.secure_url}, {new: true});
        }
        res.json({success: true, user: updatedUser, message: "User updated successfully"});
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//controller to delete user account
export const deleteUserAccount = async (req, res) => {
    try {
        const {password} = req.body;
        const userId = req.user._id;

        console.log('Delete account request:', { userId, password: password ? 'provided' : 'missing' });

        // Находим пользователя
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.json({success: false, message: "Пользователь не найден"});
        }

        console.log('User found:', user.email);

        // Проверяем пароль
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        console.log('Password check result:', isPasswordCorrect);
        
        if (!isPasswordCorrect) {
            console.log('Invalid password for user:', user.email);
            return res.json({success: false, message: "Неверный пароль"});
        }

        // Удаляем пользователя
        const deletedUser = await User.findByIdAndDelete(userId);
        console.log('User deleted:', deletedUser ? 'success' : 'failed');

        res.json({success: true, message: "Аккаунт успешно удален"});
        
    } catch (error) {
        console.log('Error in deleteUserAccount:', error);
        res.json({success: false, message: error.message});
    }
}