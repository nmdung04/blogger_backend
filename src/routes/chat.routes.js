import { Router } from "express";
import { sendMessage, streamMessage } from "../controllers/chat.controller.js";

const router = Router();

router.post("/chat", sendMessage);
router.post("/chat/stream", streamMessage);

export default router;
