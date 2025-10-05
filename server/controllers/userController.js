import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import multer from 'multer';

// Настройка multer для обработки файлов в памяти
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB максимум
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'), false);
        }
    }
});

// Middleware для обработки одного файла
export const uploadProfilePic = upload.single('profilePic');

//signup new user
export const signup = async (req, res) => {
    const {email, name, password, bio, username} = req.body;
    
    console.log(`👤 [signup] Регистрация нового пользователя:`, {
        email, name, bio, username,
        hasUsername: !!username,
        usernameLength: username ? username.length : 0
    });
    
    try {
        if(!email || !name || !password || !bio){
            return res.json({success: false, message: "Missing details"});
        }
        
        // Проверяем уникальность email
        const existingUserByEmail = await User.findOne({email});
        if(existingUserByEmail){
            return res.json({success: false, message: "User with this email already exists"});
        }
        
        // Проверяем уникальность username если он предоставлен
        if(username) {
            const existingUserByUsername = await User.findOne({username});
            if(existingUserByUsername){
                return res.json({success: false, message: "Username already taken"});
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email, name, password: hashedPassword, bio, username
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
        const {name, bio, username} = req.body;
        const userid = req.user._id;
        let updatedUser;

        console.log(`👤 [updateUserProfile] Обновление профиля для пользователя: ${userid}`);
        console.log(`👤 [updateUserProfile] Данные для обновления:`, {
            name, bio, username,
            hasUsername: !!username,
            usernameLength: username ? username.length : 0
        });

        // Проверяем уникальность username если он предоставлен
        if(username) {
            const existingUserByUsername = await User.findOne({username, _id: {$ne: userid}});
            if(existingUserByUsername){
                return res.json({success: false, message: "Username already taken"});
            }
        }

        if (!req.file) {
            // Если изображение не загружено, обновляем только текст
            console.log(`👤 [updateUserProfile] Обновление без изображения`);
            updatedUser = await User.findByIdAndUpdate(userid, {name, bio, username}, {new: true});
        } else {
            // Обрабатываем изображение
            console.log(`👤 [updateUserProfile] Обработка изображения:`, {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            
            // Загружаем файл напрямую в Cloudinary без конвертации в base64
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        quality: 90, // Высокое качество (0-100)
                        fetch_format: 'auto', // Автоматический выбор формата
                        width: 400, // Точный размер аватарки
                        height: 400, // Точный размер аватарки
                        crop: 'fill', // Заполнение контейнера
                        gravity: 'face', // Фокус на лицах для аватарок
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ [updateUserProfile] Ошибка загрузки в Cloudinary:', error);
                            reject(error);
                        } else {
                            console.log('✅ [updateUserProfile] Изображение загружено в Cloudinary:', result.secure_url);
                            resolve(result);
                        }
                    }
                ).end(req.file.buffer);
            });
            
            updatedUser = await User.findByIdAndUpdate(
                userid, 
                {name, bio, username, profilePic: uploadResult.secure_url}, 
                {new: true}
            );
        }
        
        console.log(`✅ [updateUserProfile] Профиль успешно обновлен`);
        res.json({success: true, user: updatedUser, message: "User updated successfully"});
        
    } catch (error) {
        console.log(`❌ [updateUserProfile] Ошибка:`, error);
        res.json({success: false, message: error.message});
    }
}

//controller to search users by username
export const searchUsersByUsername = async (req, res) => {
    try {
        const {username} = req.query;
        const currentUserId = req.user._id;
        
        console.log(`🔍 [searchUsersByUsername] Поиск пользователей по username: ${username}`);
        
        if (!username || username.trim().length < 2) {
            return res.json({success: false, message: "Username must be at least 2 characters long"});
        }
        
        // Ищем пользователей по username (регистронезависимый поиск)
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: currentUserId } // Исключаем текущего пользователя
        }).select("-password").limit(10);
        
        console.log(`🔍 [searchUsersByUsername] Найдено ${users.length} пользователей`);
        
        res.json({success: true, users, message: `Found ${users.length} users`});
        
    } catch (error) {
        console.log(`❌ [searchUsersByUsername] Ошибка:`, error);
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

//controller to get user by ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`👤 [getUserById] Получение пользователя по ID: ${userId}`);
        
        const user = await User.findById(userId).select("-password");
        
        if (!user) {
            console.log(`❌ [getUserById] Пользователь не найден: ${userId}`);
            return res.json({success: false, message: "User not found"});
        }
        
        console.log(`✅ [getUserById] Пользователь найден: ${user.name}`);
        res.json({success: true, user});
        
    } catch (error) {
        console.log('Error in getUserById:', error);
        res.json({success: false, message: error.message});
    }
}