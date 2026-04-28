import { Router, type IRouter } from "express";
import { extractUser } from "../middleware/auth";
import healthRouter from "./health";
import usersRouter from "./users";
import booksRouter from "./books";
import sessionsRouter from "./sessions";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(extractUser as any);
router.use(healthRouter);
router.use(usersRouter);
router.use(booksRouter);
router.use(sessionsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);

export default router;
