import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getUsersForSidebar, getMessages, markMessageAsSeen, sendMessage, deleteMessage } from "../controllers/messageController.js";

export const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);

export default messageRouter;