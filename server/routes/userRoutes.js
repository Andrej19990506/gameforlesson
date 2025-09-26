import express from "express";
import { signup, login, updateUserProfile, checkAuth } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";


export const userRouter = express.Router();
 userRouter.post("/signup", signup);
 userRouter.post("/login", login);
 userRouter.put("/update-profile", protectRoute, updateUserProfile);
 userRouter.get("/checkauth", protectRoute, checkAuth);

 export default userRouter;