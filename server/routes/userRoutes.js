import express from "express";
import { signup, login, updateUserProfile, checkAuth, deleteUserAccount, uploadProfilePic, searchUsersByUsername, getUserById } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";


export const userRouter = express.Router();
 userRouter.post("/signup", signup);
 userRouter.post("/login", login);
 userRouter.put("/update-profile", protectRoute, uploadProfilePic, updateUserProfile);
 userRouter.get("/checkauth", protectRoute, checkAuth);
 userRouter.get("/search", protectRoute, searchUsersByUsername);
 userRouter.get("/:userId", protectRoute, getUserById);
 userRouter.delete("/delete", protectRoute, deleteUserAccount);

 export default userRouter;