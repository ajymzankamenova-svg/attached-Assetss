import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import tasksRouter from "./tasks.js";
import volunteersRouter from "./volunteers.js";
import notificationsRouter from "./notifications.js";
import aiRouter from "./ai.js";
import openaiChatRouter from "./openai-chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(volunteersRouter);
router.use(notificationsRouter);
router.use(aiRouter);
router.use(openaiChatRouter);

export default router;
